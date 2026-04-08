'use client'

import { useEffect, useMemo, useState } from 'react'
import dmc from './DetailMonitoring.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'
import CommonDetailMonitoringTimeSeriesChart, {
  type DetailMonitoringPointType,
} from '@/app/components/libs/charts/common/common-detail-monitoring-timeseries'

type MetricKeyType =
  | 'instantPower'
  | 'voltage'
  | 'current'
  | 'temperature'
  | 'pressure'
  | 'frequency'
  | 'powerFactor'

type StatusType = 'normal' | 'warning' | 'danger'

type MetricDefinitionType = {
  key: MetricKeyType
  label: string
  unit: string
  base: number
  amplitude: number
  status: StatusType
}

type MetricCardType = {
  key: MetricKeyType
  label: string
  unit: string
  value: number
  deltaPercent: number
  deltaValue: number
  status: StatusType
}

type MetricSeriesType = {
  actual: DetailMonitoringPointType[]
  forecast: DetailMonitoringPointType[]
}

type CompressorDetailType = {
  id: number
  name: string
  peakThreshold: number
  dailyPower: number
  dailyDeltaPercent: number
  dailyDeltaValue: number
  metrics: Record<MetricKeyType, MetricCardType>
  series: Record<MetricKeyType, MetricSeriesType>
}

const DESKTOP_TAB_VISIBLE_COUNT = 7

const ACTUAL_TIME_LABELS = [
  '10:00',
  '10:05',
  '10:10',
  '10:15',
  '10:20',
  '10:25',
  '10:30',
  '10:35',
  '10:40',
  '10:45',
  '10:50',
  '10:55',
]

const FORECAST_TIME_LABELS = ['11:00', '11:05', '11:10', '11:15', '11:20', '11:25', '11:30', '11:35']

const METRIC_DEFINITIONS: MetricDefinitionType[] = [
  { key: 'instantPower', label: '순시 전력량', unit: 'kW', base: 537.34, amplitude: 12.8, status: 'normal' },
  { key: 'voltage', label: '전압', unit: 'Volt', base: 220.348, amplitude: 2.9, status: 'danger' },
  { key: 'current', label: '전류', unit: 'Ampere', base: 5.348, amplitude: 0.42, status: 'normal' },
  { key: 'temperature', label: '온도', unit: '℃', base: 18.324, amplitude: 1.28, status: 'normal' },
  { key: 'pressure', label: '압력', unit: 'Bar', base: 14.348, amplitude: 0.72, status: 'warning' },
  { key: 'frequency', label: '주파수', unit: 'Hz', base: 100.348, amplitude: 2.18, status: 'danger' },
  { key: 'powerFactor', label: '역률', unit: 'Factor', base: 0.948, amplitude: 0.034, status: 'normal' },
]

const METRIC_GRID_KEYS: MetricKeyType[] = ['voltage', 'current', 'temperature', 'pressure', 'frequency', 'powerFactor']

const STATUS_LABEL_MAP: Record<StatusType, string> = {
  normal: '정상',
  warning: '경고',
  danger: '이상',
}

const round = (value: number, digits: number) => {
  const base = 10 ** digits
  return Math.round(value * base) / base
}

const formatMetricValue = (metric: MetricCardType) => {
  if (metric.key === 'instantPower') return metric.value.toFixed(2)
  if (metric.key === 'powerFactor') return metric.value.toFixed(3)
  return metric.value.toFixed(3)
}

const formatSignedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
const formatSignedValue = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(3)}`

const createSeries = (
  baseValue: number,
  amplitude: number,
  seed: number,
  digits: number,
): MetricSeriesType => {
  const actual = ACTUAL_TIME_LABELS.map((time, index) => {
    const wave =
      Math.sin((index + 1 + seed) * 0.88) * amplitude +
      Math.cos((index + 2 + seed) * 0.42) * amplitude * 0.32

    return { time, value: round(baseValue + wave, digits) }
  })

  const baseline = actual[actual.length - 1]?.value ?? baseValue

  const forecast = FORECAST_TIME_LABELS.map((time, index) => {
    const wave = Math.sin((index + 2 + seed) * 0.74) * amplitude * 0.62 + (index - 3) * amplitude * 0.06
    return { time, value: round(baseline + wave, digits) }
  })

  return { actual, forecast }
}

const createCompressorDetail = (id: number): CompressorDetailType => {
  const compressorOffset = (id - 4) * 0.022
  const metrics = {} as Record<MetricKeyType, MetricCardType>
  const series = {} as Record<MetricKeyType, MetricSeriesType>

  METRIC_DEFINITIONS.forEach((definition, index) => {
    const digits = definition.key === 'instantPower' ? 2 : 3
    const adjustedBase = definition.base * (1 + compressorOffset * (index % 2 === 0 ? 1 : 0.7))
    const adjustedValue = adjustedBase + Math.sin((id + index) * 0.68) * definition.amplitude * 0.22

    const deltaPercentByStatus: Record<StatusType, number> = {
      normal: 20,
      warning: 7,
      danger: -12,
    }

    const deltaValueByStatus: Record<StatusType, number> = {
      normal: 12.347 + id * 0.11,
      warning: 3.125 + id * 0.07,
      danger: -(8.247 + id * 0.09),
    }

    metrics[definition.key] = {
      key: definition.key,
      label: definition.label,
      unit: definition.unit,
      value: round(adjustedValue, digits),
      deltaPercent: deltaPercentByStatus[definition.status],
      deltaValue: round(deltaValueByStatus[definition.status], 3),
      status: definition.status,
    }

    series[definition.key] = createSeries(round(adjustedBase, digits), definition.amplitude, id + index, digits)
  })

  const dailyPower = round(metrics.instantPower.value * (0.97 + id * 0.013), 2)

  return {
    id,
    name: `Compressor ${id}`,
    peakThreshold: round(metrics.instantPower.value * 1.02, 1),
    dailyPower,
    dailyDeltaPercent: 20,
    dailyDeltaValue: round(12.347 + id * 0.17, 3),
    metrics,
    series,
  }
}

const COMPRESSOR_DETAILS: CompressorDetailType[] = Array.from({ length: 10 }, (_, idx) =>
  createCompressorDetail(idx + 1),
)

const getStatusClassName = (status: StatusType, css: typeof dmc) => {
  if (status === 'normal') return css.detail_statusDotNormal
  if (status === 'warning') return css.detail_statusDotWarning
  return css.detail_statusDotDanger
}

const getDeltaBadgeClassName = (value: number, css: typeof dmc) =>
  value >= 0 ? css.detail_deltaBadgePositive : css.detail_deltaBadgeNegative

const getDeltaValueClassName = (value: number, css: typeof dmc) =>
  value >= 0 ? css.detail_deltaValuePositive : css.detail_deltaValueNegative

export default function DetailMonitoringPage() {
  const [selectedCompressorId, setSelectedCompressorId] = useState(2)
  const [selectedMetricKey, setSelectedMetricKey] = useState<MetricKeyType>('voltage')
  const [isDesktopCarousel, setIsDesktopCarousel] = useState(false)
  const [tabStartIndex, setTabStartIndex] = useState(0)

  const selectedCompressor = useMemo(
    () => COMPRESSOR_DETAILS.find((compressor) => compressor.id === selectedCompressorId) ?? COMPRESSOR_DETAILS[0],
    [selectedCompressorId],
  )

  const [peakThreshold, setPeakThreshold] = useState<number>(selectedCompressor.peakThreshold)

  useEffect(() => {
    setPeakThreshold(selectedCompressor.peakThreshold)
  }, [selectedCompressor])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1281px)')
    const apply = () => setIsDesktopCarousel(mediaQuery.matches)
    apply()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', apply)
      return () => mediaQuery.removeEventListener('change', apply)
    }

    mediaQuery.addListener(apply)
    return () => mediaQuery.removeListener(apply)
  }, [])

  const shouldUseTabCarousel =
    isDesktopCarousel && COMPRESSOR_DETAILS.length > DESKTOP_TAB_VISIBLE_COUNT

  const visibleCompressors = shouldUseTabCarousel
    ? COMPRESSOR_DETAILS.slice(tabStartIndex, tabStartIndex + DESKTOP_TAB_VISIBLE_COUNT)
    : COMPRESSOR_DETAILS

  const selectedCompressorIndex = COMPRESSOR_DETAILS.findIndex(
    (item) => item.id === selectedCompressorId,
  )

  const canMovePrevTabs = selectedCompressorIndex > 0
  const canMoveNextTabs =
    selectedCompressorIndex >= 0 && selectedCompressorIndex < COMPRESSOR_DETAILS.length - 1

  const handleMovePrevTabs = () => {
    if (!canMovePrevTabs) return
    const prev = COMPRESSOR_DETAILS[selectedCompressorIndex - 1]
    if (prev) setSelectedCompressorId(prev.id)
  }

  const handleMoveNextTabs = () => {
    if (!canMoveNextTabs) return
    const next = COMPRESSOR_DETAILS[selectedCompressorIndex + 1]
    if (next) setSelectedCompressorId(next.id)
  }

  useEffect(() => {
    if (!shouldUseTabCarousel) {
      setTabStartIndex(0)
      return
    }

    const selectedIndex = COMPRESSOR_DETAILS.findIndex((item) => item.id === selectedCompressorId)
    if (selectedIndex < 0) return

    if (selectedIndex < tabStartIndex) {
      setTabStartIndex(selectedIndex)
      return
    }

    if (selectedIndex >= tabStartIndex + DESKTOP_TAB_VISIBLE_COUNT) {
      setTabStartIndex(selectedIndex - DESKTOP_TAB_VISIBLE_COUNT + 1)
    }
  }, [selectedCompressorId, shouldUseTabCarousel, tabStartIndex])

  const selectedMetric = selectedCompressor.metrics[selectedMetricKey]
  const activeSeries = selectedCompressor.series[selectedMetricKey]
  const instantPowerMetric = selectedCompressor.metrics.instantPower

  const chartDescription = '시간에 따른 데이터가 나타나며, AI가 30분 뒤의 예측 결과를 제공합니다.'

  return (
    <div className={dmc.detail_root}>
      <header className={dmc.detail_pageHead}>
        <h1>컴프레서 상태 모니터링</h1>
        <p>실시간 컴프레서 운전 상태 및 30분에 대한 예측 결과를 확인하실 수 있습니다.</p>
      </header>

      <section className={dmc.detail_shell}>
        <div
          className={`${dmc.detail_tabsCarousel} ${
            !shouldUseTabCarousel ? dmc.detail_tabsCarouselNoArrows : ''
          }`}
        >
          {shouldUseTabCarousel && (
            <button
              type="button"
              className={dmc.detail_tabsArrow}
              onClick={handleMovePrevTabs}
              disabled={!canMovePrevTabs}
              aria-label="이전 컴프레서"
            >
              {'<'}
            </button>
          )}

          <div className={dmc.detail_tabsViewport}>
            <div className={dmc.detail_tabsRow}>
              {visibleCompressors.map((compressor) => {
                const isActive = compressor.id === selectedCompressorId

                return (
                  <button
                    key={compressor.id}
                    type="button"
                    className={`${dmc.detail_tabBtn} ${isActive ? dmc.detail_tabBtnActive : ''}`}
                    onClick={() => setSelectedCompressorId(compressor.id)}
                  >
                    <i className={`${imag.compressor_circle_blue_small_icon} ${dmc.detail_tabIcon}`} />
                    <span>{compressor.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {shouldUseTabCarousel && (
            <button
              type="button"
              className={dmc.detail_tabsArrow}
              onClick={handleMoveNextTabs}
              disabled={!canMoveNextTabs}
              aria-label="다음 컴프레서"
            >
              {'>'}
            </button>
          )}
        </div>

        <div className={dmc.detail_dashboard}>
          <article className={dmc.detail_intro}>
            <div className={dmc.detail_introTitleWrap}>
              <h2>컴프레서 상태</h2>
              <p>컴프레서 상태에 대한 실시간 모니터링 값과 AI 예측 결과를 제공합니다.</p>
            </div>

            <div className={dmc.detail_statusLegend}>
              {(['normal', 'warning', 'danger'] as StatusType[]).map((status) => (
                <div key={status} className={dmc.detail_statusItem}>
                  <span className={`${dmc.detail_statusDot} ${getStatusClassName(status, dmc)}`} />
                  <span>{STATUS_LABEL_MAP[status]}</span>
                </div>
              ))}
            </div>
          </article>

          <div className={dmc.detail_kpiRow}>
            <div className={`${dmc.detail_kpiCard} ${dmc.detail_peakSettingCard}`}>
              <h3>순시 전력량 피크값 설정</h3>
              <input
                type="number"
                className={dmc.detail_peakInput}
                value={peakThreshold}
                step={0.1}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  if (Number.isNaN(next)) {
                    setPeakThreshold(0)
                    return
                  }
                  setPeakThreshold(Math.max(0, round(next, 1)))
                }}
              />
            </div>

            <button
              type="button"
              className={`${dmc.detail_kpiCard} ${dmc.detail_selectableKpiCard} ${
                selectedMetricKey === 'instantPower' ? dmc.detail_selectableActive : ''
              }`}
              onClick={() => setSelectedMetricKey('instantPower')}
            >
              <p className={dmc.detail_kpiTitle}>순시 전력량(kW)</p>
              <div className={dmc.detail_kpiValueRow}>
                <strong className={dmc.detail_kpiValue}>{instantPowerMetric.value.toFixed(2)}</strong>
                <span
                  className={`${dmc.detail_deltaBadge} ${getDeltaBadgeClassName(
                    instantPowerMetric.deltaPercent,
                    dmc,
                  )}`}
                >
                  {formatSignedPercent(instantPowerMetric.deltaPercent)}
                </span>
                <span
                  className={`${dmc.detail_deltaText} ${getDeltaValueClassName(
                    instantPowerMetric.deltaValue,
                    dmc,
                  )}`}
                >
                  {formatSignedValue(instantPowerMetric.deltaValue)}
                </span>
              </div>
            </button>

            <div className={dmc.detail_kpiCard}>
              <p className={dmc.detail_kpiTitle}>일 누적 전력량(kW)</p>
              <div className={dmc.detail_kpiValueRow}>
                <strong className={dmc.detail_kpiValue}>{selectedCompressor.dailyPower.toFixed(2)}</strong>
                <span className={`${dmc.detail_deltaBadge} ${dmc.detail_deltaBadgePositive}`}>
                  {formatSignedPercent(selectedCompressor.dailyDeltaPercent)}
                </span>
                <span className={`${dmc.detail_deltaText} ${dmc.detail_deltaValuePositive}`}>
                  {formatSignedValue(selectedCompressor.dailyDeltaValue)}
                </span>
              </div>
            </div>
          </div>

          <div className={dmc.detail_metricGrid}>
            {METRIC_GRID_KEYS.map((metricKey) => {
              const metric = selectedCompressor.metrics[metricKey]
              const isActive = selectedMetricKey === metricKey

              return (
                <button
                  key={metric.key}
                  type="button"
                  className={`${dmc.detail_metricCard} ${isActive ? dmc.detail_metricCardActive : ''}`}
                  onClick={() => setSelectedMetricKey(metric.key)}
                >
                  <div className={dmc.detail_metricHead}>
                    <strong className={dmc.detail_metricTitle}>{metric.label}</strong>
                    <span className={dmc.detail_metricUnit}>({metric.unit})</span>
                  </div>

                  <div className={dmc.detail_metricValueRow}>
                    <strong className={dmc.detail_metricValue}>{formatMetricValue(metric)}</strong>
                    <span className={`${dmc.detail_statusDot} ${getStatusClassName(metric.status, dmc)}`} />
                  </div>

                  <div className={dmc.detail_kpiValueRow}>
                    <span
                      className={`${dmc.detail_deltaBadge} ${getDeltaBadgeClassName(metric.deltaPercent, dmc)}`}
                    >
                      {formatSignedPercent(metric.deltaPercent)}
                    </span>
                    <span
                      className={`${dmc.detail_deltaText} ${getDeltaValueClassName(metric.deltaValue, dmc)}`}
                    >
                      {formatSignedValue(metric.deltaValue)}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <article className={dmc.detail_chartPanel}>
            <div className={dmc.detail_chartHead}>
              <h3 className={dmc.detail_chartTitle}>
                {selectedMetric.label}({selectedMetric.unit})
              </h3>
              <p className={dmc.detail_chartDescription}>
                <span
                  className={`${dmc.detail_statusDot} ${dmc.detail_statusDotSmall} ${getStatusClassName(
                    selectedMetric.status,
                    dmc,
                  )}`}
                />
                {chartDescription}
              </p>
            </div>

            <div className={dmc.detail_chartBody}>
              <div
                key={`${selectedCompressorId}-${selectedMetricKey}`}
                className={dmc.detail_chartBodyAnimated}
              >
                <CommonDetailMonitoringTimeSeriesChart
                  unitLabel={selectedMetric.unit}
                  actualData={activeSeries.actual}
                  forecastData={activeSeries.forecast}
                  showPeakLine={selectedMetricKey === 'instantPower'}
                  peakValue={selectedMetricKey === 'instantPower' ? peakThreshold : undefined}
                />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
