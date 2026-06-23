'use client'

import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import esg from './EsgReport.module.css'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import WarningModal from '@/app/components/libs/modals/modal-warnning'
import { MuiCalendar } from '@/app/components/libs/muis/mui-input-group'
import { withAppPrefix } from '@/config/environment'
import { useTranslation } from '@/app/services/i18n/LanguageProvider'
import { getSessionUserInfo } from '@/app/services/util/session-info'

/* ===== 세션(로그인 사용자) 정보 ===== */
type SessionUserInfoType = {
  customerId: string
  customerName: string
  role: string
  isAdmin: boolean
}

// 세션 파싱은 공유 유틸로 통합: @/app/services/util/session-info (getSessionUserInfo)

/* ===== 타입 ===== */
type CustomerOptionType = { customer_id: string; customer_name: string }
type PreviewCell = { value: string; rowSpan: number; colSpan: number }
type PreviewSheetType = { name: string; rows: PreviewCell[][] }

/* ===== Content-Disposition → 파일명 ===== */
const parseFilename = (cd: string | null): string => {
  if (!cd) return 'ESG_report.xlsx'
  const star = /filename\*=UTF-8''([^;]+)/i.exec(cd)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim())
    } catch {
      /* fallthrough */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(cd)
  return (plain?.[1] ?? '').trim() || 'ESG_report.xlsx'
}

