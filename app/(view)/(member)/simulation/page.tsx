'use client'

import { useState } from 'react'
import mmc from './Simulation.module.css'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import CommonBarChart, {
  type CommonBarChartItemType,
} from '@/app/components/libs/charts/common/common-bar-chart'
import CommonHorizontalBar, {
  type CommonHorizontalBarItemType,
} from '@/app/components/libs/charts/common/common-horizontal-bar'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분 : 멤버, 관리자 권한 - 설비 영향 분석 시뮬레이션 페이지
 * 04. 설명     : 4단계(선택 > 조건설정 > 로딩 > 결과) 시뮬레이션 UI 제공
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

type ConditionRowType = {
  key: string
  label: string
  min: number
  value: number
  max: number
  step: number
}

type ResultRowType = {
  label: string
  value: string
}

type SimulationSummaryType = {
  line15Prefix: string
  line15Value: string
  line30Prefix: string
  line30Value: string
}

type SimulationResultType = {
  summary: SimulationSummaryType
  baseResult: ResultRowType[]
  simulationResult: ResultRowType[]
  bars: CommonBarChartItemType[]
  impacts: CommonHorizontalBarItemType[]
}

type LoadConditionRequestType = {
  equipment: string
  queryHour: number
}

type RunSimulationRequestType = {
  equipment: string
  queryHour: number
  conditions: Record<string, number>
}

const MOCK_INITIAL_CONDITIONS: ConditionRowType[] = [
  { key: 'pressure', label: '압력 (Pressure)', min: 0, value: 3, max: 10, step: 1 },
  { key: 'temp', label: '온도 (℃)', min: 0, value: 20, max: 150, step: 1 },
  { key: 'rpm', label: 'RPM (Hz)', min: 0, value: 30, max: 80, step: 1 },
  { key: 'volt', label: '평균 전압 (Volt)', min: 0, value: 200, max: 2000, step: 10 },
  { key: 'amp', label: '평균 전류 (A)', min: 0, value: 300, max: 3000, step: 10 },
  { key: 'factor', label: '역률 (Factor)', min: -1, value: 0.3, max: 1, step: 0.1 },
]

