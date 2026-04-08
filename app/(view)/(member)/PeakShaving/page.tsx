'use client'

import { useMemo, useState } from 'react'
import mmc from './PeakShaving.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'
import CommonDonutEquipment, {
  type CommonDonutEquipmentItem,
} from '@/app/components/libs/charts/common/common-donut-equipment'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import WarningModal from '@/app/components/libs/modals/modal-warnning'
import CommonPeakPredictBars from '@/app/components/libs/charts/common/common-peak-predict-bars'
import { withAppPrefix } from '@/config/environment'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분 : 멤버, 관리자 권한 - MILP 피크 분배 대시보드
 * 04. 설명     : MILP 피크 분배 시뮬레이션 입력/실행/결과 UI
 *                - Python API 연동
 *                - 장비명 DB 조회 연동
 * 05. 작성일자 : 2026.04.08
 * 06. 작성자   : Codex
 */

type PeakDispatchDeviceType = {
  device_id: string
  baseline_15: number
  baseline_30: number
  threshold: number
  distribution_text: string
}

type PeakDispatchResponseType = {
  success?: boolean
  status?: string
  message?: string
  device_count: number
  donor_device_ids: string[]
  idle_device_ids: string[]
  skipped_devices: unknown[]
  peak_15_reduction: number
  peak_15_reduction_pct: number
  peak_30_reduction: number
  peak_30_reduction_pct: number
  devices: PeakDispatchDeviceType[]
}

type DeviceNameResponseType = {
  success: boolean
  data: Record<string, string>
  message?: string
}

type PeakRecommendationType = {
  deviceId: string
  equipmentName: string
  distributionLines: string[]
  base15Kw: number
  base30Kw: number
}

/******************** 유틸 함수 ********************/
const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v ?? '').trim()).filter(Boolean)
}

const normalizePeakDispatchResponse = (raw: any): PeakDispatchResponseType => {
  const devices = Array.isArray(raw?.devices) ? raw.devices : []

  return {
    success: typeof raw?.success === 'boolean' ? raw.success : undefined,
    status: typeof raw?.status === 'string' ? raw.status : undefined,
    message: typeof raw?.message === 'string' ? raw.message : undefined,

    device_count: Math.max(0, Math.floor(toNumber(raw?.device_count, 0))),
    donor_device_ids: toStringArray(raw?.donor_device_ids),
    idle_device_ids: toStringArray(raw?.idle_device_ids),
    skipped_devices: Array.isArray(raw?.skipped_devices) ? raw.skipped_devices : [],

    peak_15_reduction: toNumber(raw?.peak_15_reduction, 0),
    peak_15_reduction_pct: toNumber(raw?.peak_15_reduction_pct, 0),
    peak_30_reduction: toNumber(raw?.peak_30_reduction, 0),
    peak_30_reduction_pct: toNumber(raw?.peak_30_reduction_pct, 0),

    devices: devices.map((item: any) => ({
      device_id: String(item?.device_id ?? '').trim(),
      baseline_15: toNumber(item?.baseline_15, 0),
      baseline_30: toNumber(item?.baseline_30, 0),
      threshold: toNumber(item?.threshold, 0),
      distribution_text: String(item?.distribution_text ?? '').trim(),
    })),
  }
}

const getCustomerIdFromSession = () => {
  if (typeof window === 'undefined') return ''

  const raw = localStorage.getItem('session.userInfo')
  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw) as { customer_id?: string; customerId?: string }
    return String(parsed.customer_id ?? parsed.customerId ?? '').trim()
  } catch {
    return ''
  }
}

