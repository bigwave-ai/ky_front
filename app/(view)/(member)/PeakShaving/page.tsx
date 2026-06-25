'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import mmc from './PeakShaving.module.css'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import WarningModal from '@/app/components/libs/modals/modal-warnning'
import { withAppPrefix } from '@/config/environment'
import { useTranslation } from '@/app/services/i18n/LanguageProvider'
import { getSessionUserInfo } from '@/app/services/util/session-info'

/*
 * 01. 구분     : Page 컴포넌트 (Client)
 * 02. 업무구분  : 멤버/관리자 - 효율 기반 피크 관리 콘솔
 * 03. 설명     : 압력당 전력(kW/bar) 효율 랭킹·열화 감지 + 설비 피크 + 효율가중 운영 스케줄
 * 04. 작성일자  : 2026.06.25 (효율 기반 재설계)
 */

type EffDeviceType = {
  device_id: string
  device_name: string
  drive_mode: string
  running: boolean
  kw_per_bar: number | null
  avg_kw: number
  avg_bar: number
  peak_kw: number
  degrade_pct: number
  loss_pct: number
  status: 'good' | 'watch' | 'poor' | 'idle'
  rank: number
}
type ScheduleRow = { hour: number; demand_kw: number; units_on: number; run: string[]; pause: string[] }
type EffResult = {
  company_name: string
  facility_avg_kw: number
  facility_peak_kw: number
  per_unit_kw: number
  devices: EffDeviceType[]
  schedule: ScheduleRow[]
  recommendations: string[]
}
type AdminCustomerOptionType = { id: string; name: string }

const toStr = (v: unknown) => String(v ?? '').trim()

const fetchAdminCustomers = async (): Promise<AdminCustomerOptionType[]> => {
  const res = await fetch(withAppPrefix('/api/admin/getCustomers'), { method: 'GET' })
  const json = (await res.json().catch(() => null)) as any
  if (!res.ok || !json?.success) throw new Error(json?.message ?? '고객사 목록 조회에 실패했습니다.')
  return (Array.isArray(json.data) ? json.data : [])
    .map((it: any) => ({ id: toStr(it.id), name: toStr(it.name) || '-' }))
    .filter((it: AdminCustomerOptionType) => Boolean(it.id))
    .sort((a: AdminCustomerOptionType, b: AdminCustomerOptionType) => a.name.localeCompare(b.name, 'ko'))
}

