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
 * 04. 설명     : 4단계(선택 > 조건설정 > 로딩 > 결과) 시뮬레이션 UI 제공
 *                - 장비 목록 조회(고객별)
 *                - 불러오기: Python /api/simulate/template/{device_id} 연동
 *                - Simulation Run: Python /api/simulate/predict 연동
 * 05. 작성일자  : 2026.04.13
 * 06. 작성자   : Codex
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

const CONDITION_META: Record<ConditionKeyType, Omit<ConditionRowType, 'key' | 'value'>> = {
  PRESSURE: { label: '압력 (Pressure)', min: 0, max: 10, step: 0.1, digits: 1 },
  TEMPERATURE: { label: '온도 (℃)', min: 0, max: 150, step: 1, digits: 0 },
  HZ: { label: 'RPM (Hz)', min: 0, max: 80, step: 0.01, digits: 2 },
  AVGVOLTAGE: { label: '평균 전압 (Volt)', min: 0, max: 2000, step: 1, digits: 0 },
  AVGCURRENT: { label: '평균 전류 (A)', min: 0, max: 3000, step: 1, digits: 0 },
  FACTOR: { label: '역률 (Factor)', min: -1, max: 1, step: 0.01, digits: 2 },
}

const CONDITION_ORDER: ConditionKeyType[] = [
  'PRESSURE',
  'TEMPERATURE',
  'HZ',
  'AVGVOLTAGE',
  'AVGCURRENT',
  'FACTOR',
]

