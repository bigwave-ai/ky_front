'use client'

import { useEffect, useMemo, useState } from 'react'
import mmc from './Simulation.module.css'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import WarningModal from '@/app/components/libs/modals/modal-warnning'
import CommonBarChart, {
  type CommonBarChartItemType,
} from '@/app/components/libs/charts/common/common-bar-chart'
import CommonHorizontalBar, {
  type CommonHorizontalBarItemType,
} from '@/app/components/libs/charts/common/common-horizontal-bar'
import { withAppPrefix } from '@/config/environment'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분  : 멤버, 관리자 권한 - 설비 영향 분석 시뮬레이션 페이지
 * 03. 설명     : 4단계(선택 > 조건설정 > 로딩 > 결과) 시뮬레이션 UI 제공
 *                - 장비 목록 조회(고객별)
 *                - 불러오기: Python /api/simulate/template/{device_id} 연동
 *                - Simulation Run: Python /api/simulate/predict 연동
 * 04. 작성일자  : 2026.04.13
 * 05. 작성자   : 이우창
 */

type ConditionKeyType =
  | 'PRESSURE'
  | 'TEMPERATURE'
  | 'HZ'
  | 'AVGVOLTAGE'
  | 'AVGCURRENT'
  | 'FACTOR'

type ConditionRowType = {
  key: ConditionKeyType
  label: string
  min: number
  value: number
  max: number
  step: number
  digits: number
}

type ResultRowType = {
  label: string
  value: string
}

type DiffDirectionType = 'increase' | 'decrease' | 'flat'

type SimulationSummaryType = {
  line15Prefix: string
  line15Value: string
  line15Direction: DiffDirectionType
  line30Prefix: string
  line30Value: string
  line30Direction: DiffDirectionType
}

type SimulationResultType = {
  summary: SimulationSummaryType
  baseResult: ResultRowType[]
  simulationResult: ResultRowType[]
  bars: CommonBarChartItemType[]
  impacts: CommonHorizontalBarItemType[]
  yAxisTicks: number[]
}

type DeviceOptionType = {
  deviceId: string
  deviceName: string
}

type GetMemberDevicesResponseType = {
  success: boolean
  data: DeviceOptionType[]
  message?: string
}

type TemplateResponseType = {
  device_id: string
  base_timestamp: string
  base_log_id: number
  editable_fields?: Partial<Record<ConditionKeyType, number>>
  baseline?: {
    device_id: string
    best_model?: string
    preds?: Array<{
      y_15_pred?: number
      y_30_pred?: number
    }>
    base_timestamp?: string
  }
  message?: string
}

type PredictResponseType = {
  device_id: string
  base_timestamp: string
  overrides?: Record<string, number>
  baseline?: {
    device_id: string
    best_model?: string
    preds?: Array<{ y_15_pred?: number; y_30_pred?: number }>
    base_timestamp?: string
  }
  simulated?: {
    device_id: string
    best_model?: string
    preds?: Array<{ y_15_pred?: number; y_30_pred?: number }>
    base_timestamp?: string
  }
  delta?: {
    y_15_pred?: number
    y_30_pred?: number
    y_15_pct?: number
    y_30_pct?: number
  }
  input_influence?: Record<string, number>
  message?: string
}

type TemplateContextType = {
  deviceId: string
  baseTimestamp: string
  baseLogId: number
}

type LoadConditionRequestType = {
  deviceId: string
  queryHour: number
}

type RunSimulationRequestType = {
  deviceId: string
  queryHour: number
  baseTimestamp: string
  baseLogId: number
  overrides: Record<string, number>
}

/******************** 변수 영역 ********************/
const CONDITION_META: Record<ConditionKeyType, Omit<ConditionRowType, 'key' | 'value'>> = {
  PRESSURE: { label: '압력 (Pressure)', min: 0, max: 10, step: 0.1, digits: 1 },
  TEMPERATURE: { label: '온도 (℃)', min: 0, max: 150, step: 1, digits: 0 },
  HZ: { label: 'RPM (Hz)', min: 0, max: 80, step: 0.01, digits: 2 },
  AVGVOLTAGE: { label: '평균 전압 (Volt)', min: 0, max: 2000, step: 1, digits: 0 },
  AVGCURRENT: { label: '평균 전류 (A)', min: 0, max: 3000, step: 1, digits: 0 },
  FACTOR: { label: '역률 (Factor)', min: -1, max: 1, step: 0.01, digits: 2 },
} // 조건별 UI/입력 범위 메타 정보