const MOCK_SIMULATION_RESULT: SimulationResultType = {
  summary: {
    line15Prefix: '15분 예측값은 기준 대비 ',
    line15Value: '▲ 10.14% 증가했습니다 (+1.495 kW).',
    line30Prefix: '30분 예측값은 기준 대비 ',
    line30Value: '▼ 10.73% 감소했습니다 (-1.652 kW).',
  },
  baseResult: [
    { label: '장비 명', value: '3260-0024A' },
    { label: '모델', value: 'XGBoost' },
    { label: '기준 시각', value: '2026-03-19T17:00:00' },
    { label: '15분 예측 값 (전력 사용량 단위: kW)', value: '14.744' },
    { label: '30분 예측 값 (전력 사용량 단위: kW)', value: '15.395' },
  ],
  simulationResult: [
    { label: '장비 명', value: '3260-0024A' },
    { label: '모델', value: 'XGBoost' },
    { label: '기준 시각', value: '2026-03-19T17:00:00' },
    { label: '15분 예측 값 (전력 사용량 단위: kW)', value: '16.238' },
    { label: '30분 예측 값 (전력 사용량 단위: kW)', value: '13.743' },
  ],
  bars: [
    { label: '15분 기준값', value: '81.74 kW', height: 82, pred: false },
    { label: '15분 예측값', value: '73.74 kW', height: 74, pred: true },
    { label: '30분 기준값', value: '21.74 kW', height: 22, pred: false },
    { label: '30분 예측값', value: '9.74 kW', height: 10, pred: true },
  ],
  impacts: [
    { label: '압력 (Pressure)', rate: 19 },
    { label: 'RPM (Hz)', rate: 14 },
    { label: '온도 (℃)', rate: 10 },
    { label: '평균 전압 (Volot)', rate: 8 },
    { label: '평균 전류 (A)', rate: 6 },
  ],
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const toValueMap = (rows: ConditionRowType[]) =>
  Object.fromEntries(rows.map((row) => [row.key, row.value]))

/*
 * 추후 Python API 연동 위치
 * - 현재는 예시 데이터 반환
 */
const fetchInitialConditionMock = async (
  _request: LoadConditionRequestType,
): Promise<ConditionRowType[]> => {
  await delay(500)
  return MOCK_INITIAL_CONDITIONS
}

const runSimulationMock = async (
  _request: RunSimulationRequestType,
): Promise<SimulationResultType> => {
  await delay(1800)
  return MOCK_SIMULATION_RESULT
}

export default function SimulationPage() {
  /******************** 변수 영역 ********************/
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [equipment, setEquipment] = useState('Compressor 1')
  const [queryHour, setQueryHour] = useState(24)

  const [isFetchingInitial, setIsFetchingInitial] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  const [conditionRows, setConditionRows] = useState<ConditionRowType[]>(
    MOCK_INITIAL_CONDITIONS,
  )
  const [conditionValues, setConditionValues] = useState<Record<string, number>>(
    () => toValueMap(MOCK_INITIAL_CONDITIONS),
  )

  const [resultData, setResultData] = useState<SimulationResultType | null>(null)

  const showCondition = step >= 2
  const showResult = step === 4 && resultData !== null
  const canRun = step >= 2 && !isFetchingInitial && !isRunning
  const currentResult = resultData ?? MOCK_SIMULATION_RESULT

  /******************** 함수 영역 ********************/
  const handleLoadInitial = async () => {
    if (isFetchingInitial || isRunning) return

    setIsFetchingInitial(true)

    try {
      const rows = await fetchInitialConditionMock({ equipment, queryHour })
      setConditionRows(rows)
      setConditionValues(toValueMap(rows))
      setResultData(null)
      setStep(2)
    } catch (error) {
      console.error(error)
    } finally {
      setIsFetchingInitial(false)
    }
  }

  const handleConditionChange = (key: string, value: number) => {
    setConditionValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleRunSimulation = async () => {
    if (!canRun) return

    setIsRunning(true)
    setStep(3)

    try {
      const simulation = await runSimulationMock({
        equipment,
        queryHour,
        conditions: conditionValues,
      })

      setResultData(simulation)
      setStep(4)
    } catch (error) {
      console.error(error)
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

  const formatValue = (value: number) =>
    Number.isInteger(value) ? String(value) : String(value)

  const isForecastValueRow = (label: string) =>
    label.includes('15분 예측 값') || label.includes('30분 예측 값')

  /******************** 수행 영역 ********************/
  return (
    <div className={mmc.simulation_root}>
      <header className={`${mmc.simulation_pageHead} ${mmc.simulation_stageFadeUp}`}>
        <h1>설비 영향 분석 시뮬레이션</h1>
        <p>실시간 컴프레서 운전 상태 및 30분에 대한 예측 결과를 확인하실 수 있습니다.</p>
      </header>

      <section className={`${mmc.simulation_selectCard} ${mmc.simulation_stageFadeUp}`}>
        <div className={mmc.simulation_selectTitleWrap}>
          <h2>장비 선택/입력</h2>
          <p>설비 영향도 분석 시뮬레이션을 위해 장비 및 조회시간을 선택/입력해주세요.</p>
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
              onChange={(e) => setEquipment(e.target.value)}
            >
              <option>Compressor 1</option>
              <option>Compressor 2</option>
              <option>Compressor 3</option>
            </select>
          </div>

          <div className={`${mmc.simulation_field} ${mmc.simulation_field_time}`}>
            <div className={mmc.simulation_fieldTop}>
              <span className={mmc.simulation_fieldLabel}>조회 시간</span>
              <span className={mmc.simulation_fieldHint}>적절한 조회 시간을 입력</span>
            </div>

            <input
              className={`${mmc.simulation_numberInput} ${mmc.simulation_numberInputSpin}`}
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
            className={mmc.simulation_loadBtn}
            onClick={handleLoadInitial}
            disabled={isFetchingInitial || isRunning}
          >
            {isFetchingInitial ? '불러오는 중...' : '불러오기'}
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
              컴프레서에 대한 운전 조건을 입력하여 최적화 및 시뮬레이션을 진행합니다.
            </p>

            <div className={mmc.simulation_conditionTableHead}>
              <span>속성명</span>
              <span>설정 값</span>
            </div>

            <div className={mmc.simulation_conditionRows}>
              {conditionRows.map((row) => {
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
                          {formatValue(currentValue)}
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
              })}
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

          {showResult && (
            <article
              className={`${mmc.simulation_card} ${mmc.simulation_resultCard} ${mmc.simulation_stageFadeUpDelayed}`}
            >
              <div className={`${mmc.simulation_cardHead} ${mmc.simulation_resultHead}`}>
                <h3>시뮬레이션 결과</h3>
                <p>*15분과 30분 단위의 전력 사용량 예측값에 대해 결과를 제공합니다.</p>
              </div>

              <p className={mmc.simulation_resultIntro}>
                기준값과 대비하여 시뮬레이션 결과에 대해 분석 결과를 종합적으로 제공합니다.
              </p>

              <div className={mmc.simulation_resultLayout}>
                <div className={mmc.simulation_resultLeft}>
                  <div className={mmc.simulation_summaryBox}>
                    <strong className={mmc.simulation_summaryTitle}>*시뮬레이션 요약</strong>
                    <p className={mmc.simulation_summaryText}>
                      {currentResult.summary.line15Prefix}
                      <span className={mmc.simulation_summaryUpText}>
                        {currentResult.summary.line15Value}
                      </span>
                    </p>
                    <p className={mmc.simulation_summaryText}>
                      {currentResult.summary.line30Prefix}
                      <span className={mmc.simulation_summaryDownText}>
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
                          isForecastValueRow(row.label)
                            ? mmc.simulation_resultRowHighlight
                            : ''
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
                          isForecastValueRow(row.label)
                            ? mmc.simulation_resultRowHighlight
                            : ''
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
                    <CommonBarChart bars={currentResult.bars} valueOffsetPx={6} />
                  </div>

                  <div className={mmc.simulation_impactBox}>
                    <h4>입력 변경 영향도 분석</h4>
                    <CommonHorizontalBar items={currentResult.impacts} />
                  </div>
                </div>
              </div>
            </article>
          )}
        </section>
      )}

      <LoadingModal
        open={isRunning}
        message="시뮬레이션 분석을 실행중입니다."
        subMessage="잠시만 기다려주세요."
      />
    </div>
  )
}