const toValueMap = (rows: ConditionRowType[]) =>
  Object.fromEntries(rows.map((row) => [row.key, row.value]))

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const roundToStep = (value: number, step: number, digits: number) => {
  const snapped = Math.round(value / step) * step
  return Number(snapped.toFixed(digits))
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

const safeNum = (value: unknown, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const getDiffDirection = (delta: number): DiffDirectionType => {
  if (delta > 0) return 'increase'
  if (delta < 0) return 'decrease'
  return 'flat'
}


const buildNiceYAxisTicks = (values: number[]): number[] => {
  const valid = values.filter((v) => Number.isFinite(v))
  if (!valid.length) return [100, 80, 60, 40, 20, 0]

  const minVal = Math.min(...valid)
  const maxVal = Math.max(...valid)
  const range = Math.max(maxVal - minVal, 1)
  const padding = range * 0.12
  const rawMin = minVal - padding
  const rawMax = maxVal + padding
  const roughStep = Math.max((rawMax - rawMin) / 5, 1e-6)

  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  let stepBase = 1
  if (normalized > 5) stepBase = 10
  else if (normalized > 2) stepBase = 5
  else if (normalized > 1) stepBase = 2

  const step = stepBase * magnitude
  const axisMin = Math.floor(rawMin / step) * step
  const axisMax = Math.ceil(rawMax / step) * step

  const decimals = step < 1 ? 2 : 0
  const ticks: number[] = []
  for (let v = axisMax; v >= axisMin; v -= step) {
    ticks.push(Number(v.toFixed(decimals)))
    if (ticks.length > 10) break
  }
  return ticks.length ? ticks : [axisMax, axisMin]
}

const formatKw = (value: number) => `${value.toFixed(2)} kW`
const signedKw = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)} kW`

const fetchMemberDevices = async (customerId: string): Promise<DeviceOptionType[]> => {
  const response = await fetch(
    withAppPrefix(`/api/member/getDevices?customerId=${encodeURIComponent(customerId)}`),
    { method: 'GET' },
  )

  const json = (await response.json()) as GetMemberDevicesResponseType
  if (!response.ok || !json.success) {
    throw new Error(json.message ?? '장비 목록 조회 실패')
  }

  return Array.isArray(json.data) ? json.data : []
}

const buildConditionRowsFromEditableFields = (
  editableFields: Partial<Record<ConditionKeyType, number>> | undefined,
): ConditionRowType[] => {
  if (!editableFields) return []

  return CONDITION_ORDER.flatMap((key) => {
    const rawValue = editableFields[key]
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) return []

    const meta = CONDITION_META[key]
    const clamped = clamp(rawValue, meta.min, meta.max)
    const value = roundToStep(clamped, meta.step, meta.digits)

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
  )

  const response = await fetch(url, { method: 'GET' })
  const json = (await response.json().catch(() => null)) as TemplateResponseType | null

  if (!response.ok || !json) {
    throw new Error(
      (json as any)?.message ??
        `시뮬레이션 템플릿 조회에 실패했습니다. (HTTP ${response.status})`,
    )
  }

  const baseTimestamp = String(json.base_timestamp ?? '').trim()
  const baseLogId = safeNum(json.base_log_id, NaN)

  if (!baseTimestamp || !Number.isFinite(baseLogId)) {
    throw new Error('템플릿 응답에 base_timestamp/base_log_id가 없어 실행할 수 없습니다.')
  }

  const conditionRows = buildConditionRowsFromEditableFields(json.editable_fields)
  const initialValues = toValueMap(conditionRows)

  return {
    conditionRows,
    initialValues,
    baseTimestamp,
    baseLogId,
  }
}

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

  const json = (await response.json().catch(() => null)) as PredictResponseType | null
  if (!response.ok || !json) {
    throw new Error(
      (json as any)?.message ?? `시뮬레이션 예측 실행에 실패했습니다. (HTTP ${response.status})`,
    )
  }

  return json
}

const getPredValue = (
  block: PredictResponseType['baseline'] | PredictResponseType['simulated'] | undefined,
) => {
  if (!block) return null
  const first = Array.isArray(block.preds) ? block.preds[0] : undefined
  const y15 = safeNum(first?.y_15_pred, NaN)
  const y30 = safeNum(first?.y_30_pred, NaN)
  if (!Number.isFinite(y15) || !Number.isFinite(y30)) return null

  return {
    bestModel: String(block.best_model ?? '-'),
    baseTimestamp: String(block.base_timestamp ?? '-'),
    y15,
    y30,
  }
}

const buildImpactItems = (
  influence: Record<string, number> | undefined,
  changedKeys: Set<string>,
): CommonHorizontalBarItemType[] => {
  if (changedKeys.size === 0) return []

  const entries = Object.entries(influence ?? {})
    .filter(([key]) => changedKeys.has(key))
    .map(([key, value]) => [key, safeNum(value, NaN)] as const)
    .filter(([, value]) => Number.isFinite(value))

  if (!entries.length) return []

  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 1)

  return entries
    .map(([key, value]) => ({
      label: CONDITION_META[key as ConditionKeyType]?.label ?? key,
      rate: Number(((Math.abs(value) / maxAbs) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.rate - a.rate)
}

const buildSimulationResult = (
  predict: PredictResponseType,
  equipmentName: string,
  changedKeys: Set<string>,
): SimulationResultType => {
  const baseline = getPredValue(predict.baseline)
  const simulated = getPredValue(predict.simulated)

  if (!baseline || !simulated) {
    throw new Error('예측 응답 형식이 올바르지 않습니다. baseline/simulated 값을 확인하세요.')
  }

  const diff15 = simulated.y15 - baseline.y15
  const diff30 = simulated.y30 - baseline.y30

  const pct15 = baseline.y15 !== 0 ? (diff15 / baseline.y15) * 100 : 0
  const pct30 = baseline.y30 !== 0 ? (diff30 / baseline.y30) * 100 : 0

  const yAxisTicks = buildNiceYAxisTicks([baseline.y15, simulated.y15, baseline.y30, simulated.y30])
  const domainMin = Math.min(...yAxisTicks)
  const domainMax = Math.max(...yAxisTicks)

  const toHeight = (v: number) => {
    if (domainMax === domainMin) return 50
    const ratio = ((v - domainMin) / (domainMax - domainMin)) * 100
    return Number(Math.max(2, Math.min(100, ratio)).toFixed(2))
  }

  const summary: SimulationSummaryType = {
    line15Prefix: '15분 예측값이 기준 대비',
    line15Value: ` ${Math.abs(pct15).toFixed(2)}% ${pct15 >= 0 ? '증가' : pct15 < 0 ? '감소' : '유지'} (${signedKw(diff15)})`,
    line15Direction: getDiffDirection(diff15),
    line30Prefix: '30분 예측값이 기준 대비',
    line30Value: ` ${Math.abs(pct30).toFixed(2)}% ${pct30 >= 0 ? '증가' : pct30 < 0 ? '감소' : '유지'} (${signedKw(diff30)})`,
    line30Direction: getDiffDirection(diff30),
  }

  const baseResult: ResultRowType[] = [
    { label: '장비 명', value: equipmentName },
    { label: '모델', value: baseline.bestModel || '-' },
    { label: '기준 시간', value: baseline.baseTimestamp || '-' },
    { label: '15분 예측값(전력 사용량 단위: kW)', value: baseline.y15.toFixed(2) },
    { label: '30분 예측값(전력 사용량 단위: kW)', value: baseline.y30.toFixed(2) },
  ]

  const simulationResult: ResultRowType[] = [
    { label: '장비 명', value: equipmentName },
    { label: '모델', value: simulated.bestModel || '-' },
    { label: '기준 시간', value: simulated.baseTimestamp || '-' },
    { label: '15분 예측값(전력 사용량 단위: kW)', value: simulated.y15.toFixed(2) },
    { label: '30분 예측값(전력 사용량 단위: kW)', value: simulated.y30.toFixed(2) },
  ]

  const bars: CommonBarChartItemType[] = [
    { label: '15분 기준값', value: formatKw(baseline.y15), height: toHeight(baseline.y15), pred: false },
    { label: '15분 시뮬값', value: formatKw(simulated.y15), height: toHeight(simulated.y15), pred: true },
    { label: '30분 기준값', value: formatKw(baseline.y30), height: toHeight(baseline.y30), pred: false },
    { label: '30분 시뮬값', value: formatKw(simulated.y30), height: toHeight(simulated.y30), pred: true },
  ]

  const impacts = buildImpactItems(predict.input_influence, changedKeys)

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
  /******************** 변수영역 ********************/
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [equipment, setEquipment] = useState('') // DEVICE_ID
  const [queryHour, setQueryHour] = useState(24)

  const [deviceOptions, setDeviceOptions] = useState<DeviceOptionType[]>([])
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false)

  const [isFetchingInitial, setIsFetchingInitial] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const [conditionRows, setConditionRows] = useState<ConditionRowType[]>([])
  const [conditionValues, setConditionValues] = useState<Record<string, number>>({})
  const [initialConditionValues, setInitialConditionValues] = useState<Record<string, number>>({})

  const [templateContext, setTemplateContext] = useState<TemplateContextType | null>(null)
  const [resultData, setResultData] = useState<SimulationResultType | null>(null)

  const [warnOpen, setWarnOpen] = useState(false)
  const [warnTitle, setWarnTitle] = useState('')
  const [warnDetail, setWarnDetail] = useState('')

  const selectedEquipmentName = useMemo(
    () => deviceOptions.find((d) => d.deviceId === equipment)?.deviceName ?? '-',
    [deviceOptions, equipment],
  )

  const showCondition = step >= 2
  const showResult = step === 4 && resultData !== null
  const canRun =
    step >= 2 &&
    !isFetchingInitial &&
    !isRunning &&
    !isLoadingEquipment &&
    Boolean(equipment) &&
    Boolean(templateContext) &&
    templateContext?.deviceId === equipment &&
    conditionRows.length > 0

  const currentResult = resultData

  /******************** 함수영역 ********************/
  const openWarn = (title: string, detail: string) => {
    setWarnTitle(title)
    setWarnDetail(detail)
    setWarnOpen(true)
  }

  const closeWarn = () => setWarnOpen(false)

  const resetSimulationState = () => {
    setStep(1)
    setConditionRows([])
    setConditionValues({})
    setInitialConditionValues({})
    setTemplateContext(null)
    setResultData(null)
  }

  const handleEquipmentChange = (nextDeviceId: string) => {
    setEquipment(nextDeviceId)
    resetSimulationState()
  }

  const handleQueryHourChange = (nextHour: number) => {
    const normalized = Math.max(1, Math.min(744, Math.floor(nextHour)))
    setQueryHour(normalized)
    resetSimulationState()
  }

  const handleConditionChange = (key: string, value: number) => {
    const row = conditionRows.find((r) => r.key === key)
    if (!row) return

    const clamped = clamp(value, row.min, row.max)
    const rounded = roundToStep(clamped, row.step, row.digits)
    setConditionValues((prev) => ({ ...prev, [key]: rounded }))
  }

  const buildOverrides = () => {
    const overrides: Record<string, number> = {}
    const changedKeys = new Set<string>()

    conditionRows.forEach((row) => {
      const current = safeNum(conditionValues[row.key], NaN)
      if (!Number.isFinite(current)) return

      const original = safeNum(initialConditionValues[row.key], NaN)
      const changed = !Number.isFinite(original) || Math.abs(current - original) >= row.step / 2

      if (changed) {
        overrides[row.key] = Number(current.toFixed(row.digits))
        changedKeys.add(row.key)
      }
    })

    return { overrides, changedKeys }
  }

  const handleLoadInitial = async () => {
    if (isFetchingInitial || isRunning || !equipment) return

    setIsFetchingInitial(true)

    try {
      const normalizedHour = Math.max(1, Math.min(744, Math.floor(queryHour)))
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

  const handleRunSimulation = async () => {
    if (!canRun || !templateContext) return

    setIsRunning(true)
    setStep(3)

    try {
    const { overrides, changedKeys } = buildOverrides()

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

  const toPercent = (min: number, max: number, value: number) => {
    if (max === min) return 0
    const percent = ((value - min) / (max - min)) * 100
    return Math.max(0, Math.min(100, percent))
  }

  const formatValue = (value: number, digits: number) => value.toFixed(digits)

  const isForecastValueRow = (label: string) =>
    label.includes('15분 예측값') || label.includes('30분 예측값')

  // 7) 요약 렌더링 span class 동적화 (summaryBox 내부)
  const getSummaryClassName = (dir: DiffDirectionType) => {
    if (dir === 'increase') return mmc.simulation_summaryIncreaseText
    if (dir === 'decrease') return mmc.simulation_summaryDecreaseText
    return mmc.simulation_summaryNeutralText
  }

  /******************** 실행영역 ********************/
  useEffect(() => {
    const loadDevices = async () => {
      const customerId = getCustomerIdFromSession()
      if (!customerId) {
        setDeviceOptions([])
        setEquipment('')
        return
      }

      setIsLoadingEquipment(true)
      try {
        const list = await fetchMemberDevices(customerId)
        setDeviceOptions(list)
        setEquipment((prev) => {
          if (prev && list.some((item) => item.deviceId === prev)) return prev
          return list[0]?.deviceId ?? ''
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
  }, [])

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
                const next = Number(e.target.value)
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
                  const currentValue = conditionValues[row.key] ?? row.value
                  const sliderPercent = toPercent(row.min, row.max, currentValue)

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
                    <CommonBarChart bars={currentResult.bars} yAxisTicks={currentResult.yAxisTicks} valueOffsetPx={6} />
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