export default function EsgReportPage() {
  const { t } = useTranslation()

  // 세션
  const [isAdmin, setIsAdmin] = useState(false)
  const [sessionCustomerName, setSessionCustomerName] = useState('')

  // 고객사
  const [customers, setCustomers] = useState<CustomerOptionType[]>([])
  const [selectedCustomerName, setSelectedCustomerName] = useState('')

  // 기간/옵션
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [kwPrice, setKwPrice] = useState('')
  const [baseline, setBaseline] = useState('')

  // 생성/결과
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportBlob, setReportBlob] = useState<Blob | null>(null)
  const [reportFilename, setReportFilename] = useState('')
  const [previewSheets, setPreviewSheets] = useState<PreviewSheetType[]>([])
  const [activeSheet, setActiveSheet] = useState(0)

  // 경고 모달
  const [warnOpen, setWarnOpen] = useState(false)
  const [warnTitle, setWarnTitle] = useState('')
  const [warnDetail, setWarnDetail] = useState('')
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title)
    setWarnDetail(detail)
    setWarnOpen(true)
  }
  const closeWarn = () => setWarnOpen(false)

  // 마운트: 세션 + 기본 기간 + 고객사 목록
  useEffect(() => {
    const session = getSessionUserInfo()
    setIsAdmin(session.isAdmin)
    setSessionCustomerName(session.customerName)

    setPeriodStart(dayjs().startOf('month').format('YYYY-MM-DD'))
    setPeriodEnd(dayjs().format('YYYY-MM-DD'))

    let disposed = false
    ;(async () => {
      try {
        const res = await fetch(withAppPrefix('/api/esg/customers'), { method: 'GET' })
        const json = (await res.json().catch(() => null)) as
          | { success?: boolean; data?: CustomerOptionType[]; message?: string }
          | null
        if (disposed) return
        if (!res.ok || !json?.success) {
          throw new Error(json?.message ?? `고객사 목록 조회 실패 (${res.status})`)
        }
        const list = Array.isArray(json.data) ? json.data : []
        setCustomers(list)
        // 비관리자는 본인 회사 1건만 내려옴 → 자동 선택
        if (!session.isAdmin && list.length > 0) {
          setSelectedCustomerName(list[0].customer_name)
        }
      } catch (error: any) {
        if (!disposed) openWarn(t('오류'), error?.message ?? t('ESG 보고서 생성에 실패했습니다.'))
      }
    })()

    return () => {
      disposed = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resolvedCustomerName = useMemo(
    () => (isAdmin ? selectedCustomerName : sessionCustomerName || customers[0]?.customer_name || ''),
    [isAdmin, selectedCustomerName, sessionCustomerName, customers],
  )

  const activeRows = previewSheets[activeSheet]?.rows ?? []

  const handleGenerate = async () => {
    if (isGenerating) return

    const customerName = resolvedCustomerName.trim()
    if (isAdmin && !customerName) {
      openWarn(t('알림'), t('대상 고객사를 선택해주세요.'))
      return
    }
    if (!periodStart || !periodEnd) {
      openWarn(t('알림'), t('보고서 기간을 입력해주세요.'))
      return
    }
    if (periodEnd < periodStart) {
      openWarn(t('알림'), t('종료일은 시작일 이후여야 합니다.'))
      return
    }

    setIsGenerating(true)
    setReportBlob(null)
    setReportFilename('')
    setPreviewSheets([])
    setActiveSheet(0)

    try {
      const res = await fetch(withAppPrefix('/api/esg/report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          period_start: periodStart,
          period_end: periodEnd,
          kw_price_won: kwPrice,
          baseline_total_kwh: baseline,
        }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { message?: string } | null
        throw new Error(err?.message ?? `${t('ESG 보고서 생성에 실패했습니다.')} (HTTP ${res.status})`)
      }

      const filename = parseFilename(res.headers.get('content-disposition'))
      const blob = await res.blob()
      setReportBlob(blob)
      setReportFilename(filename)

      // SheetJS 로 클라이언트 미리보기(시트별 표)
      const XLSX = await import('xlsx')
      const buf = await blob.arrayBuffer()
      const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
      const ROW_CAP = 300
      const sheets: PreviewSheetType[] = wb.SheetNames.map((name: string) => {
        const ws = wb.Sheets[name]
        const ref: string | undefined = ws ? ws['!ref'] : undefined
        if (!ref) return { name, rows: [] as PreviewCell[][] }
        const range = XLSX.utils.decode_range(ref)
        const merges = (ws['!merges'] ?? []) as Array<{
          s: { r: number; c: number }
          e: { r: number; c: number }
        }>
        // 병합 앵커(좌상단)에는 span 정보, 그 외 병합 영역 셀은 렌더 생략
        const anchor = new Map<string, { rowSpan: number; colSpan: number }>()
        const covered = new Set<string>()
        for (const m of merges) {
          anchor.set(`${m.s.r},${m.s.c}`, { rowSpan: m.e.r - m.s.r + 1, colSpan: m.e.c - m.s.c + 1 })
          for (let r = m.s.r; r <= m.e.r; r += 1) {
            for (let c = m.s.c; c <= m.e.c; c += 1) {
              if (r === m.s.r && c === m.s.c) continue
              covered.add(`${r},${c}`)
            }
          }
        }
        const maxRow = Math.min(range.e.r, range.s.r + ROW_CAP - 1)
        const rows: PreviewCell[][] = []
        for (let r = range.s.r; r <= maxRow; r += 1) {
          const cells: PreviewCell[] = []
          for (let c = range.s.c; c <= range.e.c; c += 1) {
            const key = `${r},${c}`
            if (covered.has(key)) continue
            const cell: any = ws[XLSX.utils.encode_cell({ r, c })]
            const raw = cell == null ? '' : cell.w ?? cell.v ?? ''
            const span = anchor.get(key)
            cells.push({
              value: raw === null || raw === undefined ? '' : String(raw),
              rowSpan: span ? Math.min(span.rowSpan, maxRow - r + 1) : 1,
              colSpan: span ? span.colSpan : 1,
            })
          }
          rows.push(cells)
        }
        return { name, rows }
      })
      setPreviewSheets(sheets)
      setActiveSheet(0)
    } catch (error: any) {
      openWarn(t('ESG 보고서 생성에 실패했습니다.'), error?.message ?? t('오류'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!reportBlob) {
      openWarn(t('알림'), t('보고서를 먼저 생성해주세요.'))
      return
    }
    const url = URL.createObjectURL(reportBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = reportFilename || 'ESG_report.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={esg.esg_root}>
      <header className={esg.esg_pageHead}>
        <div className={esg.esg_pageHeadText}>
          <h1>{t('ESG 보고서')}</h1>
          <p>{t('ESG 경영 보고서를 생성하고 다운로드합니다.')}</p>
        </div>
      </header>

      <section className={esg.esg_card}>
        {/* 대상 고객사 */}
        <div className={esg.esg_field}>
          <label className={esg.esg_label}>{t('대상 고객사')}</label>
          {isAdmin ? (
            <select
              className={esg.esg_select}
              value={selectedCustomerName}
              onChange={(e) => setSelectedCustomerName(e.target.value)}
            >
              <option value="">{t('고객사를 선택하세요')}</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_name}>
                  {c.customer_name}
                </option>
              ))}
            </select>
          ) : (
            <div className={esg.esg_readonly}>{resolvedCustomerName || '-'}</div>
          )}
        </div>

        {/* 보고서 기간 */}
        <div className={esg.esg_field}>
          <label className={esg.esg_label}>{t('보고서 기간')}</label>
          <div className={esg.esg_dateRow}>
            <div className={esg.esg_dateCell}>
              <span className={esg.esg_subLabel}>{t('보고서 시작일')}</span>
              <MuiCalendar
                name="period_start"
                value={periodStart}
                fnChangeCalendar={(d) => setPeriodStart(d ? d.format('YYYY-MM-DD') : '')}
              />
            </div>
            <span className={esg.esg_dateSep}>~</span>
            <div className={esg.esg_dateCell}>
              <span className={esg.esg_subLabel}>{t('보고서 종료일')}</span>
              <MuiCalendar
                name="period_end"
                value={periodEnd}
                fnChangeCalendar={(d) => setPeriodEnd(d ? d.format('YYYY-MM-DD') : '')}
              />
            </div>
          </div>
        </div>

        {/* 선택 옵션 */}
        <div className={esg.esg_optRow}>
          <div className={esg.esg_field}>
            <label className={esg.esg_label}>{t('단가 (원/kWh)')}</label>
            <input
              className={esg.esg_input}
              type="number"
              min={0}
              value={kwPrice}
              placeholder={t('예) 200')}
              onChange={(e) => setKwPrice(e.target.value)}
            />
            <span className={esg.esg_hint}>
              {t('미입력 시 기본 단가로 계산됩니다. 실제 전기 단가를 입력하세요.')}
            </span>
          </div>
          <div className={esg.esg_field}>
            <label className={esg.esg_label}>{t('개선전 전력 (kWh)')}</label>
            <input
              className={esg.esg_input}
              type="number"
              min={0}
              value={baseline}
              placeholder={t('예) 220198')}
              onChange={(e) => setBaseline(e.target.value)}
            />
            <span className={esg.esg_hint}>
              {t('미입력 시 정격용량 × 가동시간으로 추정합니다 (실제보다 과대 산정될 수 있음).')}
            </span>
          </div>
        </div>

        {/* 버튼 */}
        <div className={esg.esg_btnRow}>
          <button
            type="button"
            className={esg.esg_runBtn}
            onClick={handleGenerate}
            disabled={isGenerating || (isAdmin && !selectedCustomerName)}
          >
            {isGenerating ? t('ESG 보고서를 생성하고 있습니다.') : t('ESG 보고서 생성')}
          </button>
          <button
            type="button"
            className={esg.esg_dlBtn}
            onClick={handleDownload}
            disabled={!reportBlob || isGenerating}
          >
            {t('보고서 다운로드')}
          </button>
        </div>
      </section>

      {/* 미리보기 */}
      <section className={esg.esg_previewWrap}>
        <div className={esg.esg_previewHead}>
          <h2>{t('보고서 미리보기')}</h2>
          {reportFilename && <span className={esg.esg_fileName}>{reportFilename}</span>}
        </div>

        {previewSheets.length === 0 ? (
          <div className={esg.esg_empty}>{t('아직 생성된 보고서가 없습니다.')}</div>
        ) : (
          <>
            <div className={esg.esg_tabs}>
              {previewSheets.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  className={`${esg.esg_tab} ${i === activeSheet ? esg.esg_tabActive : ''}`}
                  onClick={() => setActiveSheet(i)}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <div className={esg.esg_tableWrap}>
              {activeRows.length === 0 ? (
                <div className={esg.esg_empty}>{t('표시할 보고서 데이터가 없습니다.')}</div>
              ) : (
                <table className={esg.esg_table}>
                  <tbody>
                    {activeRows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td
                            key={ci}
                            className={cell.colSpan > 1 || cell.rowSpan > 1 ? esg.esg_mergedCell : undefined}
                            rowSpan={cell.rowSpan > 1 ? cell.rowSpan : undefined}
                            colSpan={cell.colSpan > 1 ? cell.colSpan : undefined}
                          >
                            {cell.value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </section>

      <LoadingModal
        open={isGenerating}
        message={t('ESG 보고서를 생성하고 있습니다.')}
        subMessage={t('잠시만 기다려주세요.')}
      />
      <WarningModal
        open={warnOpen}
        title={warnTitle}
        detail={warnDetail}
        onConfirm={closeWarn}
        onCancel={closeWarn}
      />
    </div>
  )
}
