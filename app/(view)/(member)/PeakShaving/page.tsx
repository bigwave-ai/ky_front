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
 * 03. 업무구분  : 멤버, 관리자 권한 - MILP 피크 분배 대시보드
 * 03. 설명     : MILP 피크 분배 시뮬레이션 입력/실행/결과 UI
 *                - Python API 연동
 *                - 장비명 DB 조회 연동
 * 04. 작성일자  : 2026.04.08
 * 05. 작성자   : 이우창
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

/******************** 변수 영역 ********************/

/******************** 함수 영역 ********************/
// 값이 숫자가 아니면 fallback을 반환하는 숫자 정규화 함수
const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value) // 숫자 변환 결과
  return Number.isFinite(num) ? num : fallback
}

// 배열 값을 문자열 배열로 정규화하는 함수
const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map((v) => String(v ?? '').trim()).filter(Boolean)
}

// MILP API 응답을 화면에서 사용하는 표준 구조로 정규화하는 함수
const normalizePeakDispatchResponse = (raw: any): PeakDispatchResponseType => {
  const devices = Array.isArray(raw?.devices) ? raw.devices : [] // 장비 배열 원본

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

// 세션(localStorage)에서 customer_id를 읽어오는 함수
const getCustomerIdFromSession = () => {
  if (typeof window === 'undefined') return '' // 클라이언트 환경 체크

  const raw = localStorage.getItem('session.userInfo') // 세션 원문
  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw) as { customer_id?: string; customerId?: string } // 파싱 결과
    return String(parsed.customer_id ?? parsed.customerId ?? '').trim()
  } catch {
    return ''
  }
}