const CONDITION_ORDER: ConditionKeyType[] = [
  'PRESSURE',
  'TEMPERATURE',
  'HZ',
  'AVGVOLTAGE',
  'AVGCURRENT',
  'FACTOR',
] // 조건 표시 순서

/******************** 함수 영역 ********************/
// 조건 행 배열을 key-value 맵 형태로 변환하는 함수
const toValueMap = (rows: ConditionRowType[]) =>
  Object.fromEntries(rows.map((row) => [row.key, row.value]))

// 값을 최소/최대 범위로 제한하는 함수
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

// step 단위로 스냅 후 digits 자리수로 반올림하는 함수
const roundToStep = (value: number, step: number, digits: number) => {
  const snapped = Math.round(value / step) * step // step 단위 보정값
  return Number(snapped.toFixed(digits))
}

// 세션(localStorage)에서 customer_id를 추출하는 함수
const getCustomerIdFromSession = () => {
  if (typeof window === 'undefined') return ''
  const raw = localStorage.getItem('session.userInfo') // 세션 원본 문자열
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as { customer_id?: string; customerId?: string } // 파싱된 세션 객체
    return String(parsed.customer_id ?? parsed.customerId ?? '').trim()
  } catch {
    return ''
  }
}

// 숫자 변환 실패 시 fallback을 반환하는 안전 숫자 변환 함수
const safeNum = (value: unknown, fallback = 0) => {
  const n = Number(value) // 숫자 변환 결과
  return Number.isFinite(n) ? n : fallback
}

// 증감 방향(increase/decrease/flat)을 판별하는 함수
const getDiffDirection = (delta: number): DiffDirectionType => {
  if (delta > 0) return 'increase'
  if (delta < 0) return 'decrease'
  return 'flat'
}

// 바 차트 Y축 틱을 데이터 범위에 맞게 생성하는 함수
const buildNiceYAxisTicks = (values: number[]): number[] => {
  const valid = values.filter((v) => Number.isFinite(v)) // 유효 숫자만 필터
  if (!valid.length) return [100, 80, 60, 40, 20, 0]

  const minVal = Math.min(...valid) // 최소값
  const maxVal = Math.max(...valid) // 최대값
  const range = Math.max(maxVal - minVal, 1) // 최소 범위 보장
  const padding = range * 0.12 // 상하 패딩
  const rawMin = minVal - padding // 패딩 포함 최소값
  const rawMax = maxVal + padding // 패딩 포함 최대값
  const roughStep = Math.max((rawMax - rawMin) / 5, 1e-6) // 대략적인 단계

  const magnitude = 10 ** Math.floor(Math.log10(roughStep)) // 자릿수 크기
  const normalized = roughStep / magnitude // 정규화된 단계
  let stepBase = 1 // 단계 베이스
  if (normalized > 5) stepBase = 10
  else if (normalized > 2) stepBase = 5
  else if (normalized > 1) stepBase = 2

  const step = stepBase * magnitude // 최종 단계값
  const axisMin = Math.floor(rawMin / step) * step // 축 최소값
  const axisMax = Math.ceil(rawMax / step) * step // 축 최대값

  const decimals = step < 1 ? 2 : 0 // 표시 소수점 자리수
  const ticks: number[] = [] // Y축 틱 배열
  for (let v = axisMax; v >= axisMin; v -= step) {
    ticks.push(Number(v.toFixed(decimals)))
    if (ticks.length > 10) break
  }
  return ticks.length ? ticks : [axisMax, axisMin]
}

// kW 값을 표기 문자열로 변환하는 함수
const formatKw = (value: number) => `${value.toFixed(2)} kW`