export default function PeakShavingPage() {
  /******************** 변수 영역 ********************/
  const [idleThreshold, setIdleThreshold] = useState(0.05)
  const [queryHour, setQueryHour] = useState(24)
  const [showEquipmentResult, setShowEquipmentResult] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const [milpResult, setMilpResult] = useState<PeakDispatchResponseType | null>(null)
  const [deviceNameMap, setDeviceNameMap] = useState<Record<string, string>>({})

  const [warnOpen, setWarnOpen] = useState(false)
  const [warnTitle, setWarnTitle] = useState('')
  const [warnDetail, setWarnDetail] = useState('')

  /******************** 파생 데이터 ********************/
  const analysisEquipmentCount = milpResult?.device_count ?? 0
  const idleEquipmentCount = milpResult?.idle_device_ids.length ?? 0
  const skippedEquipmentCount = milpResult?.skipped_devices.length ?? 0
  const totalEquipmentCount = analysisEquipmentCount + idleEquipmentCount + skippedEquipmentCount

  const equipmentLegend: CommonDonutEquipmentItem[] = useMemo(
    () => [
      { label: '분석 장비 수', value: analysisEquipmentCount, color: '#0d274b', unit: '대' },
      { label: '미가동 장비 수', value: idleEquipmentCount, color: '#29a9dd', unit: '대' },
      { label: '제외 장비 수', value: skippedEquipmentCount, color: '#e9a24f', unit: '대' },
    ],
    [analysisEquipmentCount, idleEquipmentCount, skippedEquipmentCount],
  )

  const peakCut15Kw = milpResult?.peak_15_reduction ?? 0
  const peakCut15Rate = milpResult?.peak_15_reduction_pct ?? 0
  const peakCut30Kw = milpResult?.peak_30_reduction ?? 0
  const peakCut30Rate = milpResult?.peak_30_reduction_pct ?? 0

  const recommendations: PeakRecommendationType[] = useMemo(() => {
    if (!milpResult) return []

    return milpResult.devices.map((item, index) => {
      const fallbackName = `Compressor${index + 1}`
      const equipmentName = deviceNameMap[item.device_id] || fallbackName

      const lines = String(item.distribution_text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      return {
        deviceId: item.device_id,
        equipmentName,
        distributionLines: lines.length ? lines : ['추천 분배 문구가 없습니다.'],
        base15Kw: item.baseline_15,
        base30Kw: item.baseline_30,
      }
    })
  }, [milpResult, deviceNameMap])

  const maxPredictValue = useMemo(() => {
    if (!recommendations.length) return 1
    const maxValue = Math.max(
      ...recommendations.flatMap((item) => [item.base15Kw, item.base30Kw]),
    )
    return Math.max(1, Math.ceil(maxValue * 1.2))
  }, [recommendations])

  /******************** 함수 영역 ********************/
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title)
    setWarnDetail(detail)
    setWarnOpen(true)
  }

  const closeWarn = () => setWarnOpen(false)

  const normalizeIdleThreshold = (value: number) => {
    const clamped = Math.min(1, Math.max(0, value))
    return Math.round(clamped * 100) / 100
  }

  const fetchDeviceNames = async (deviceIds: string[]) => {
    if (!deviceIds.length) return {}

    try {
      const response = await fetch(withAppPrefix('/api/member/device-names'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: deviceIds }),
      })

      const json = (await response.json()) as DeviceNameResponseType
      if (!response.ok || !json?.success) return {}

      return json.data ?? {}
    } catch {
      return {}
    }
  }

  const handleRunMilp = async () => {
    if (isRunning) return

    const customerId = getCustomerIdFromSession()
    if (!customerId) {
      openWarn('세션 정보 오류', '로그인 사용자 customer_id를 찾을 수 없습니다. 다시 로그인해주세요.')
      return
    }

    const normalizedHour = Math.max(1, Math.floor(queryHour))
    const normalizedIdle = normalizeIdleThreshold(idleThreshold)

    setIsRunning(true)
    setShowEquipmentResult(false)
    setMilpResult(null)
    setDeviceNameMap({})

    try {
      const payload = {
        lookback_hours: normalizedHour,
        customer_id: customerId,
        idle_op_status_threshold: normalizedIdle,
      }

      const response = await fetch(withAppPrefix('/api/optimize/peak-dispatch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseJson = await response.json().catch(() => null)

      /**
       * 400 에러는 사용자 요구 문구로 고정
       */
      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('연결된 장비를 찾을 수 없습니다.')
        }

        throw new Error(
          responseJson?.message ??
            responseJson?.details?.message ??
            `MILP 실행 요청에 실패했습니다. (HTTP ${response.status})`,
        )
      }

      if (!responseJson) {
        throw new Error('MILP 응답을 해석할 수 없습니다.')
      }

      const normalized = normalizePeakDispatchResponse(responseJson)

      if (normalized.success === false) {
        throw new Error(normalized.message ?? 'MILP 실행 실패')
      }

      const deviceIds = normalized.devices
        .map((device) => device.device_id)
        .filter(Boolean)

      const nameMap = await fetchDeviceNames(deviceIds)

      setMilpResult(normalized)
      setDeviceNameMap(nameMap)
      setShowEquipmentResult(true)
    } catch (error: any) {
      setShowEquipmentResult(false)
      openWarn('MILP 실행 실패', error?.message ?? '알 수 없는 오류가 발생했습니다.')
    } finally {
      setIsRunning(false)
    }
  }

  const formatKw = (value: number) => `${toNumber(value, 0).toFixed(2)} kW`
  const formatRate = (value: number) => `(${toNumber(value, 0).toFixed(2)}%)`

  /******************** 실행 영역 ********************/
  return (
    <div className={mmc.peak_root}>
      <header className={`${mmc.peak_pageHead} ${mmc.peak_stageFadeUp}`}>
        <h1>MILP 피크 분배 시뮬레이션</h1>
        <p>MILP 피크 전력 분배 시뮬레이션 결과를 확인할 수 있습니다.</p>
      </header>

      <section className={`${mmc.peak_selectCard} ${mmc.peak_stageFadeUp}`}>
        <div className={mmc.peak_selectTitleWrap}>
          <h2>장비 선택/입력</h2>
          <p>MILP 피크 분배 시뮬레이션을 위해 미가동 기준 및 조회시간을 입력해주세요.</p>
        </div>

        <div className={mmc.peak_selectControls}>
          <div className={`${mmc.peak_field} ${mmc.peak_field_idle}`}>
            <div className={mmc.peak_fieldTop}>
              <span className={mmc.peak_fieldLabel}>미가동 기준</span>
              <span className={mmc.peak_fieldHint}>OP_STATUS 평균 이하</span>
            </div>
            <input
              className={`${mmc.peak_numberInput} ${mmc.peak_numberInputSpin}`}
              type="number"
              value={idleThreshold}
              min={0}
              max={1}
              step={0.01}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  setIdleThreshold(0)
                  return
                }

                const next = Number(raw)
                if (Number.isNaN(next)) return
                setIdleThreshold(normalizeIdleThreshold(next))
              }}
              onBlur={() => {
                setIdleThreshold((prev) => normalizeIdleThreshold(prev))
              }}
            />
          </div>

          <div className={`${mmc.peak_field} ${mmc.peak_field_time}`}>
            <div className={mmc.peak_fieldTop}>
              <span className={mmc.peak_fieldLabel}>조회 시간</span>
              <span className={mmc.peak_fieldHint}>시뮬레이션 조회 시간 입력</span>
            </div>
            <input
              className={`${mmc.peak_numberInput} ${mmc.peak_numberInputSpin}`}
              type="number"
              value={queryHour}
              min={1}
              step={1}
              onChange={(e) => {
                const next = Number(e.target.value)
                if (Number.isNaN(next)) {
                  setQueryHour(1)
                  return
                }
                setQueryHour(Math.max(1, next))
              }}
            />
          </div>

          <button
            type="button"
            className={mmc.peak_runBtn}
            onClick={handleRunMilp}
            disabled={isRunning}
          >
            {isRunning ? 'MILP 실행 중..' : 'MILP 실행'}
          </button>
        </div>
      </section>

      {showEquipmentResult && milpResult && (
        <section className={mmc.peak_resultWrap}>
          <div className={mmc.peak_topResultGrid}>
            <article className={`${mmc.peak_equipmentCard} ${mmc.peak_stageFadeUp}`}>
              <div className={mmc.peak_cardHead}>
                <h3>장비 수</h3>
                <p>MILP 피크에 대한 장비 분석 결과 입니다.</p>
              </div>

              <div className={mmc.peak_equipmentBody}>
                <CommonDonutEquipment
                  legend={equipmentLegend}
                  totalLabel={`전체 장비 수 (${totalEquipmentCount}대)`}
                />
              </div>
            </article>

            <article
              className={`${mmc.peak_peakReduceCard} ${mmc.peak_peakReduceCardBlue} ${mmc.peak_stageFadeUp}`}
            >
              <div className={mmc.peak_peakReduceIconWrap} aria-hidden="true">
                <div className={`${imag.elctric_circle_icon} ${mmc.peak_electricIcon}`} />
              </div>

              <h4 className={mmc.peak_peakReduceTitle}>15분 피크 절감</h4>

              <div className={mmc.peak_peakReduceValueWrap}>
                <strong className={mmc.peak_peakReduceValue}>{formatKw(peakCut15Kw)}</strong>
                <span className={mmc.peak_peakReduceRate}>{formatRate(peakCut15Rate)}</span>
              </div>
            </article>

            <article
              className={`${mmc.peak_peakReduceCard} ${mmc.peak_peakReduceCardWhite} ${mmc.peak_stageFadeUp}`}
            >
              <div className={mmc.peak_peakReduceIconWrap} aria-hidden="true">
                <div className={`${imag.elctric_circle_icon} ${mmc.peak_electricIcon}`} />
              </div>

              <h4 className={mmc.peak_peakReduceTitle}>30분 피크 절감</h4>

              <div className={mmc.peak_peakReduceValueWrap}>
                <strong className={mmc.peak_peakReduceValue}>{formatKw(peakCut30Kw)}</strong>
                <span className={mmc.peak_peakReduceRate}>{formatRate(peakCut30Rate)}</span>
              </div>
            </article>
          </div>

          <article className={`${mmc.peak_recommendCard} ${mmc.peak_stageFadeUp}`}>
            <div className={mmc.peak_cardHead}>
              <h3>장비 분배 추천</h3>
              <p>피크 절감을 위한 장비 분배 추천 결과입니다.</p>
            </div>

            <div className={mmc.peak_recommendRows}>
              {recommendations.length ? (
                recommendations.map((item) => (
                  <div key={item.deviceId} className={mmc.peak_recommendRow}>
                    <div className={mmc.peak_recommendInfoWrap}>
                      <div className={mmc.peak_recommendInfoRow}>
                        <div className={mmc.peak_recommendBadge}>장비 정보</div>
                        <strong className={mmc.peak_recommendEquipment}>{item.equipmentName}</strong>
                      </div>

                      <div className={mmc.peak_recommendInfoRow}>
                        <div className={mmc.peak_recommendBadgeLarge}>추천 분배</div>
                        <div className={mmc.peak_recommendTextGroup}>
                          {item.distributionLines.map((line, idx) => (
                            <p key={`${item.deviceId}-${idx}`} className={mmc.peak_recommendText}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={mmc.peak_recommendRightGroup}>
                      <div className={mmc.peak_recommendPredictBox}>장비 가동 예측</div>

                      <CommonPeakPredictBars
                        bars={[
                          { label: '15분 기준값', value: item.base15Kw },
                          { label: '30분 기준값', value: item.base30Kw },
                        ]}
                        unit="kW"
                        maxValue={maxPredictValue}
                        gapPx={80}
                        sidePaddingPx={40}
                        valueOffsetPx={8}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className={mmc.peak_recommendRow}>
                  <div className={mmc.peak_recommendTextGroup}>
                    <p className={mmc.peak_recommendText}>추천할 장비 데이터가 없습니다.</p>
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>
      )}

      <LoadingModal
        open={isRunning}
        message="MILP 시뮬레이션을 실행중입니다."
        subMessage="잠시만 기다려주세요."
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