export default function PeakShavingPage() {
  /******************** 변수 영역 ********************/
  const [idleThreshold, setIdleThreshold] = useState(0.05) // 미가동 기준값(0~1, 소수 2자리)
  const [queryHour, setQueryHour] = useState(24) // 조회 시간(시간 단위)
  const [showEquipmentResult, setShowEquipmentResult] = useState(false) // 결과 카드 표시 여부
  const [isRunning, setIsRunning] = useState(false) // MILP 실행 중 여부

  const [milpResult, setMilpResult] = useState<PeakDispatchResponseType | null>(null) // MILP 결과 원본
  const [deviceNameMap, setDeviceNameMap] = useState<Record<string, string>>({}) // device_id -> 장비명 매핑

  const [warnOpen, setWarnOpen] = useState(false) // 경고 모달 오픈 여부
  const [warnTitle, setWarnTitle] = useState('') // 경고 모달 제목
  const [warnDetail, setWarnDetail] = useState('') // 경고 모달 상세 메시지

  const analysisEquipmentCount = milpResult?.device_count ?? 0 // 분석 장비 수
  const idleEquipmentCount = milpResult?.idle_device_ids.length ?? 0 // 미가동 장비 수
  const skippedEquipmentCount = milpResult?.skipped_devices.length ?? 0 // 제외 장비 수
  const totalEquipmentCount = analysisEquipmentCount + idleEquipmentCount + skippedEquipmentCount // 전체 장비 수

  const equipmentLegend: CommonDonutEquipmentItem[] = useMemo(
    () => [
      { label: '분석 장비 수', value: analysisEquipmentCount, color: '#0d274b', unit: '대' },
      { label: '미가동 장비 수', value: idleEquipmentCount, color: '#29a9dd', unit: '대' },
      { label: '제외 장비 수', value: skippedEquipmentCount, color: '#e9a24f', unit: '대' },
    ],
    [analysisEquipmentCount, idleEquipmentCount, skippedEquipmentCount],
  ) // 도넛 차트 범례 데이터

  const peakCut15Kw = milpResult?.peak_15_reduction ?? 0 // 15분 피크 절감량(kW)
  const peakCut15Rate = milpResult?.peak_15_reduction_pct ?? 0 // 15분 피크 절감률(%)
  const peakCut30Kw = milpResult?.peak_30_reduction ?? 0 // 30분 피크 절감량(kW)
  const peakCut30Rate = milpResult?.peak_30_reduction_pct ?? 0 // 30분 피크 절감률(%)

  const recommendations: PeakRecommendationType[] = useMemo(() => {
    if (!milpResult) return []

    return milpResult.devices.map((item, index) => {
      const fallbackName = `Compressor${index + 1}` // 장비명 매핑 실패 시 기본 이름
      const equipmentName = deviceNameMap[item.device_id] || fallbackName // 최종 장비명

      const lines = String(item.distribution_text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean) // 추천 문구 줄 단위 분리

      return {
        deviceId: item.device_id,
        equipmentName,
        distributionLines: lines.length ? lines : ['추천 분배 문구가 없습니다.'],
        base15Kw: item.baseline_15,
        base30Kw: item.baseline_30,
      }
    })
  }, [milpResult, deviceNameMap]) // 장비별 추천 데이터

  const maxPredictValue = useMemo(() => {
    if (!recommendations.length) return 1
    const maxValue = Math.max(
      ...recommendations.flatMap((item) => [item.base15Kw, item.base30Kw]),
    ) // 막대차트 최대 기준값 계산
    return Math.max(1, Math.ceil(maxValue * 1.2))
  }, [recommendations]) // 예측 막대차트 최대값

  /******************** 함수 영역 ********************/
  // 경고 모달을 열고 메시지를 설정하는 함수
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title)
    setWarnDetail(detail)
    setWarnOpen(true)
  }

  // 경고 모달을 닫는 함수
  const closeWarn = () => setWarnOpen(false)

  // 미가동 기준값을 0~1, 소수점 2자리로 보정하는 함수
  const normalizeIdleThreshold = (value: number) => {
    const clamped = Math.min(1, Math.max(0, value)) // 범위 제한
    return Math.round(clamped * 100) / 100
  }

  // device_id 목록으로 장비명 매핑을 조회하는 함수
  const fetchDeviceNames = async (deviceIds: string[]) => {
    if (!deviceIds.length) return {}

    try {
      const response = await fetch(withAppPrefix('/api/member/device-names'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_ids: deviceIds }),
      })

      const json = (await response.json()) as DeviceNameResponseType // 응답 JSON
      if (!response.ok || !json?.success) return {}

      return json.data ?? {}
    } catch {
      return {}
    }
  }

  // MILP 실행 버튼 클릭 시 Python API 호출 및 결과를 반영하는 함수
  const handleRunMilp = async () => {
    if (isRunning) return

    const customerId = getCustomerIdFromSession() // 세션 customer_id
    if (!customerId) {
      openWarn('세션 정보 오류', '로그인 사용자 customer_id를 찾을 수 없습니다. 다시 로그인해주세요.')
      return
    }

    const normalizedHour = Math.max(1, Math.floor(queryHour)) // 조회시간 정수/최소 1 보정
    const normalizedIdle = normalizeIdleThreshold(idleThreshold) // 미가동 기준값 보정

    setIsRunning(true)
    setShowEquipmentResult(false)
    setMilpResult(null)
    setDeviceNameMap({})

    try {
      const payload = {
        lookback_hours: normalizedHour,
        customer_id: customerId,
        idle_op_status_threshold: normalizedIdle,
      } // Python API 요청 바디

      const response = await fetch(withAppPrefix('/api/optimize/peak-dispatch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseJson = await response.json().catch(() => null) // 응답 파싱(실패 허용)

      // 400 에러는 사용자 요구 문구로 고정 처리
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

      const normalized = normalizePeakDispatchResponse(responseJson) // 응답 정규화

      if (normalized.success === false) {
        throw new Error(normalized.message ?? 'MILP 실행 실패')
      }

      const deviceIds = normalized.devices
        .map((device) => device.device_id)
        .filter(Boolean) // 결과 장비 ID 목록

      const nameMap = await fetchDeviceNames(deviceIds) // 장비명 조회

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

  // kW 단위 표시 문자열 함수
  const formatKw = (value: number) => `${toNumber(value, 0).toFixed(2)} kW`

  // 퍼센트 표시 문자열 함수
  const formatRate = (value: number) => `(${toNumber(value, 0).toFixed(2)}%)`

  /******************** 수행 영역 ********************/
  // 본 컴포넌트는 useEffect를 사용하지 않고, 사용자 액션 기반으로 API를 수행합니다.
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
                const raw = e.target.value // 입력 문자열
                if (raw === '') {
                  setIdleThreshold(0)
                  return
                }

                const next = Number(raw) // 숫자 변환값
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
                const next = Number(e.target.value) // 입력 숫자
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
