'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import mmc from './PeakShaving.module.css'
import CommonDonutEquipment, {
  type CommonDonutEquipmentItem,
} from '@/app/components/libs/charts/common/common-donut-equipment'
import CommonDetailMonitoringTimeSeriesChart, {
  type DetailMonitoringPointType,
} from '@/app/components/libs/charts/common/common-detail-monitoring-timeseries'
import CommonHorizontalBar from '@/app/components/libs/charts/common/common-horizontal-bar'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import WarningModal from '@/app/components/libs/modals/modal-warnning'
import { withAppPrefix } from '@/config/environment'
import { useTranslation } from '@/app/services/i18n/LanguageProvider'
import { getSessionUserInfo } from '@/app/services/util/session-info'

/*
 * 01. 구분     : Page 컴포넌트 (Client)
 * 02. 업무구분  : 멤버/관리자 - 피크 관리 어드바이저리 콘솔
 * 03. 설명     : 목표 피크선 설정 → 진단 실행 → 조치 대시보드(KPI/시계열/조치 리스트)
 * 04. 작성일자  : 2026.06.25 (재설계)
 */

/******************** 타입 ********************/
type PeakDeviceType = {
  device_id: string
  is_donor: boolean
  threshold: number
  baseline_15: number
  baseline_30: number
  shift_out_15: number
  shift_out_30: number
  distribution_text: string
  drive_mode: string
  horse_power: number | null
  is_idle: boolean
  required_shift_15: number
  required_shift_30: number
  optimized_15: number
  optimized_30: number
  status: 'normal' | 'warning' | 'exceed' | 'unknown'
  action_type: 'distribute' | 'vsd_reduce' | 'on_off_swap' | 'review' | 'none'
}

type PeakResultType = {
  success?: boolean
  message?: string
  device_count: number
  skipped_devices: unknown[]
  devices: PeakDeviceType[]
}

type AdminCustomerOptionType = { id: string; name: string }
type DeviceTargetType = { device_id: string; target_kw: number }

/******************** 정규화 ********************/
const toNumber = (v: unknown, fb = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fb
}
const toStr = (v: unknown) => String(v ?? '').trim()