// kW 값을 부호(+/-) 포함 문자열로 변환하는 함수
const signedKw = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)} kW`

// 고객 ID 기준 장비 목록을 조회하는 API 함수
const fetchMemberDevices = async (customerId: string): Promise<DeviceOptionType[]> => {
  const response = await fetch(
    withAppPrefix(`/api/member/getDevices?customerId=${encodeURIComponent(customerId)}`),
    { method: 'GET' },
  )

  const json = (await response.json()) as GetMemberDevicesResponseType // API 응답 JSON
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? '장비 목록 조회 실패')
  }

  return Array.isArray(json.data) ? json.data : []
}

// template 응답의 editable_fields를 화면용 조건 행으로 변환하는 함수
const buildConditionRowsFromEditableFields = (
  editableFields: Partial<Record<ConditionKeyType, number>> | undefined,
): ConditionRowType[] => {
  if (!editableFields) return []

  return CONDITION_ORDER.flatMap((key) => {
    const rawValue = editableFields[key] // 원본 입력값
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) return []

    const meta = CONDITION_META[key] // 해당 키 메타
    const clamped = clamp(rawValue, meta.min, meta.max) // 범위 제한값
    const value = roundToStep(clamped, meta.step, meta.digits) // step/자리수 보정값

    return [
      {
        key,
        label: meta.label,
        min: meta.min,
        max: meta.max,
        step: meta.step,
        digits: meta.digits,
        value,
      },
    ]
  })
}

// 불러오기(template) API를 호출해 조건/기준 정보를 구성하는 함수
const fetchSimulationTemplate = async ({
  deviceId,
  queryHour,
}: LoadConditionRequestType): Promise<{
  conditionRows: ConditionRowType[]
  initialValues: Record<string, number>
  baseTimestamp: string
  baseLogId: number
}> => {
  const url = withAppPrefix(
    `/api/simulate/template/${encodeURIComponent(deviceId)}?lookback_hours=${queryHour}`,
  ) // template 조회 URL

  const response = await fetch(url, { method: 'GET' })
  const json = (await response.json().catch(() => null)) as TemplateResponseType | null // 응답 JSON

  if (!response.ok || !json) {
    throw new Error(
      (json as any)?.message ??
        `시뮬레이션 템플릿 조회에 실패했습니다. (HTTP ${response.status})`,
    )
  }

  const baseTimestamp = String(json.base_timestamp ?? '').trim() // 기준 시각
  const baseLogId = safeNum(json.base_log_id, NaN) // 기준 로그 ID

  if (!baseTimestamp || !Number.isFinite(baseLogId)) {
    throw new Error('템플릿 응답에 base_timestamp/base_log_id가 없어 실행할 수 없습니다.')
  }

  const conditionRows = buildConditionRowsFromEditableFields(json.editable_fields) // 조건 행 데이터
  const initialValues = toValueMap(conditionRows) // 초기 조건값 맵

  return {
    conditionRows,
    initialValues,
    baseTimestamp,
    baseLogId,
  }
}

// Simulation Run(predict) API를 호출하는 함수
const fetchSimulationPredict = async (
  payload: RunSimulationRequestType,
): Promise<PredictResponseType> => {
  const response = await fetch(withAppPrefix('/api/simulate/predict'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: payload.deviceId,
      overrides: payload.overrides,
      lookback_hours: payload.queryHour,
      base_timestamp: payload.baseTimestamp,
      base_log_id: payload.baseLogId,
    }),
  })

  const json = (await response.json().catch(() => null)) as PredictResponseType | null // 응답 JSON
  if (!response.ok || !json) {
    throw new Error(
      (json as any)?.message ?? `시뮬레이션 예측 실행에 실패했습니다. (HTTP ${response.status})`,
    )
  }

  return json
}

// baseline/simulated 블록에서 15분/30분 예측값을 안전 추출하는 함수
const getPredValue = (
  block: PredictResponseType['baseline'] | PredictResponseType['simulated'] | undefined,
) => {
  if (!block) return null
  const first = Array.isArray(block.preds) ? block.preds[0] : undefined // 첫 예측 결과
  const y15 = safeNum(first?.y_15_pred, NaN) // 15분 예측값
  const y30 = safeNum(first?.y_30_pred, NaN) // 30분 예측값
  if (!Number.isFinite(y15) || !Number.isFinite(y30)) return null

  return {
    bestModel: String(block.best_model ?? '-'),
    baseTimestamp: String(block.base_timestamp ?? '-'),
    y15,
    y30,
  }
}

// 입력 영향도 항목을 화면용 바 데이터로 변환하는 함수
const buildImpactItems = (
  influence: Record<string, number> | undefined,
  changedKeys: Set<string>,
): CommonHorizontalBarItemType[] => {
  if (changedKeys.size === 0) return []

  const entries = Object.entries(influence ?? {})
    .filter(([key]) => changedKeys.has(key))
    .map(([key, value]) => [key, safeNum(value, NaN)] as const)
    .filter(([, value]) => Number.isFinite(value)) // 유효한 변경 항목만 추출

  if (!entries.length) return []

  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 1) // 정규화 기준 최대값

  return entries
    .map(([key, value]) => ({
      label: CONDITION_META[key as ConditionKeyType]?.label ?? key,
      rate: Number(((Math.abs(value) / maxAbs) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.rate - a.rate)
}

// predict 응답을 결과 카드/차트 데이터로 가공하는 함수
const buildSimulationResult = (
  predict: PredictResponseType,
  equipmentName: string,
  changedKeys: Set<string>,
): SimulationResultType => {
  const baseline = getPredValue(predict.baseline) // 기준 예측값
  const simulated = getPredValue(predict.simulated) // 시뮬레이션 예측값

  if (!baseline || !simulated) {
    throw new Error('예측 응답 형식이 올바르지 않습니다. baseline/simulated 값을 확인하세요.')
  }

  const diff15 = simulated.y15 - baseline.y15 // 15분 차이(kW)
  const diff30 = simulated.y30 - baseline.y30 // 30분 차이(kW)

  const pct15 = baseline.y15 !== 0 ? (diff15 / baseline.y15) * 100 : 0 // 15분 증감률
  const pct30 = baseline.y30 !== 0 ? (diff30 / baseline.y30) * 100 : 0 // 30분 증감률

  const yAxisTicks = buildNiceYAxisTicks([baseline.y15, simulated.y15, baseline.y30, simulated.y30]) // 동적 Y축
  const domainMin = Math.min(...yAxisTicks) // Y축 최소
  const domainMax = Math.max(...yAxisTicks) // Y축 최대

  // 값 -> 바 높이(%) 변환 함수
  const toHeight = (v: number) => {
    if (domainMax === domainMin) return 50
    const ratio = ((v - domainMin) / (domainMax - domainMin)) * 100
    return Number(Math.max(2, Math.min(100, ratio)).toFixed(2))
  }

  const summary: SimulationSummaryType = {
    line15Prefix: '15분 예측값이 기준 대비',
    line15Value: ` ${Math.abs(pct15).toFixed(2)}% ${
      pct15 >= 0 ? '증가' : pct15 < 0 ? '감소' : '유지'
    } (${signedKw(diff15)})`,
    line15Direction: getDiffDirection(diff15),
    line30Prefix: '30분 예측값이 기준 대비',
    line30Value: ` ${Math.abs(pct30).toFixed(2)}% ${
      pct30 >= 0 ? '증가' : pct30 < 0 ? '감소' : '유지'
    } (${signedKw(diff30)})`,
    line30Direction: getDiffDirection(diff30),
  } // 요약 영역 문구

  const baseResult: ResultRowType[] = [
    { label: '장비 명', value: equipmentName },
    { label: '모델', value: baseline.bestModel || '-' },
    { label: '기준 시간', value: baseline.baseTimestamp || '-' },
    { label: '15분 예측값(전력 사용량 단위: kW)', value: baseline.y15.toFixed(2) },
    { label: '30분 예측값(전력 사용량 단위: kW)', value: baseline.y30.toFixed(2) },
  ] // 기준 예측결과 카드 데이터

  const simulationResult: ResultRowType[] = [
    { label: '장비 명', value: equipmentName },
    { label: '모델', value: simulated.bestModel || '-' },
    { label: '기준 시간', value: simulated.baseTimestamp || '-' },
    { label: '15분 예측값(전력 사용량 단위: kW)', value: simulated.y15.toFixed(2) },
    { label: '30분 예측값(전력 사용량 단위: kW)', value: simulated.y30.toFixed(2) },
  ] // 시뮬레이션 결과 카드 데이터

  const bars: CommonBarChartItemType[] = [
    { label: '15분 기준값', value: formatKw(baseline.y15), height: toHeight(baseline.y15), pred: false },
    { label: '15분 시뮬값', value: formatKw(simulated.y15), height: toHeight(simulated.y15), pred: true },
    { label: '30분 기준값', value: formatKw(baseline.y30), height: toHeight(baseline.y30), pred: false },
    { label: '30분 시뮬값', value: formatKw(simulated.y30), height: toHeight(simulated.y30), pred: true },
  ] // 기준 vs 시뮬레이션 비교 바 차트 데이터

  const impacts = buildImpactItems(predict.input_influence, changedKeys) // 입력 영향도 바 데이터

  return {
    summary,
    baseResult,
    simulationResult,
    bars,
    impacts,
    yAxisTicks,
  }
}

export default function SimulationPage() {
  /******************** 변수 영역 ********************/
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 화면 단계(1:선택, 2:조건, 3:로딩, 4:결과)

  const [equipment, setEquipment] = useState('') // 선택 장비 ID(DEVICE_ID)
  const [queryHour, setQueryHour] = useState(24) // 조회 시간(1~744)

  const [deviceOptions, setDeviceOptions] = useState<DeviceOptionType[]>([]) // 장비 선택 옵션
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false) // 장비 목록 로딩 여부

  const [isFetchingInitial, setIsFetchingInitial] = useState(false) // 불러오기(template) 실행 여부
  const [isRunning, setIsRunning] = useState(false) // Simulation Run 실행 여부

  const [conditionRows, setConditionRows] = useState<ConditionRowType[]>([]) // 조건 행 리스트
  const [conditionValues, setConditionValues] = useState<Record<string, number>>({}) // 현재 조건값 맵
  const [initialConditionValues, setInitialConditionValues] = useState<Record<string, number>>({}) // 초기 조건값 맵

  const [templateContext, setTemplateContext] = useState<TemplateContextType | null>(null) // 실행에 필요한 기준 컨텍스트
  const [resultData, setResultData] = useState<SimulationResultType | null>(null) // 최종 결과 데이터

  const [warnOpen, setWarnOpen] = useState(false) // 경고 모달 오픈 여부
  const [warnTitle, setWarnTitle] = useState('') // 경고 모달 제목
  const [warnDetail, setWarnDetail] = useState('') // 경고 모달 상세 내용

  const selectedEquipmentName = useMemo(
    () => deviceOptions.find((d) => d.deviceId === equipment)?.deviceName ?? '-',
    [deviceOptions, equipment],
  ) // 선택 장비명

  const showCondition = step >= 2 // 조건 카드 표시 여부
  const showResult = step === 4 && resultData !== null // 결과 카드 표시 여부
  const canRun =
    step >= 2 &&
    !isFetchingInitial &&
    !isRunning &&
    !isLoadingEquipment &&
    Boolean(equipment) &&
    Boolean(templateContext) &&
    templateContext?.deviceId === equipment &&
    conditionRows.length > 0 // Simulation Run 가능 여부

  const currentResult = resultData // 렌더링용 결과 참조

  /******************** 함수 영역 ********************/
  // 경고 모달 오픈 함수
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title)
    setWarnDetail(detail)
    setWarnOpen(true)
  }

  // 경고 모달 닫기 함수
  const closeWarn = () => setWarnOpen(false)

  // 시뮬레이션 상태를 초기화하는 함수(장비/시간 변경 시 사용)
  const resetSimulationState = () => {
    setStep(1)
    setConditionRows([])
    setConditionValues({})
    setInitialConditionValues({})
    setTemplateContext(null)
    setResultData(null)
  }

  // 장비 선택 변경 처리 함수
  const handleEquipmentChange = (nextDeviceId: string) => {
    setEquipment(nextDeviceId)
    resetSimulationState()
  }

  // 조회 시간 변경 처리 함수(범위 보정 포함)
  const handleQueryHourChange = (nextHour: number) => {
    const normalized = Math.max(1, Math.min(744, Math.floor(nextHour))) // 1~744 정수 제한
    setQueryHour(normalized)
    resetSimulationState()
  }

  // 조건 슬라이더 값 변경 처리 함수
  const handleConditionChange = (key: string, value: number) => {
    const row = conditionRows.find((r) => r.key === key) // 대상 조건 행
    if (!row) return

    const clamped = clamp(value, row.min, row.max) // 범위 제한값
    const rounded = roundToStep(clamped, row.step, row.digits) // step/자리수 보정값
    setConditionValues((prev) => ({ ...prev, [key]: rounded }))
  }

  // 초기값 대비 변경된 항목만 overrides로 구성하는 함수
  const buildOverrides = () => {
    const overrides: Record<string, number> = {} // 변경값 맵
    const changedKeys = new Set<string>() // 변경 키 집합

    conditionRows.forEach((row) => {
      const current = safeNum(conditionValues[row.key], NaN) // 현재값
      if (!Number.isFinite(current)) return

      const original = safeNum(initialConditionValues[row.key], NaN) // 초기값
      const changed = !Number.isFinite(original) || Math.abs(current - original) >= row.step / 2 // 변경 여부

      if (changed) {
        overrides[row.key] = Number(current.toFixed(row.digits))
        changedKeys.add(row.key)
      }
    })

    return { overrides, changedKeys }
  }

  // 불러오기(template) 버튼 처리 함수
  const handleLoadInitial = async () => {
    if (isFetchingInitial || isRunning || !equipment) return

    setIsFetchingInitial(true)

    try {
      const normalizedHour = Math.max(1, Math.min(744, Math.floor(queryHour))) // 조회시간 보정
      const loaded = await fetchSimulationTemplate({
        deviceId: equipment,
        queryHour: normalizedHour,
      })

      if (!loaded.conditionRows.length) {
        openWarn('조회 결과 없음', '조정 가능한 항목이 없습니다.')
      }

      setQueryHour(normalizedHour)
      setConditionRows(loaded.conditionRows)
      setConditionValues(loaded.initialValues)
      setInitialConditionValues(loaded.initialValues)
      setTemplateContext({
        deviceId: equipment,
        baseTimestamp: loaded.baseTimestamp,
        baseLogId: loaded.baseLogId,
      })
      setResultData(null)
      setStep(2)
    } catch (error: any) {
      console.error(error)
      openWarn(
        '불러오기 실패',
        error?.message ?? '초기 조건 불러오기 중 오류가 발생했습니다.',
      )
    } finally {
      setIsFetchingInitial(false)
    }
  }

  // Simulation Run 버튼 처리 함수
  const handleRunSimulation = async () => {
    if (!canRun || !templateContext) return

    setIsRunning(true)
    setStep(3)

    try {
      const { overrides, changedKeys } = buildOverrides() // 변경값/변경키 구성

      const predict = await fetchSimulationPredict({
        deviceId: equipment,
        queryHour,
        baseTimestamp: templateContext.baseTimestamp,
        baseLogId: templateContext.baseLogId,
        overrides,
      })

      const simulationResult = buildSimulationResult(predict, selectedEquipmentName, changedKeys)
      setResultData(simulationResult)
      setStep(4)
    } catch (error: any) {
      console.error(error)
      openWarn(
        'Simulation 실패',
        error?.message ?? '시뮬레이션 실행 중 오류가 발생했습니다.',
      )
      setStep(2)
    } finally {
      setIsRunning(false)
    }
  }

  // min/max 기준으로 값의 퍼센트 위치를 계산하는 함수
  const toPercent = (min: number, max: number, value: number) => {
    if (max === min) return 0
    const percent = ((value - min) / (max - min)) * 100 // 상대 위치(%)
    return Math.max(0, Math.min(100, percent))
  }

  // 숫자를 소수점 자리수(digits)로 문자열 포맷하는 함수
  const formatValue = (value: number, digits: number) => value.toFixed(digits)

  // 결과 리스트에서 예측값 행 여부를 판별하는 함수
  const isForecastValueRow = (label: string) =>
    label.includes('15분 예측값') || label.includes('30분 예측값')

  // 요약 문구 색상 클래스를 방향값에 맞춰 반환하는 함수
  const getSummaryClassName = (dir: DiffDirectionType) => {
    if (dir === 'increase') return mmc.simulation_summaryIncreaseText
    if (dir === 'decrease') return mmc.simulation_summaryDecreaseText
    return mmc.simulation_summaryNeutralText
  }

  /******************** 수행 영역 ********************/
  useEffect(() => {
    // 초기 진입 시 세션의 customer_id 기준으로 장비 목록을 조회한다.
    const loadDevices = async () => {
      const customerId = getCustomerIdFromSession() // 세션 고객 ID
      if (!customerId) {
        setDeviceOptions([])
        setEquipment('')
        return
      }

      setIsLoadingEquipment(true)
      try {
        const list = await fetchMemberDevices(customerId) // 장비 목록 조회
        setDeviceOptions(list)
        setEquipment((prev) => {
          if (prev && list.some((item) => item.deviceId === prev)) return prev // 기존 선택 유지
          return list[0]?.deviceId ?? '' // 없으면 첫 장비 선택
        })
      } catch (error: any) {
        console.error(error)
        setDeviceOptions([])
        setEquipment('')
        openWarn('장비 조회 실패', error?.message ?? '장비 목록을 불러오지 못했습니다.')
      } finally {
        setIsLoadingEquipment(false)
      }
    }

    loadDevices()
  }, []) // 마운트 시 1회 실행

  return (
    <div className={mmc.simulation_root}>
      <header className={`${mmc.simulation_pageHead} ${mmc.simulation_stageFadeUp}`}>
        <h1>설비 영향 분석 시뮬레이션</h1>
        <p>실시간 컴프레서 운전 상태 및 30분 예측 결과를 확인할 수 있습니다.</p>
      </header>

      <section className={`${mmc.simulation_selectCard} ${mmc.simulation_stageFadeUp}`}>
        <div className={mmc.simulation_selectTitleWrap}>
          <h2>장비 선택/입력</h2>
          <p>설비 영향을 분석하기 위해 장비 및 조회시간을 선택/입력해주세요.</p>
        </div>

        <div className={mmc.simulation_selectControls}>
          <div className={`${mmc.simulation_field} ${mmc.simulation_field_equipment}`}>
            <div className={mmc.simulation_fieldTop}>
              <span className={mmc.simulation_fieldLabel}>장비 명</span>
              <span className={mmc.simulation_fieldHint}>권한이 있는 장비 선택 가능</span>
            </div>

            <select
              className={`${mmc.simulation_select} ${mmc.simulation_select_equipment}`}
              value={equipment}
              onChange={(e) => handleEquipmentChange(e.target.value)}
              disabled={isLoadingEquipment || deviceOptions.length === 0}
            >
              {isLoadingEquipment ? (
                <option value="">장비 목록 로딩중..</option>
              ) : deviceOptions.length ? (
                deviceOptions.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.deviceName}
                  </option>
                ))
              ) : (
                <option value="">등록된 장비가 없습니다.</option>
              )}
            </select>
          </div>

          <div className={`${mmc.simulation_field} ${mmc.simulation_field_time}`}>
            <div className={mmc.simulation_fieldTop}>
              <span className={mmc.simulation_fieldLabel}>조회 시간</span>
              <span className={mmc.simulation_fieldHint}>최대 744, 최소 1</span>
            </div>

            <input
              className={`${mmc.simulation_numberInput} ${mmc.simulation_numberInputSpin}`}
              type="number"
              value={queryHour}
              min={1}
              max={744}
              step={1}
              onChange={(e) => {
                const next = Number(e.target.value) // 입력 숫자
                if (Number.isNaN(next)) {
                  handleQueryHourChange(1)
                  return
                }
                handleQueryHourChange(next)
              }}
            />
          </div>

          <button
            type="button"
            className={mmc.simulation_loadBtn}
            onClick={handleLoadInitial}
            disabled={isFetchingInitial || isRunning || isLoadingEquipment || !equipment}
          >
            {isFetchingInitial ? '불러오는 중..' : '불러오기'}
          </button>
        </div>
      </section>

      {showCondition && (
        <section className={mmc.simulation_grid}>
          <article
            className={`${mmc.simulation_card} ${mmc.simulation_conditionCard} ${mmc.simulation_stageFadeUp}`}
          >
            <div className={`${mmc.simulation_cardHead} ${mmc.simulation_conditionHead}`}>
              <h3>분석 조건 설정</h3>
              <p>*초기에는 장비별 기준값으로 설정됩니다.</p>
            </div>

            <p className={mmc.simulation_conditionInfo}>
              컴프레서의 입력 운전 조건을 입력하여 최적화 결과 시뮬레이션을 진행합니다.
            </p>

            <div className={mmc.simulation_conditionTableHead}>
              <span>특성명</span>
              <span>설정 값</span>
            </div>

            <div className={mmc.simulation_conditionRows}>
              {conditionRows.length ? (
                conditionRows.map((row) => {
                  const currentValue = conditionValues[row.key] ?? row.value // 현재 표시값
                  const sliderPercent = toPercent(row.min, row.max, currentValue) // 슬라이더 퍼센트 위치

                  return (
                    <div key={row.key} className={mmc.simulation_conditionRow}>
                      <div className={mmc.simulation_conditionName}>{row.label}</div>

                      <div className={mmc.simulation_sliderBox}>
                        <div className={mmc.simulation_sliderMeta}>
                          <span>{row.min}</span>
                          <span>{row.max}</span>
                        </div>

                        <div className={mmc.simulation_sliderTrackWrap}>
                          <span
                            className={mmc.simulation_sliderValueBadge}
                            style={{ left: `${sliderPercent}%` }}
                          >
                            {formatValue(currentValue, row.digits)}
                          </span>

                          <input
                            type="range"
                            className={mmc.simulation_slider}
                            min={row.min}
                            max={row.max}
                            step={row.step}
                            value={currentValue}
                            onChange={(e) =>
                              handleConditionChange(row.key, Number(e.target.value))
                            }
                            style={{
                              background: `linear-gradient(90deg, #6f86e8 0%, #6f86e8 ${sliderPercent}%, #ced7ef ${sliderPercent}%, #ced7ef 100%)`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className={mmc.simulation_conditionRow}>
                  <div className={mmc.simulation_conditionName}>조정 가능한 항목이 없습니다.</div>
                </div>
              )}
            </div>

            <button
              type="button"
              className={mmc.simulation_runBtn}
              onClick={handleRunSimulation}
              disabled={!canRun}
            >
              {isRunning ? 'Simulation Running...' : 'Simulation Run'}
            </button>
          </article>

          {showResult && currentResult && (
            <article
              className={`${mmc.simulation_card} ${mmc.simulation_resultCard} ${mmc.simulation_stageFadeUpDelayed}`}
            >
              <div className={`${mmc.simulation_cardHead} ${mmc.simulation_resultHead}`}>
                <h3>시뮬레이션 결과</h3>
                <p>*15분과 30분 단위의 전력 사용량 예측값에 대한 결과를 제공합니다.</p>
              </div>

              <p className={mmc.simulation_resultIntro}>
                기준값과 대비하는 시뮬레이션 결과에 대한 분석 결과를 종합적으로 제공합니다.
              </p>

              <div className={mmc.simulation_resultLayout}>
                <div className={mmc.simulation_resultLeft}>
                  <div className={mmc.simulation_summaryBox}>
                    <strong className={mmc.simulation_summaryTitle}>*시뮬레이션 요약</strong>
                    <p className={mmc.simulation_summaryText}>
                      {currentResult.summary.line15Prefix}
                      <span className={getSummaryClassName(currentResult.summary.line15Direction)}>
                        {currentResult.summary.line15Value}
                      </span>
                    </p>
                    <p className={mmc.simulation_summaryText}>
                      {currentResult.summary.line30Prefix}
                      <span className={getSummaryClassName(currentResult.summary.line30Direction)}>
                        {currentResult.summary.line30Value}
                      </span>
                    </p>
                  </div>

                  <div className={mmc.simulation_resultListCard}>
                    <h4>기준 예측결과</h4>
                    {currentResult.baseResult.map((row) => (
                      <div
                        key={`base-${row.label}`}
                        className={`${mmc.simulation_resultRow} ${
                          isForecastValueRow(row.label) ? mmc.simulation_resultRowHighlight : ''
                        }`}
                      >
                        <span className={mmc.simulation_resultLabel}>
                          <i className={mmc.simulation_resultDot} aria-hidden="true" />
                          {row.label}
                        </span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>

                  <div className={mmc.simulation_resultListCard}>
                    <h4>시뮬레이션 결과</h4>
                    {currentResult.simulationResult.map((row) => (
                      <div
                        key={`sim-${row.label}`}
                        className={`${mmc.simulation_resultRow} ${
                          isForecastValueRow(row.label) ? mmc.simulation_resultRowHighlight : ''
                        }`}
                      >
                        <span className={mmc.simulation_resultLabel}>
                          <i className={mmc.simulation_resultDot} aria-hidden="true" />
                          {row.label}
                        </span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={mmc.simulation_resultRight}>
                  <div className={mmc.simulation_chartBox}>
                    <h4 className={mmc.simulation_chartTitle}>기준 vs 시뮬레이션 결과 비교</h4>
                    <CommonBarChart
                      bars={currentResult.bars}
                      yAxisTicks={currentResult.yAxisTicks}
                      valueOffsetPx={6}
                    />
                  </div>

                  <div className={mmc.simulation_impactBox}>
                    <h4>입력 영향도 분석</h4>
                    {currentResult.impacts.length ? (
                      <CommonHorizontalBar items={currentResult.impacts} />
                    ) : (
                      <p className={mmc.simulation_impactEmpty}>
                        입력값 변경이 없어 영향도 분석 결과가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )}
        </section>
      )}

      <LoadingModal
        open={isRunning || isFetchingInitial}
        message={
          isFetchingInitial
            ? '초기 조건을 불러오는 중입니다.'
            : '시뮬레이션 분석을 실행중입니다.'
        }
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
