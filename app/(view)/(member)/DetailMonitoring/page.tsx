'use client'

import { useEffect, useMemo, useState } from 'react'
import dmc from './DetailMonitoring.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'
import CommonDetailMonitoringTimeSeriesChart, {
  type DetailMonitoringPointType,
} from '@/app/components/libs/charts/common/common-detail-monitoring-timeseries'
import { withAppPrefix } from '@/config/environment'

type MetricKeyType =
  | 'instantPower'
  | 'voltage'
  | 'current'
  | 'temperature'
  | 'pressure'
  | 'frequency'
  | 'powerFactor'

type StatusType = 'normal' | 'warning' | 'danger'

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

type DashboardDeviceDataType = {
  peakThreshold: number
  dailyPower: number
  dailyDeltaPercent: number
  dailyDeltaValue: number
  metrics: Record<MetricKeyType, MetricCardType>
  series: Record<MetricKeyType, MetricSeriesType>
}

type CompressorTabType = {
  id: number
  deviceId: string
  name: string
}

type DeviceItemType = {
  deviceId: string
  deviceName: string
}

type GetDevicesResponseType = {
  success: boolean
  data: DeviceItemType[]
  message?: string
}

type DashboardRowType = {
  CURVOLTAGE?: number
  PRESSURE?: number
  TEMPERATURE?: number
  HZ?: number
  AVGCURRENT?: number
  AVGVOLTAGE?: number
  FACTOR?: number
}

type DashboardApiResponseType = {
  device_id: string
  timestamp: string
  daily_energy_wh: number
  history_by_time: Record<string, DashboardRowType>
  message?: string
}

const LOOKBACK_HOURS = 24
const DESKTOP_TAB_VISIBLE_COUNT = 7

const METRIC_GRID_KEYS: MetricKeyType[] = ['voltage', 'current', 'temperature', 'pressure', 'frequency', 'powerFactor']

const METRIC_META: Record<
  MetricKeyType,
  { label: string; unit: string; source: keyof DashboardRowType; status: StatusType; digits: number }
> = {
  instantPower: { label: '순시 전력량', unit: 'kW', source: 'CURVOLTAGE', status: 'normal', digits: 2 },
  voltage: { label: '전압', unit: 'Volt', source: 'AVGVOLTAGE', status: 'danger', digits: 3 },
  current: { label: '전류', unit: 'Ampere', source: 'AVGCURRENT', status: 'normal', digits: 3 },
  temperature: { label: '온도', unit: '℃', source: 'TEMPERATURE', status: 'normal', digits: 3 },
  pressure: { label: '압력', unit: 'Bar', source: 'PRESSURE', status: 'warning', digits: 3 },
  frequency: { label: '주파수', unit: 'Hz', source: 'HZ', status: 'danger', digits: 3 },
  powerFactor: { label: '역률', unit: 'Factor', source: 'FACTOR', status: 'normal', digits: 3 },
}

const STATUS_LABEL_MAP: Record<StatusType, string> = {
  normal: '정상',
  warning: '경고',
  danger: '이상',
}

const round = (value: number, digits: number) => {
  const base = 10 ** digits
  return Math.round(value * base) / base
}