export default function PeakShavingPage() {
  const { t } = useTranslation()

  const [sessionCustomerId, setSessionCustomerId] = useState('')
  const [sessionRole, setSessionRole] = useState('')
  const [customerOptions, setCustomerOptions] = useState<AdminCustomerOptionType[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerKeyword, setCustomerKeyword] = useState('')
  const [isCustomerSearching, setIsCustomerSearching] = useState(false)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const customerComboRef = useRef<HTMLDivElement | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<EffResult | null>(null)

  const [warnOpen, setWarnOpen] = useState(false)
  const [warnTitle, setWarnTitle] = useState('')
  const [warnDetail, setWarnDetail] = useState('')
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title)
    setWarnDetail(detail)
    setWarnOpen(true)
  }

  const isAdminUser = useMemo(() => {
    const r = sessionRole.trim().toLowerCase()
    return r === 'admin' || r.includes('admin') || r.includes('관리')
  }, [sessionRole])
  const resolvedCustomerId = isAdminUser ? selectedCustomerId : sessionCustomerId
  const shouldHide = isAdminUser && !toStr(selectedCustomerId)

  const filteredCustomerOptions = useMemo(() => {
    const kw = customerKeyword.trim().toLowerCase()
    const filtered = kw && isCustomerSearching ? customerOptions.filter((it) => it.name.toLowerCase().includes(kw)) : customerOptions
    if (!selectedCustomerId) return filtered
    if (filtered.some((it) => it.id === selectedCustomerId)) return filtered
    const sel = customerOptions.find((it) => it.id === selectedCustomerId)
    return sel ? [sel, ...filtered] : filtered
  }, [customerKeyword, customerOptions, selectedCustomerId, isCustomerSearching])

  const devices = result?.devices ?? []
  const rated = devices.filter((d) => d.kw_per_bar != null)
  const bestEff = rated.length ? Math.min(...rated.map((d) => d.kw_per_bar as number)) : null
  const worst = rated.length ? rated.reduce((a, b) => ((b.kw_per_bar as number) > (a.kw_per_bar as number) ? b : a)) : null
  const poorCount = devices.filter((d) => d.status === 'poor').length

  const STATUS_META: Record<string, { label: string; cls: string }> = {
    good: { label: t('효율 양호'), cls: mmc.peak_badgeNormal },
    watch: { label: t('주의'), cls: mmc.peak_badgeWarning },
    poor: { label: t('효율 저하'), cls: mmc.peak_badgeExceedRed },
    idle: { label: t('정지'), cls: mmc.peak_badgeUnknown },
  }

  const loadEfficiency = async (customerId: string) => {
    if (!customerId) return
    setIsLoading(true)
    setResult(null)
    try {
      const res = await fetch(withAppPrefix(`/api/optimize/efficiency?customer_id=${encodeURIComponent(customerId)}&lookback_hours=336`))
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok || !json) {
        throw new Error(json?.message ?? json?.detail ?? `${t('효율 분석 실패')} (HTTP ${res.status})`)
      }
      setResult(json as EffResult)
    } catch (e: any) {
      openWarn(t('효율 분석 실패'), e?.message ?? t('알 수 없는 오류가 발생했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const s = getSessionUserInfo()
    setSessionRole(s.role)
    setSessionCustomerId(s.customerId)
    if (!s.isAdmin) return
    let disposed = false
    void (async () => {
      try {
        const opts = await fetchAdminCustomers()
        if (!disposed) setCustomerOptions(opts)
      } catch {
        if (!disposed) setCustomerOptions([])
      }
    })()
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!isAdminUser) return
    const sel = customerOptions.find((it) => it.id === selectedCustomerId)
    if (sel) setCustomerKeyword(sel.name)
  }, [isAdminUser, customerOptions, selectedCustomerId])

  useEffect(() => {
    if (!isAdminUser) return
    const onClick = (e: MouseEvent) => {
      if (customerComboRef.current && !customerComboRef.current.contains(e.target as Node)) setIsCustomerDropdownOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [isAdminUser])

  // 고객사 확정 시 자동 분석(수동 입력/실행 없음)
  useEffect(() => {
    const cid = toStr(resolvedCustomerId)
    setResult(null)
    if (cid) void loadEfficiency(cid)
  }, [resolvedCustomerId])

  const handleCustomerSelect = (it: AdminCustomerOptionType) => {
    setCustomerKeyword(it.name)
    setIsCustomerSearching(false)
    if (selectedCustomerId !== it.id) setSelectedCustomerId(it.id)
    setIsCustomerDropdownOpen(false)
  }

  const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`

  return (
    <div className={mmc.peak_root}>
      <header className={`${mmc.peak_pageHead} ${mmc.peak_stageFadeUp}`}>
        <div className={mmc.peak_pageHeadTop}>
          <div className={mmc.peak_pageHeadText}>
            <h1>{t('효율 기반 피크 관리')}</h1>
            <p>{t('압력당 전력(kW/bar)으로 장비 효율을 비교해 저효율·열화 장비를 찾고, 부하 감산 시 어느 장비부터 줄일지 안내합니다.')}</p>
          </div>
          {isAdminUser && (
            <div className={mmc.peak_customerSelectBox}>
              <strong className={mmc.peak_customerSelectTitle}>{t('고객사 선택')}</strong>
              <div className={mmc.peak_customerCombo} ref={customerComboRef}>
                <input
                  type="text"
                  className={mmc.peak_customerSearchInput}
                  placeholder={t('고객사 검색 후 선택')}
                  value={customerKeyword}
                  onFocus={(e) => {
                    setIsCustomerDropdownOpen(true)
                    setIsCustomerSearching(false)
                    e.currentTarget.select()
                  }}
                  onChange={(e) => {
                    setCustomerKeyword(e.target.value)
                    setIsCustomerDropdownOpen(true)
                    setIsCustomerSearching(true)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsCustomerDropdownOpen(false)
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const first = filteredCustomerOptions[0]
                      if (first) handleCustomerSelect(first)
                    }
                  }}
                />
                <button type="button" className={mmc.peak_customerComboArrow} onClick={() => setIsCustomerDropdownOpen((p) => !p)} aria-label={t('고객사 목록 열기')}>
                  ▾
                </button>
                {isCustomerDropdownOpen && (
                  <div className={mmc.peak_customerDropdown}>
                    {filteredCustomerOptions.length ? (
                      filteredCustomerOptions.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          className={`${mmc.peak_customerDropdownItem} ${it.id === selectedCustomerId ? mmc.peak_customerDropdownItemActive : ''}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleCustomerSelect(it)}
                        >
                          {it.name}
                        </button>
                      ))
                    ) : (
                      <div className={mmc.peak_customerDropdownEmpty}>{t('검색 결과가 없습니다.')}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {!shouldHide && result && (
        <section className={mmc.peak_resultWrap}>
          {/* Fleet KPI */}
          <div className={mmc.peak_kpiRow}>
            <article className={`${mmc.peak_kpiCard} ${mmc.peak_stageFadeUp}`}>
              <span className={mmc.peak_kpiLabel}>{t('설비 평균 전력')}</span>
              <strong className={mmc.peak_kpiValue}>{result.facility_avg_kw}<small>kW</small></strong>
            </article>
            <article className={`${mmc.peak_kpiCard} ${mmc.peak_kpiCardBlue} ${mmc.peak_stageFadeUp}`}>
              <span className={mmc.peak_kpiLabel}>{t('설비 피크')}</span>
              <strong className={mmc.peak_kpiValue}>{result.facility_peak_kw}<small>kW</small></strong>
            </article>
            <article className={`${mmc.peak_kpiCard} ${mmc.peak_stageFadeUp}`}>
              <span className={mmc.peak_kpiLabel}>{t('최우수 효율')}</span>
              <strong className={mmc.peak_kpiValue}>{bestEff != null ? bestEff.toFixed(2) : '-'}<small>kW/bar</small></strong>
            </article>
            <article className={`${mmc.peak_kpiCard} ${poorCount ? mmc.peak_kpiCardDanger : ''} ${mmc.peak_stageFadeUp}`}>
              <span className={mmc.peak_kpiLabel}>{t('점검 권고 장비')}</span>
              <strong className={mmc.peak_kpiValue}>{poorCount}<small>{t('대')}</small></strong>
            </article>
          </div>

          {/* 권고 */}
          <article className={`${mmc.peak_actionCard} ${mmc.peak_stageFadeUp}`}>
            <div className={mmc.peak_cardHead}>
              <h3>{t('진단 결과')}</h3>
            </div>
            {result.recommendations.map((r, i) => (
              <div key={i} className={mmc.peak_recoLine}>• {r}</div>
            ))}
          </article>

          {/* 효율 랭킹 */}
          <article className={`${mmc.peak_actionCard} ${mmc.peak_stageFadeUp}`}>
            <div className={mmc.peak_cardHead}>
              <h3>{t('장비 효율 랭킹')}</h3>
              <p>{t('압력당 전력(kW/bar)이 낮을수록 효율적입니다. 같은 압력을 더 적은 전력으로 내는 장비.')}</p>
            </div>
            <div className={mmc.peak_actionRows}>
              {devices.map((d) => {
                const barRate = bestEff && d.kw_per_bar ? Math.min(100, Math.round((bestEff / d.kw_per_bar) * 100)) : 0
                return (
                  <div key={d.device_id} className={mmc.peak_effRow}>
                    <div className={mmc.peak_effRank}>#{d.rank}</div>
                    <div className={mmc.peak_actionMain}>
                      <div className={mmc.peak_actionHeadLine}>
                        <span className={`${mmc.peak_badge} ${STATUS_META[d.status]?.cls ?? ''}`}>{STATUS_META[d.status]?.label}</span>
                        <strong className={mmc.peak_actionName}>{d.device_name}</strong>
                        <span className={mmc.peak_driveChip}>{d.drive_mode}</span>
                      </div>
                      <div className={mmc.peak_actionMeta}>
                        <span><b>{d.kw_per_bar != null ? d.kw_per_bar.toFixed(2) : '-'}</b> kW/bar</span>
                        <span>{t('평균')} {d.avg_kw}kW / {d.avg_bar}bar</span>
                        {d.loss_pct > 0 && <span className={mmc.peak_overTagRed}>{t('효율 손실')} +{d.loss_pct}%</span>}
                        {d.degrade_pct >= 1 && <span className={mmc.peak_overTagRed}>{t('열화')} {d.degrade_pct}%</span>}
                      </div>
                      <div className={mmc.peak_effBarTrack}>
                        <div className={mmc.peak_effBarFill} style={{ width: `${barRate}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          {/* 운영 스케줄 */}
          <article className={`${mmc.peak_actionCard} ${mmc.peak_stageFadeUp}`}>
            <div className={mmc.peak_cardHead}>
              <h3>{t('운영 스케줄 (앞으로 6시간)')}</h3>
              <p>{t('시간대 예측 수요에 맞춰 필요한 대수만 효율 좋은 장비부터 가동. 정지 가능 장비는 비효율 장비 우선.')}</p>
            </div>
            <table className={mmc.peak_schedTable}>
              <thead>
                <tr>
                  <th>{t('시각')}</th>
                  <th>{t('예측 수요')}</th>
                  <th>{t('가동')}</th>
                  <th>{t('가동 장비')}</th>
                  <th>{t('정지 가능')}</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((s, i) => (
                  <tr key={i}>
                    <td>{hourLabel(s.hour)}</td>
                    <td>{s.demand_kw} kW</td>
                    <td><b>{s.units_on}{t('대')}</b></td>
                    <td>{s.run.join(', ')}</td>
                    <td className={mmc.peak_schedPause}>{s.pause.length ? s.pause.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        </section>
      )}

      {!shouldHide && !result && !isLoading && (
        <section className={mmc.peak_resultWrap}>
          <div className={mmc.peak_emptyHint}>{t('고객사를 선택하면 효율 분석이 자동으로 실행됩니다.')}</div>
        </section>
      )}

      <LoadingModal open={isLoading} message={t('효율을 분석하는 중입니다.')} subMessage={t('잠시만 기다려주세요.')} />
      <WarningModal open={warnOpen} title={warnTitle} detail={warnDetail} onConfirm={() => setWarnOpen(false)} onCancel={() => setWarnOpen(false)} />
    </div>
  )
}