const normalizeResult = (raw: any): PeakResultType => {
  const devices = Array.isArray(raw?.devices) ? raw.devices : []
  return {
    success: typeof raw?.success === 'boolean' ? raw.success : undefined,
    message: typeof raw?.message === 'string' ? raw.message : undefined,
    device_count: Math.max(0, Math.floor(toNumber(raw?.device_count, 0))),
    skipped_devices: Array.isArray(raw?.skipped_devices) ? raw.skipped_devices : [],
    devices: devices.map((d: any) => ({
      device_id: toStr(d?.device_id),
      is_donor: Boolean(d?.is_donor),
      threshold: toNumber(d?.threshold, 0),
      baseline_15: toNumber(d?.baseline_15, 0),
      baseline_30: toNumber(d?.baseline_30, 0),
      shift_out_15: toNumber(d?.shift_out_15, 0),
      shift_out_30: toNumber(d?.shift_out_30, 0),
      distribution_text: toStr(d?.distribution_text),
      drive_mode: toStr(d?.drive_mode) || 'UNKNOWN',
      horse_power: d?.horse_power == null ? null : toNumber(d?.horse_power, 0),
      is_idle: Boolean(d?.is_idle),
      required_shift_15: toNumber(d?.required_shift_15, 0),
      required_shift_30: toNumber(d?.required_shift_30, 0),
      optimized_15: toNumber(d?.optimized_15, 0),
      optimized_30: toNumber(d?.optimized_30, 0),
      status: (['normal', 'warning', 'exceed', 'unknown'].includes(d?.status) ? d.status : 'normal') as PeakDeviceType['status'],
      action_type: (['distribute', 'vsd_reduce', 'on_off_swap', 'review', 'none'].includes(d?.action_type)
        ? d.action_type
        : 'none') as PeakDeviceType['action_type'],
    })),
  }
}

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

  // 세션/고객사
  const [sessionCustomerId, setSessionCustomerId] = useState('')
  const [sessionRole, setSessionRole] = useState('')
  const [customerOptions, setCustomerOptions] = useState<AdminCustomerOptionType[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerKeyword, setCustomerKeyword] = useState('')
  const [isCustomerSearching, setIsCustomerSearching] = useState(false)
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const customerComboRef = useRef<HTMLDivElement | null>(null)

  // 목표선
  const [autoShavePct, setAutoShavePct] = useState(10) // 자동 목표선 셰이빙 비율(%)
  const [companyTargetInput, setCompanyTargetInput] = useState('')
  const [savedCompanyTarget, setSavedCompanyTarget] = useState<number | null>(null)
  const [deviceTargets, setDeviceTargets] = useState<Record<string, number>>({})
  const [deviceTargetInputs, setDeviceTargetInputs] = useState<Record<string, string>>({})
  const [isSavingTarget, setIsSavingTarget] = useState(false)

  // 진단
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<PeakResultType | null>(null)
  const [deviceNameMap, setDeviceNameMap] = useState<Record<string, string>>({})
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [historyMap, setHistoryMap] = useState<Record<string, DetailMonitoringPointType[]>>({})

  // 경고 모달
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

  /******************** 파생 ********************/
  const devices = result?.devices ?? []
  const sortedDevices = useMemo(() => {
    const rank: Record<string, number> = { exceed: 0, warning: 1, normal: 2, unknown: 3 }
    const over = (d: PeakDeviceType) => Math.max(d.required_shift_15, d.required_shift_30)
    return [...devices].sort((a, b) => (rank[a.status] - rank[b.status]) || (over(b) - over(a)))
  }, [devices])

  const exceedCount = devices.filter((d) => d.status === 'exceed').length
  const warningCount = devices.filter((d) => d.status === 'warning').length
  const normalCount = devices.filter((d) => d.status === 'normal' || d.status === 'unknown').length
  const totalOver = devices.reduce((s, d) => s + Math.max(0, d.required_shift_15, d.required_shift_30), 0)
  const complianceRate = devices.length ? Math.round(((devices.length - exceedCount) / devices.length) * 100) : 100

  const donutLegend: CommonDonutEquipmentItem[] = useMemo(
    () => [
      { label: t('목표 이내'), value: normalCount, color: '#2bb673', unit: t('대') },
      { label: t('주의'), value: warningCount, color: '#e9a24f', unit: t('대') },
      { label: t('셰이빙 권고'), value: exceedCount, color: '#1a78b0', unit: t('대') },
    ],
    [normalCount, warningCount, exceedCount, t],
  )

  const selectedDevice = useMemo(() => devices.find((d) => d.device_id === selectedDeviceId) ?? null, [devices, selectedDeviceId])
  const heroForecast = useMemo<DetailMonitoringPointType[]>(() => {
    if (!selectedDevice) return []
    const hist = historyMap[selectedDevice.device_id] ?? []
    const lastTime = hist.length ? hist[hist.length - 1].time : t('현재')
    return [
      { time: lastTime, value: hist.length ? hist[hist.length - 1].value : selectedDevice.baseline_15 },
      { time: t('15분 후'), value: selectedDevice.baseline_15 },
      { time: t('30분 후'), value: selectedDevice.baseline_30 },
    ]
  }, [selectedDevice, historyMap, t])

  const deviceName = (id: string, idx?: number) => deviceNameMap[id] || `Compressor${(idx ?? 0) + 1}`

  /******************** 표시 헬퍼 ********************/
  const STATUS_META: Record<string, { label: string; cls: string }> = {
    exceed: { label: t('셰이빙 권고'), cls: mmc.peak_badgeExceed },
    warning: { label: t('주의'), cls: mmc.peak_badgeWarning },
    normal: { label: t('목표 이내'), cls: mmc.peak_badgeNormal },
    unknown: { label: t('목표선 미설정'), cls: mmc.peak_badgeUnknown },
  }
  const ACTION_META: Record<string, string> = {
    distribute: t('부하 분배'),
    vsd_reduce: t('VSD 감산'),
    on_off_swap: t('교대/정지'),
    review: t('구동타입 확인'),
    none: t('조치 없음'),
  }
  const fmtKw = (v: number) => `${toNumber(v).toFixed(1)} kW`

  /******************** 데이터 로드 ********************/
  const loadTargets = async (customerId: string) => {
    try {
      const res = await fetch(withAppPrefix(`/api/optimize/peak-target?customer_id=${encodeURIComponent(customerId)}`))
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok || !json) return
      const company = json?.company_target_kw
      setSavedCompanyTarget(typeof company === 'number' ? company : null)
      setCompanyTargetInput(typeof company === 'number' ? String(company) : '')
      const map: Record<string, number> = {}
      const inputs: Record<string, string> = {}
      ;(Array.isArray(json?.devices) ? json.devices : []).forEach((d: DeviceTargetType) => {
        map[d.device_id] = toNumber(d.target_kw)
        inputs[d.device_id] = String(toNumber(d.target_kw))
      })
      setDeviceTargets(map)
      setDeviceTargetInputs(inputs)
    } catch {
      /* 무시 — 빈 상태로 둠 */
    }
  }

  const fetchDeviceNames = async (ids: string[]) => {
    if (!ids.length) return {}
    try {
      const res = await fetch(withAppPrefix('/api/member/device-names'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: ids }),
      })
      const json = (await res.json()) as any
      if (!res.ok || !json?.success) return {}
      return json.data ?? {}
    } catch {
      return {}
    }
  }

  const fetchHistory = async (deviceId: string) => {
    if (!deviceId || historyMap[deviceId]) return
    try {
      const res = await fetch(withAppPrefix(`/api/monitor/dashboard/${encodeURIComponent(deviceId)}?lookback_hours=24`))
      const json = (await res.json().catch(() => null)) as any
      const hist = json?.history_by_time ?? {}
      const points: DetailMonitoringPointType[] = Object.entries(hist)
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
        .map(([time, row]: [string, any]) => ({
          time: String(time).slice(11, 16) || String(time),
          value: toNumber(row?.CURVOLTAGE, 0),
        }))
      setHistoryMap((prev) => ({ ...prev, [deviceId]: points }))
    } catch {
      setHistoryMap((prev) => ({ ...prev, [deviceId]: [] }))
    }
  }

  /******************** 액션 ********************/
  const saveTarget = async (deviceId: string | null, kwStr: string) => {
    const customerId = toStr(resolvedCustomerId)
    if (!customerId) return
    const kw = Number(kwStr)
    if (!Number.isFinite(kw) || kw <= 0) {
      openWarn(t('입력 확인'), t('목표선은 0보다 큰 숫자여야 합니다.'))
      return
    }
    setIsSavingTarget(true)
    try {
      const res = await fetch(withAppPrefix('/api/optimize/peak-target'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, device_id: deviceId, target_kw: kw }),
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok) throw new Error(json?.message ?? json?.detail ?? t('목표선 저장 실패'))
      await loadTargets(customerId)
      if (result) await runDiagnosis() // 저장 즉시 재진단
    } catch (e: any) {
      openWarn(t('목표선 저장 실패'), e?.message ?? t('알 수 없는 오류가 발생했습니다.'))
    } finally {
      setIsSavingTarget(false)
    }
  }

  const runDiagnosis = async () => {
    if (isRunning) return
    const customerId = toStr(resolvedCustomerId)
    if (!customerId) {
      openWarn(t('고객사 선택 필요'), t('고객사를 먼저 선택한 뒤 실행해주세요.'))
      return
    }
    setIsRunning(true)
    try {
      const res = await fetch(withAppPrefix('/api/optimize/peak-dispatch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookback_hours: 24, customer_id: customerId, auto_shave_pct: autoShavePct }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 400) throw new Error(t('연결된 장비를 찾을 수 없습니다.'))
        throw new Error(json?.message ?? json?.details?.message ?? `${t('진단 실행에 실패했습니다.')} (HTTP ${res.status})`)
      }
      const normalized = normalizeResult(json)
      if (normalized.success === false) throw new Error(normalized.message ?? t('진단 실행 실패'))
      const ids = normalized.devices.map((d) => d.device_id).filter(Boolean)
      const names = await fetchDeviceNames(ids)
      setResult(normalized)
      setDeviceNameMap(names)
      const firstExceed = normalized.devices.find((d) => d.status === 'exceed') ?? normalized.devices[0]
      const sel = firstExceed?.device_id ?? ''
      setSelectedDeviceId(sel)
      setHistoryMap({})
      if (sel) void fetchHistory(sel)
    } catch (e: any) {
      openWarn(t('진단 실행 실패'), e?.message ?? t('알 수 없는 오류가 발생했습니다.'))
    } finally {
      setIsRunning(false)
    }
  }

  /******************** 이펙트 ********************/
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

  // 고객사 변경 시 초기화 + 목표선 로드
  useEffect(() => {
    setResult(null)
    setDeviceNameMap({})
    setSelectedDeviceId('')
    setHistoryMap({})
    setSavedCompanyTarget(null)
    setCompanyTargetInput('')
    setDeviceTargets({})
    setDeviceTargetInputs({})
    const cid = toStr(resolvedCustomerId)
    if (cid) void loadTargets(cid)
  }, [resolvedCustomerId])

  // 선택 장비 변경 시 히스토리 로드
  useEffect(() => {
    if (selectedDeviceId) void fetchHistory(selectedDeviceId)
  }, [selectedDeviceId])

  const handleCustomerSelect = (it: AdminCustomerOptionType) => {
    setCustomerKeyword(it.name)
    setIsCustomerSearching(false)
    if (selectedCustomerId !== it.id) setSelectedCustomerId(it.id)
    setIsCustomerDropdownOpen(false)
  }

  /******************** 렌더 ********************/
  return (
    <div className={mmc.peak_root}>
      <header className={`${mmc.peak_pageHead} ${mmc.peak_stageFadeUp}`}>
        <div className={mmc.peak_pageHeadTop}>
          <div className={mmc.peak_pageHeadText}>
            <h1>{t('피크 관리 콘솔')}</h1>
            <p>{t('목표 피크선을 설정하면, AI 예측이 그 선을 넘는 장비에 대해 조치를 안내합니다.')}</p>
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
                <button
                  type="button"
                  className={mmc.peak_customerComboArrow}
                  onClick={() => setIsCustomerDropdownOpen((p) => !p)}
                  aria-label={t('고객사 목록 열기')}
                >
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

      {!shouldHide && (
        <>
          {/* STEP 1 — 목표 피크선 설정 */}
          <section className={`${mmc.peak_targetCard} ${mmc.peak_stageFadeUp}`}>
            <div className={mmc.peak_cardHead}>
              <h2>{t('목표 피크선 설정')}</h2>
              <p>{t('회사 공통 목표선을 정하면 전 장비에 적용됩니다. 장비별 목표선은 아래 결과에서 개별 지정할 수 있습니다.')}</p>
            </div>
            <div className={mmc.peak_targetControls}>
              <div className={mmc.peak_targetField}>
                <span className={mmc.peak_fieldLabel}>{t('회사 공통 목표선')}</span>
                <div className={mmc.peak_targetInputRow}>
                  <input
                    className={mmc.peak_numberInput}
                    type="number"
                    min={0}
                    step={1}
                    placeholder="kW"
                    value={companyTargetInput}
                    onChange={(e) => setCompanyTargetInput(e.target.value)}
                  />
                  <span className={mmc.peak_unit}>kW</span>
                  <button
                    type="button"
                    className={mmc.peak_saveBtn}
                    disabled={isSavingTarget}
                    onClick={() => saveTarget(null, companyTargetInput)}
                  >
                    {isSavingTarget ? t('저장 중..') : t('목표선 저장')}
                  </button>
                </div>
                {savedCompanyTarget != null && (
                  <span className={mmc.peak_fieldHint}>{t('현재 적용')}: {fmtKw(savedCompanyTarget)}</span>
                )}
              </div>

              <div className={mmc.peak_targetField}>
                <span className={mmc.peak_fieldLabel}>{t('자동 목표선 셰이빙')}</span>
                <div className={mmc.peak_targetInputRow}>
                  <input
                    className={mmc.peak_numberInputSm}
                    type="number"
                    min={0}
                    max={90}
                    step={5}
                    value={autoShavePct}
                    onChange={(e) => setAutoShavePct(Math.max(0, Math.min(90, Number(e.target.value) || 0)))}
                  />
                  <span className={mmc.peak_unit}>%</span>
                </div>
                <span className={mmc.peak_fieldHint}>{t('목표 미설정 장비는 최근 피크에서 이 비율만큼 낮춰 자동 적용')}</span>
              </div>

              <button type="button" className={mmc.peak_runBtn} onClick={runDiagnosis} disabled={isRunning}>
                {isRunning ? t('진단 중..') : t('피크 진단 실행')}
              </button>
            </div>
            {savedCompanyTarget == null && Object.keys(deviceTargets).length === 0 && (
              <p className={mmc.peak_emptyHint}>
                {t('목표선이 아직 없습니다. 회사 공통 목표선을 먼저 설정한 뒤 진단을 실행하면 조치 권고가 의미있게 나옵니다.')}
              </p>
            )}
          </section>

          {/* STEP 3 — 결과 대시보드 */}
          {result && (
            <section className={mmc.peak_resultWrap}>
              {/* 3-A KPI */}
              <div className={mmc.peak_kpiRow}>
                <article className={`${mmc.peak_kpiCard} ${mmc.peak_stageFadeUp}`}>
                  <span className={mmc.peak_kpiLabel}>{t('분석 장비')}</span>
                  <strong className={mmc.peak_kpiValue}>{result.device_count}<small>{t('대')}</small></strong>
                </article>
                <article className={`${mmc.peak_kpiCard} ${mmc.peak_kpiCardBlue} ${mmc.peak_stageFadeUp}`}>
                  <span className={mmc.peak_kpiLabel}>{t('셰이빙 권고 장비')}</span>
                  <strong className={mmc.peak_kpiValue}>{exceedCount}<small>{t('대')}</small></strong>
                </article>
                <article className={`${mmc.peak_kpiCard} ${mmc.peak_stageFadeUp}`}>
                  <span className={mmc.peak_kpiLabel}>{t('총 절감 가능 전력')}</span>
                  <strong className={mmc.peak_kpiValue}>{toNumber(totalOver).toFixed(1)}<small>kW</small></strong>
                </article>
                <article className={`${mmc.peak_kpiCard} ${mmc.peak_kpiCardBlue} ${mmc.peak_stageFadeUp}`}>
                  <span className={mmc.peak_kpiLabel}>{t('목표 준수율')}</span>
                  <strong className={mmc.peak_kpiValue}>{complianceRate}<small>%</small></strong>
                </article>
              </div>

              <div className={mmc.peak_mainGrid}>
                {/* 3-B 히어로 시계열 */}
                <article className={`${mmc.peak_chartCard} ${mmc.peak_stageFadeUp}`}>
                  <div className={mmc.peak_cardHead}>
                    <h3>{t('전력 예측 vs 목표선')}</h3>
                    <p>{t('선택 장비의 최근 실측과 15/30분 예측을 목표 피크선과 비교합니다.')}</p>
                  </div>
                  <div className={mmc.peak_deviceTabs}>
                    {sortedDevices.slice(0, 8).map((d, i) => (
                      <button
                        key={d.device_id}
                        type="button"
                        className={`${mmc.peak_deviceTab} ${d.device_id === selectedDeviceId ? mmc.peak_deviceTabActive : ''}`}
                        onClick={() => setSelectedDeviceId(d.device_id)}
                      >
                        <span className={`${mmc.peak_dot} ${STATUS_META[d.status]?.cls ?? ''}`} />
                        {deviceName(d.device_id, i)}
                      </button>
                    ))}
                  </div>
                  {selectedDevice ? (
                    <CommonDetailMonitoringTimeSeriesChart
                      unitLabel="kW"
                      actualData={historyMap[selectedDevice.device_id] ?? []}
                      forecastData={heroForecast}
                      peakValue={selectedDevice.threshold}
                      showPeakLine={selectedDevice.threshold > 0}
                    />
                  ) : (
                    <div className={mmc.peak_emptyHint}>{t('장비를 선택하세요.')}</div>
                  )}
                </article>

                {/* 3-D 상태 도넛 */}
                <article className={`${mmc.peak_donutCard} ${mmc.peak_stageFadeUp}`}>
                  <div className={mmc.peak_cardHead}>
                    <h3>{t('장비 상태')}</h3>
                    <p>{t('목표선 대비 장비 상태 분포입니다.')}</p>
                  </div>
                  <CommonDonutEquipment legend={donutLegend} totalLabel={`${t('전체')} (${devices.length}${t('대')})`} />
                  <div className={mmc.peak_complianceWrap}>
                    <span className={mmc.peak_complianceLabel}>{t('목표 준수율')}</span>
                    <strong className={mmc.peak_complianceValue}>{complianceRate}%</strong>
                  </div>
                </article>
              </div>

              {/* 3-C 조치 리스트 */}
              <article className={`${mmc.peak_actionCard} ${mmc.peak_stageFadeUp}`}>
                <div className={mmc.peak_cardHead}>
                  <h3>{t('조치 권고')}</h3>
                  <p>{t('목표선을 넘는 장비를 우선순위대로 보여줍니다. 장비별 목표선도 여기서 조정할 수 있습니다.')}</p>
                </div>
                <div className={mmc.peak_actionRows}>
                  {sortedDevices.length ? (
                    sortedDevices.map((d, i) => {
                      const over = Math.max(d.required_shift_15, d.required_shift_30)
                      const loadRate = d.threshold > 0 ? Math.round((Math.max(d.baseline_15, d.baseline_30) / d.threshold) * 100) : 0
                      const lines = d.distribution_text.split('\n').map((l) => l.trim()).filter(Boolean)
                      return (
                        <div
                          key={d.device_id}
                          className={`${mmc.peak_actionRow} ${d.device_id === selectedDeviceId ? mmc.peak_actionRowActive : ''}`}
                          onClick={() => setSelectedDeviceId(d.device_id)}
                        >
                          <div className={mmc.peak_actionMain}>
                            <div className={mmc.peak_actionHeadLine}>
                              <span className={`${mmc.peak_badge} ${STATUS_META[d.status]?.cls ?? ''}`}>{STATUS_META[d.status]?.label}</span>
                              <strong className={mmc.peak_actionName}>{deviceName(d.device_id, i)}</strong>
                              <span className={mmc.peak_driveChip}>{d.drive_mode}</span>
                              <span className={mmc.peak_actionChip}>{ACTION_META[d.action_type]}</span>
                            </div>
                            <div className={mmc.peak_actionMeta}>
                              <span>{t('예측')} {fmtKw(Math.max(d.baseline_15, d.baseline_30))}</span>
                              <span>{t('목표')} {fmtKw(d.threshold)}</span>
                              {over > 0 && <span className={mmc.peak_overTag}>↓ {t('절감 가능')} {fmtKw(over)}</span>}
                            </div>
                            <CommonHorizontalBar items={[{ label: t('목표 대비 부하'), rate: loadRate }]} />
                            <div className={mmc.peak_actionText}>
                              {(lines.length ? lines : [t('현재 목표선 이내입니다.')]).map((l, idx) => (
                                <p key={idx}>{l}</p>
                              ))}
                            </div>
                          </div>
                          <div className={mmc.peak_actionTargetBox} onClick={(e) => e.stopPropagation()}>
                            <span className={mmc.peak_fieldHint}>{t('장비 목표선')}</span>
                            <div className={mmc.peak_targetInputRow}>
                              <input
                                className={mmc.peak_numberInputSm}
                                type="number"
                                min={0}
                                step={1}
                                placeholder="kW"
                                value={deviceTargetInputs[d.device_id] ?? ''}
                                onChange={(e) => setDeviceTargetInputs((p) => ({ ...p, [d.device_id]: e.target.value }))}
                              />
                              <button
                                type="button"
                                className={mmc.peak_saveBtnSm}
                                disabled={isSavingTarget}
                                onClick={() => saveTarget(d.device_id, deviceTargetInputs[d.device_id] ?? '')}
                              >
                                {t('적용')}
                              </button>
                            </div>
                            {deviceTargets[d.device_id] != null && (
                              <span className={mmc.peak_fieldHint}>{t('설정됨')}: {fmtKw(deviceTargets[d.device_id])}</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className={mmc.peak_emptyHint}>{t('표시할 장비가 없습니다.')}</div>
                  )}
                </div>
                {exceedCount === 0 && devices.length > 0 && (
                  <div className={mmc.peak_allClear}>✅ {t('모든 장비가 목표선 이내입니다.')}</div>
                )}
              </article>
            </section>
          )}
        </>
      )}

      <LoadingModal open={isRunning} message={t('피크 진단을 실행중입니다.')} subMessage={t('잠시만 기다려주세요.')} />
      <WarningModal open={warnOpen} title={warnTitle} detail={warnDetail} onConfirm={() => setWarnOpen(false)} onCancel={() => setWarnOpen(false)} />
    </div>
  )
}