const safeNum = (value: unknown, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const formatNumber = (value: number, digits: number) =>
  value.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

const formatMetricValue = (metric: MetricCardType) => {
  if (metric.key === 'instantPower') return formatNumber(metric.value, 2) // 순시전력량
  if (metric.key === 'powerFactor') return formatNumber(metric.value, 3)
  return formatNumber(metric.value, 3)
}

const formatSignedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`
const formatSignedValue = (value: number) => `${value > 0 ? '+' : ''}${formatNumber(value, 3)}`

const formatTimeLabel = (iso: string) => {
  const matched = String(iso).match(/T(\d{2}:\d{2})/)
  if (matched?.[1]) return matched[1]

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
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

const splitHistory = (entries: Array<[string, DashboardRowType]>) => {
  if (entries.length >= 3) {
    return {
      actualEntries: entries.slice(0, -2),
      forecastEntries: entries.slice(-2),
      currentEntry: entries[entries.length - 3],
      prevEntry: entries[Math.max(entries.length - 4, 0)],
    }
  }

  if (entries.length === 2) {
    return {
      actualEntries: entries.slice(0, 1),
      forecastEntries: entries.slice(1),
      currentEntry: entries[0],
      prevEntry: entries[0],
    }
  }

  return {
    actualEntries: entries,
    forecastEntries: [] as Array<[string, DashboardRowType]>,
    currentEntry: entries[0],
    prevEntry: entries[0],
  }
}

const buildDashboardData = (response: DashboardApiResponseType): DashboardDeviceDataType => {
  const history = response.history_by_time ?? {}
  const sortedEntries = Object.entries(history).sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
  )

  if (!sortedEntries.length) {
    const emptyMetrics = {} as Record<MetricKeyType, MetricCardType>
    const emptySeries = {} as Record<MetricKeyType, MetricSeriesType>

    ;(Object.keys(METRIC_META) as MetricKeyType[]).forEach((key) => {
      const meta = METRIC_META[key]
      emptyMetrics[key] = {
        key,
        label: meta.label,
        unit: meta.unit,
        value: 0,
        deltaPercent: 0,
        deltaValue: 0,
        status: meta.status,
      }
      emptySeries[key] = { actual: [], forecast: [] }
    })

    return {
      peakThreshold: 0,
      dailyPower: round(safeNum(response.daily_energy_wh, 0), 2),
      dailyDeltaPercent: 0,
      dailyDeltaValue: 0,
      metrics: emptyMetrics,
      series: emptySeries,
    }
  }

  const { actualEntries, forecastEntries, currentEntry, prevEntry } = splitHistory(sortedEntries)
  const currentSnapshot = currentEntry?.[1] ?? {}
  const prevSnapshot = prevEntry?.[1] ?? currentSnapshot

  const metrics = {} as Record<MetricKeyType, MetricCardType>
  const series = {} as Record<MetricKeyType, MetricSeriesType>

  ;(Object.keys(METRIC_META) as MetricKeyType[]).forEach((key) => {
    const meta = METRIC_META[key]
    const currentValueRaw = safeNum(currentSnapshot?.[meta.source], 0)
    const prevValueRaw = safeNum(prevSnapshot?.[meta.source], currentValueRaw)

    const currentValue = round(currentValueRaw, meta.digits)
    const deltaValue = round(currentValueRaw - prevValueRaw, 3)
    const deltaPercent =
      prevValueRaw !== 0 ? round(((currentValueRaw - prevValueRaw) / Math.abs(prevValueRaw)) * 100, 0) : 0

    metrics[key] = {
      key,
      label: meta.label,
      unit: meta.unit,
      value: currentValue,
      deltaPercent,
      deltaValue,
      status: meta.status,
    }

    series[key] = {
      actual: actualEntries.map(([time, row]) => ({
        time: formatTimeLabel(time),
        value: round(safeNum(row?.[meta.source], 0), meta.digits),
      })),
      forecast: forecastEntries.map(([time, row]) => ({
        time: formatTimeLabel(time),
        value: round(safeNum(row?.[meta.source], 0), meta.digits),
      })),
    }
  })

  const instant = metrics.instantPower
  return {
    peakThreshold: round(Math.max(0, instant.value * 1.02), 1),
    dailyPower: round(safeNum(response.daily_energy_wh, 0), 2),
    dailyDeltaPercent: instant.deltaPercent,
    dailyDeltaValue: instant.deltaValue,
    metrics,
    series,
  }
}

const getNextRefreshDelayMs = (now: Date) => {
  const schedule = [
    { minute: 0, second: 10 },
    { minute: 15, second: 10 },
    { minute: 30, second: 10 },
    { minute: 45, second: 10 },
  ]

  const nowTime = now.getTime()

  for (let hourOffset = 0; hourOffset <= 1; hourOffset += 1) {
    for (const point of schedule) {
      const candidate = new Date(now)
      candidate.setMilliseconds(0)
      candidate.setMinutes(point.minute)
      candidate.setSeconds(point.second)
      if (hourOffset === 1) {
        candidate.setHours(candidate.getHours() + 1)
      }

      if (candidate.getTime() > nowTime + 150) {
        return candidate.getTime() - nowTime
      }
    }
  }

  return 60_000
}

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
  const [selectedCompressorId, setSelectedCompressorId] = useState(0)
  const [selectedMetricKey, setSelectedMetricKey] = useState<MetricKeyType>('voltage')
  const [isDesktopCarousel, setIsDesktopCarousel] = useState(false)
  const [tabStartIndex, setTabStartIndex] = useState(0)

  const [tabs, setTabs] = useState<CompressorTabType[]>([])
  const [isTabsLoading, setIsTabsLoading] = useState(true)
  const [tabsError, setTabsError] = useState<string | null>(null)

  const [dashboardMap, setDashboardMap] = useState<Record<string, DashboardDeviceDataType>>({})
  const [isDashboardLoading, setIsDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const [peakThresholdByDevice, setPeakThresholdByDevice] = useState<Record<string, number>>({})

  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.id === selectedCompressorId) ?? tabs[0] ?? null,
    [tabs, selectedCompressorId],
  )

  const selectedDashboard = selectedTab ? dashboardMap[selectedTab.deviceId] : null

  const selectedPeakThreshold = selectedTab
    ? peakThresholdByDevice[selectedTab.deviceId] ?? selectedDashboard?.peakThreshold ?? 0
    : 0

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

  useEffect(() => {
    let disposed = false

    const loadTabs = async () => {
      setIsTabsLoading(true)
      setTabsError(null)

      try {
        const customerId = getCustomerIdFromSession()
        if (!customerId) {
          throw new Error('로그인 정보에서 customer_id를 확인할 수 없습니다.')
        }

        const response = await fetch(
          withAppPrefix(`/api/member/getDevices?customerId=${encodeURIComponent(customerId)}`),
          { method: 'GET' },
        )

        const json = (await response.json().catch(() => null)) as GetDevicesResponseType | null

        if (!response.ok || !json?.success) {
          throw new Error(json?.message ?? '연결된 장비를 불러오지 못했습니다.')
        }

        const list = Array.isArray(json.data) ? json.data : []
        const nextTabs = list.map((device, idx) => ({
          id: idx + 1,
          deviceId: device.deviceId,
          name: device.deviceName,
        }))

        if (!disposed) {
          setTabs(nextTabs)
          setSelectedCompressorId((prev) => {
            if (nextTabs.some((t) => t.id === prev)) return prev
            return nextTabs[0]?.id ?? 0
          })
          setTabStartIndex(0)
        }
      } catch (error: any) {
        if (!disposed) {
          setTabs([])
          setSelectedCompressorId(0)
          setTabsError(error?.message ?? '장비 목록 조회 중 오류가 발생했습니다.')
        }
      } finally {
        if (!disposed) {
          setIsTabsLoading(false)
        }
      }
    }

    loadTabs()
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (!selectedTab) return

    let disposed = false
    let refreshTimer: ReturnType<typeof setTimeout> | null = null

    const clearTimer = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }

    const scheduleNext = () => {
      clearTimer()
      const delay = getNextRefreshDelayMs(new Date())
      refreshTimer = setTimeout(() => {
        void fetchDashboard(false)
      }, delay)
    }

    const fetchDashboard = async (initial: boolean) => {
      if (disposed) return

      if (initial) {
        setIsDashboardLoading(true)
      }
      setDashboardError(null)

      try {
        const response = await fetch(
          withAppPrefix(
            `/api/monitor/dashboard/${encodeURIComponent(selectedTab.deviceId)}?lookback_hours=${LOOKBACK_HOURS}`,
          ),
          { method: 'GET' },
        )

        const json = (await response.json().catch(() => null)) as DashboardApiResponseType | null

        if (!response.ok || !json) {
          throw new Error(
            (json as any)?.message ?? `모니터링 데이터를 불러오지 못했습니다. (HTTP ${response.status})`,
          )
        }

        const built = buildDashboardData(json)

        if (!disposed) {
          setDashboardMap((prev) => ({ ...prev, [selectedTab.deviceId]: built }))
          setPeakThresholdByDevice((prev) => {
            if (typeof prev[selectedTab.deviceId] === 'number') return prev
            return { ...prev, [selectedTab.deviceId]: built.peakThreshold }
          })
        }
      } catch (error: any) {
        if (!disposed) {
          setDashboardError(error?.message ?? '모니터링 조회 중 오류가 발생했습니다.')
        }
      } finally {
        if (!disposed) {
          setIsDashboardLoading(false)
          scheduleNext()
        }
      }
    }

    void fetchDashboard(true)

    return () => {
      disposed = true
      clearTimer()
    }
  }, [selectedTab?.deviceId])

  const shouldUseTabCarousel =
    isDesktopCarousel && tabs.length > DESKTOP_TAB_VISIBLE_COUNT

  const visibleTabs = shouldUseTabCarousel
    ? tabs.slice(tabStartIndex, tabStartIndex + DESKTOP_TAB_VISIBLE_COUNT)
    : tabs

  const selectedTabIndex = tabs.findIndex((item) => item.id === selectedCompressorId)

  const canMovePrevTabs = selectedTabIndex > 0
  const canMoveNextTabs = selectedTabIndex >= 0 && selectedTabIndex < tabs.length - 1

  const handleMovePrevTabs = () => {
    if (!canMovePrevTabs) return
    const prev = tabs[selectedTabIndex - 1]
    if (prev) setSelectedCompressorId(prev.id)
  }

  const handleMoveNextTabs = () => {
    if (!canMoveNextTabs) return
    const next = tabs[selectedTabIndex + 1]
    if (next) setSelectedCompressorId(next.id)
  }

  useEffect(() => {
    if (!shouldUseTabCarousel) {
      setTabStartIndex(0)
      return
    }

    const selectedIndex = tabs.findIndex((item) => item.id === selectedCompressorId)
    if (selectedIndex < 0) return

    if (selectedIndex < tabStartIndex) {
      setTabStartIndex(selectedIndex)
      return
    }

    if (selectedIndex >= tabStartIndex + DESKTOP_TAB_VISIBLE_COUNT) {
      setTabStartIndex(selectedIndex - DESKTOP_TAB_VISIBLE_COUNT + 1)
    }
  }, [selectedCompressorId, shouldUseTabCarousel, tabStartIndex, tabs])

  const selectedMetric = selectedDashboard ? selectedDashboard.metrics[selectedMetricKey] : null
  const activeSeries = selectedDashboard ? selectedDashboard.series[selectedMetricKey] : null
  const instantPowerMetric = selectedDashboard ? selectedDashboard.metrics.instantPower : null

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
              {isTabsLoading && (
                <button type="button" className={dmc.detail_tabBtn} disabled>
                  <span>장비 목록을 불러오는 중...</span>
                </button>
              )}

              {!isTabsLoading &&
                visibleTabs.map((tab) => {
                  const isActive = tab.id === selectedCompressorId

                  return (
                    <button
                      key={tab.deviceId}
                      type="button"
                      className={`${dmc.detail_tabBtn} ${isActive ? dmc.detail_tabBtnActive : ''}`}
                      onClick={() => setSelectedCompressorId(tab.id)}
                    >
                      <i className={`${imag.compressor_circle_blue_small_icon} ${dmc.detail_tabIcon}`} />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}

              {!isTabsLoading && !visibleTabs.length && (
                <button type="button" className={dmc.detail_tabBtn} disabled>
                  <span>연결된 장비가 없습니다.</span>
                </button>
              )}
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

        {tabsError ? (
          <div style={{ color: '#d14343', fontSize: '13px', fontWeight: 700, padding: '6px 4px 0' }}>
            {tabsError}
          </div>
        ) : null}

        {dashboardError ? (
          <div style={{ color: '#d14343', fontSize: '13px', fontWeight: 700, padding: '6px 4px 0' }}>
            {dashboardError}
          </div>
        ) : null}

        {isDashboardLoading && !selectedDashboard ? (
          <div
            style={{
              width: '100%',
              padding: '24px 20px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.78)',
              color: '#5c6f87',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            모니터링 데이터를 불러오는 중입니다.
          </div>
        ) : null}

        {!selectedTab || !selectedDashboard || !selectedMetric || !activeSeries || !instantPowerMetric ? null : (
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
                  value={selectedPeakThreshold}
                  step={0.1}
                  onChange={(event) => {
                    if (!selectedTab) return
                    const next = Number(event.target.value)
                    const value = Number.isNaN(next) ? 0 : Math.max(0, round(next, 1))
                    setPeakThresholdByDevice((prev) => ({
                      ...prev,
                      [selectedTab.deviceId]: value,
                    }))
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
                  <strong className={dmc.detail_kpiValue}>{formatMetricValue(instantPowerMetric)}</strong>
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
                  <strong className={dmc.detail_kpiValue}>{formatNumber(selectedDashboard.dailyPower, 2)}</strong>
                  <span className={`${dmc.detail_deltaBadge} ${dmc.detail_deltaBadgePositive}`}>
                    {formatSignedPercent(selectedDashboard.dailyDeltaPercent)}
                  </span>
                  <span className={`${dmc.detail_deltaText} ${dmc.detail_deltaValuePositive}`}>
                    {formatSignedValue(selectedDashboard.dailyDeltaValue)}
                  </span>
                </div>
              </div>
            </div>

            <div className={dmc.detail_metricGrid}>
              {METRIC_GRID_KEYS.map((metricKey) => {
                const metric = selectedDashboard.metrics[metricKey]
                const isActive = selectedMetricKey === metricKey

                return (
                  <button
                    key={`${selectedTab.deviceId}-${metric.key}`}
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
                <div key={`${selectedTab.id}-${selectedMetricKey}`} className={dmc.detail_chartBodyAnimated}>
                  <CommonDetailMonitoringTimeSeriesChart
                    unitLabel={selectedMetric.unit}
                    actualData={activeSeries.actual}
                    forecastData={activeSeries.forecast}
                    showPeakLine={selectedMetricKey === 'instantPower'}
                    peakValue={selectedMetricKey === 'instantPower' ? selectedPeakThreshold : undefined}
                  />
                </div>
              </div>
            </article>
          </div>
        )}
      </section>
    </div>
  )
}
