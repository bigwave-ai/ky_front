'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dmc from './DetailMonitoring.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'
import CommonDetailMonitoringTimeSeriesChart, {
  type DetailMonitoringPointType,
} from '@/app/components/libs/charts/common/common-detail-monitoring-timeseries'
import { withAppPrefix } from '@/config/environment'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분  : 사용자권한 - 상세 모니터링 및 AI 예측
 * 03. 설명     : 장비 목록 조회, 장비 상태 카드 표시, 실제/예측 시계열 차트 표시
 * 04. 작성일자  : 2026.04.20
 * 05. 작성자   : 이우창
 */

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

type AdminCustomerOptionType = {
  id: string
  name: string
}

type GetCustomersResponseType = {
  success: boolean
  data: AdminCustomerOptionType[]
  message?: string
}

type SessionUserInfoType = {
  customerId: string
  role: string
  isAdmin: boolean
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

/******************** 변수 영역 ********************/
const LOOKBACK_HOURS = 24 // 대시보드 조회 시간(고정)
const DESKTOP_TAB_VISIBLE_COUNT = 7 // 데스크톱 캐러셀에서 한 번에 보여줄 탭 수

const METRIC_GRID_KEYS: MetricKeyType[] = ['voltage', 'current', 'temperature', 'pressure', 'frequency', 'powerFactor'] // 좌측 카드 그리드 표시 순서

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
} // 카드/차트 메타 정보

const STATUS_LABEL_MAP: Record<StatusType, string> = {
  normal: '정상',
  warning: '경고',
  danger: '이상',
} // 상태 텍스트 매핑

/******************** 함수 영역 ********************/
// 소수점 자릿수 반올림 함수
const round = (value: number, digits: number) => {
  const base = 10 ** digits // 자리수 보정값
  return Math.round(value * base) / base
}

// 숫자 변환 안전 함수(유효하지 않으면 fallback)
const safeNum = (value: unknown, fallback = 0) => {
  const n = Number(value) // 숫자 변환값
  return Number.isFinite(n) ? n : fallback
}

// 천 단위/소수점 표시 함수
const formatNumber = (value: number, digits: number) =>
  value.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

// 카드별 표시 포맷 함수
const formatMetricValue = (metric: MetricCardType) => {
  if (metric.key === 'instantPower') return formatNumber(metric.value, 2) // 순시전력량은 소수점 2자리
  if (metric.key === 'powerFactor') return formatNumber(metric.value, 3) // 역률은 소수점 3자리
  return formatNumber(metric.value, 3) // 기본 소수점 3자리
}

// 부호 포함 퍼센트 포맷 함수
const formatSignedPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(0)}%`

// 부호 포함 값 포맷 함수
const formatSignedValue = (value: number) => `${value > 0 ? '+' : ''}${formatNumber(value, 3)}`

// ISO 시간 문자열을 HH:mm 형태 라벨로 변환
const formatTimeLabel = (iso: string) => {
  const matched = String(iso).match(/T(\d{2}:\d{2})/) // 우선 정규식으로 시:분 추출
  if (matched?.[1]) return matched[1]

  const date = new Date(iso) // 실패 시 Date 파싱
  if (Number.isNaN(date.getTime())) return iso
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

// localStorage 세션 정보에서 customer_id/role 추출
const getSessionUserInfo = (): SessionUserInfoType => {
  if (typeof window === 'undefined') {
    return { customerId: '', role: '', isAdmin: false }
  }

  const raw = localStorage.getItem('session.userInfo')
  if (!raw) {
    return { customerId: '', role: '', isAdmin: false }
  }

  try {
    const parsed = JSON.parse(raw) as {
      customer_id?: string
      customerId?: string
      role?: string
      customer_auth?: string
      auth?: string
    }

    const customerId = String(parsed.customer_id ?? parsed.customerId ?? '').trim()
    const roleRaw = String(parsed.role ?? parsed.customer_auth ?? parsed.auth ?? '')
      .trim()
      .toLowerCase()

    const isAdmin =
      roleRaw === 'admin' ||
      roleRaw.includes('admin') ||
      roleRaw.includes('관리')

    return { customerId, role: roleRaw, isAdmin }
  } catch {
    return { customerId: '', role: '', isAdmin: false }
  }
}

// 히스토리 데이터를 실제값/예측값/현재값/이전값으로 분리
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

// 대시보드 API 응답을 화면용 데이터 구조로 변환
const buildDashboardData = (response: DashboardApiResponseType): DashboardDeviceDataType => {
  const history = response.history_by_time ?? {} // 시계열 원본
  const sortedEntries = Object.entries(history).sort(
    (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
  ) // 시간 오름차순 정렬

  if (!sortedEntries.length) {
    const emptyMetrics = {} as Record<MetricKeyType, MetricCardType> // 빈 메트릭
    const emptySeries = {} as Record<MetricKeyType, MetricSeriesType> // 빈 시리즈

    ;(Object.keys(METRIC_META) as MetricKeyType[]).forEach((key) => {
      const meta = METRIC_META[key] // 메트릭 메타
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

  const { actualEntries, forecastEntries, currentEntry, prevEntry } = splitHistory(sortedEntries) // 히스토리 분해
  const currentSnapshot = currentEntry?.[1] ?? {} // 현재 기준 스냅샷
  const prevSnapshot = prevEntry?.[1] ?? currentSnapshot // 이전 기준 스냅샷

  const metrics = {} as Record<MetricKeyType, MetricCardType> // 계산된 카드 데이터
  const series = {} as Record<MetricKeyType, MetricSeriesType> // 계산된 차트 데이터

  ;(Object.keys(METRIC_META) as MetricKeyType[]).forEach((key) => {
    const meta = METRIC_META[key] // 현재 메타
    const currentValueRaw = safeNum(currentSnapshot?.[meta.source], 0) // 현재값(원본)
    const prevValueRaw = safeNum(prevSnapshot?.[meta.source], currentValueRaw) // 이전값(원본)

    const currentValue = round(currentValueRaw, meta.digits) // 현재값(표시용)
    const deltaValue = round(currentValueRaw - prevValueRaw, 3) // 증감값
    const deltaPercent =
      prevValueRaw !== 0 ? round(((currentValueRaw - prevValueRaw) / Math.abs(prevValueRaw)) * 100, 0) : 0 // 증감률

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

  const instant = metrics.instantPower // 순시전력량 카드
  return {
    peakThreshold: round(Math.max(0, instant.value * 1.02), 1),
    dailyPower: round(safeNum(response.daily_energy_wh, 0), 2),
    dailyDeltaPercent: instant.deltaPercent,
    dailyDeltaValue: instant.deltaValue,
    metrics,
    series,
  }
}

// 다음 정시 갱신 시점(00/15/30/45분 + 10초)까지 남은 시간(ms) 계산
const getNextRefreshDelayMs = (now: Date) => {
  const schedule = [
    { minute: 0, second: 10 },
    { minute: 15, second: 10 },
    { minute: 30, second: 10 },
    { minute: 45, second: 10 },
  ] // 정시 갱신 기준표

  const nowTime = now.getTime() // 현재 시간(ms)

  for (let hourOffset = 0; hourOffset <= 1; hourOffset += 1) {
    for (const point of schedule) {
      const candidate = new Date(now) // 후보 시각
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

  return 60_000 // 예외 시 1분 뒤 재시도
}

// 상태값에 맞는 점(dot) 클래스 반환
const getStatusClassName = (status: StatusType, css: typeof dmc) => {
  if (status === 'normal') return css.detail_statusDotNormal
  if (status === 'warning') return css.detail_statusDotWarning
  return css.detail_statusDotDanger
}

// 증감 배지 클래스 반환
const getDeltaBadgeClassName = (value: number, css: typeof dmc) =>
  value >= 0 ? css.detail_deltaBadgePositive : css.detail_deltaBadgeNegative

// 증감 텍스트 클래스 반환
const getDeltaValueClassName = (value: number, css: typeof dmc) =>
  value >= 0 ? css.detail_deltaValuePositive : css.detail_deltaValueNegative

export default function DetailMonitoringPage() {
  /******************** 변수 영역 ********************/
  const [selectedCompressorId, setSelectedCompressorId] = useState(0) // 선택된 컴프레서 탭 ID
  const [selectedMetricKey, setSelectedMetricKey] = useState<MetricKeyType>('voltage') // 선택된 메트릭 키
  const [isDesktopCarousel, setIsDesktopCarousel] = useState(false) // 데스크톱 캐러셀 사용 여부
  const [tabStartIndex, setTabStartIndex] = useState(0) // 캐러셀 시작 인덱스

  const [tabs, setTabs] = useState<CompressorTabType[]>([]) // 장비 탭 목록
  const [isTabsLoading, setIsTabsLoading] = useState(true) // 장비 탭 로딩 상태
  const [tabsError, setTabsError] = useState<string | null>(null) // 장비 탭 오류 메시지

  const [dashboardMap, setDashboardMap] = useState<Record<string, DashboardDeviceDataType>>({}) // 장비별 대시보드 캐시
  const [isDashboardLoading, setIsDashboardLoading] = useState(false) // 대시보드 로딩 상태
  const [dashboardError, setDashboardError] = useState<string | null>(null) // 대시보드 오류 메시지

  const [peakThresholdByDevice, setPeakThresholdByDevice] = useState<Record<string, number>>({}) // 장비별 피크 설정값

  const [sessionCustomerId, setSessionCustomerId] = useState('') // 세션 customer_id
  const [sessionRole, setSessionRole] = useState('') // 세션 role

  const [customerOptions, setCustomerOptions] = useState<AdminCustomerOptionType[]>([]) // 관리자용 고객사 옵션
  const [selectedCustomerId, setSelectedCustomerId] = useState('') // 관리자 선택 고객사
  const [customerKeyword, setCustomerKeyword] = useState('') // 고객사 검색어
  const [isCustomerListLoading, setIsCustomerListLoading] = useState(false) // 고객사 목록 로딩 여부
  const [customerListError, setCustomerListError] = useState<string | null>(null) // 고객사 목록 오류 메시지

  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false) // 고객사 드롭다운 열림 여부
  const customerComboRef = useRef<HTMLDivElement | null>(null) // 고객사 콤보박스 ref  

  const isAdminUser = useMemo(() => {
    const role = sessionRole.trim().toLowerCase()
    return role === 'admin' || role.includes('admin') || role.includes('관리')
  }, [sessionRole])

  const resolvedCustomerId = isAdminUser ? selectedCustomerId : sessionCustomerId // 장비 조회 대상 customer_id

  const shouldHideShell =
    isAdminUser &&
    !String(selectedCustomerId ?? '').trim() &&
    !isCustomerListLoading &&
    !customerListError
    
  const filteredCustomerOptions = useMemo(() => {
    const keyword = customerKeyword.trim().toLowerCase()
    const filtered = keyword
      ? customerOptions.filter((item) => item.name.toLowerCase().includes(keyword))
      : customerOptions

    if (!selectedCustomerId) return filtered
    if (filtered.some((item) => item.id === selectedCustomerId)) return filtered

    const selected = customerOptions.find((item) => item.id === selectedCustomerId)
    return selected ? [selected, ...filtered] : filtered
  }, [customerKeyword, customerOptions, selectedCustomerId]) // 검색 적용 고객사 목록

  const emptyTabsMessage = '연결된 장비가 없습니다.' // 일반 사용자용 장비 없음 메시지

  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.id === selectedCompressorId) ?? tabs[0] ?? null,
    [tabs, selectedCompressorId],
  ) // 현재 선택된 탭 객체

  const selectedDashboard = selectedTab ? dashboardMap[selectedTab.deviceId] : null // 선택 탭의 대시보드 데이터

  const selectedPeakThreshold = selectedTab
    ? peakThresholdByDevice[selectedTab.deviceId] ?? selectedDashboard?.peakThreshold ?? 0
    : 0 // 선택 탭 피크 기준값

  const shouldUseTabCarousel =
    isDesktopCarousel && tabs.length > DESKTOP_TAB_VISIBLE_COUNT // 데스크톱 캐러셀 활성 여부

  const visibleTabs = shouldUseTabCarousel
    ? tabs.slice(tabStartIndex, tabStartIndex + DESKTOP_TAB_VISIBLE_COUNT)
    : tabs // 화면에 보여줄 탭 목록

  const selectedTabIndex = tabs.findIndex((item) => item.id === selectedCompressorId) // 전체 탭에서 선택 인덱스

  const canMovePrevTabs = selectedTabIndex > 0 // 이전 이동 가능 여부
  const canMoveNextTabs = selectedTabIndex >= 0 && selectedTabIndex < tabs.length - 1 // 다음 이동 가능 여부

  const selectedMetric = selectedDashboard ? selectedDashboard.metrics[selectedMetricKey] : null // 선택 메트릭 카드 데이터
  const activeSeries = selectedDashboard ? selectedDashboard.series[selectedMetricKey] : null // 선택 메트릭 차트 데이터
  const instantPowerMetric = selectedDashboard ? selectedDashboard.metrics.instantPower : null // 순시 전력량 카드 데이터

  const chartDescription = '시간에 따른 데이터가 나타나며, AI가 30분 뒤의 예측 결과를 제공합니다.' // 차트 설명 문구

  /******************** 함수 영역 ********************/
  // 고객사 검색 입력 변경 핸들러 (입력값 포함 검색 + 정확히 일치하면 선택)
  const handleCustomerKeywordChange = (value: string) => {
    setCustomerKeyword(value)
    setIsCustomerDropdownOpen(true)

    const trimmed = value.trim()
    const exact = customerOptions.find((item) => item.name === trimmed)

    if (exact) {
      if (selectedCustomerId !== exact.id) {
        setSelectedCustomerId(exact.id)
        setSelectedCompressorId(0)
      }
    } else if (selectedCustomerId) {
      setSelectedCustomerId('')
      setSelectedCompressorId(0)
    }
  }

  // 드롭다운 항목 선택 핸들러
  const handleCustomerSelect = (item: AdminCustomerOptionType) => {
    setCustomerKeyword(item.name)
    if (selectedCustomerId !== item.id) {
      setSelectedCustomerId(item.id)
      setSelectedCompressorId(0)
    }
    setIsCustomerDropdownOpen(false)
  }

  // 캐러셀에서 이전 탭으로 이동하는 함수
  const handleMovePrevTabs = () => {
    if (!canMovePrevTabs) return
    const prev = tabs[selectedTabIndex - 1]
    if (prev) setSelectedCompressorId(prev.id)
  }

  // 캐러셀에서 다음 탭으로 이동하는 함수
  const handleMoveNextTabs = () => {
    if (!canMoveNextTabs) return
    const next = tabs[selectedTabIndex + 1]
    if (next) setSelectedCompressorId(next.id)
  }

  /******************** 수행 영역 ********************/
  useEffect(() => {
    // 데스크톱 미디어쿼리 구독을 생성하고 캐러셀 사용 여부를 반영한다.
    const mediaQuery = window.matchMedia('(min-width: 1281px)')
    const apply = () => setIsDesktopCarousel(mediaQuery.matches) // 현재 viewport를 상태에 반영하는 함수
    apply() // 최초 1회 즉시 반영

    // 브라우저 API 버전에 따라 이벤트 등록/해제 방식을 분기한다.
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', apply)
      return () => mediaQuery.removeEventListener('change', apply)
    }

    mediaQuery.addListener(apply)
    return () => mediaQuery.removeListener(apply)
  }, [])

  useEffect(() => {
    // 세션을 읽고 관리자면 고객사 목록을 조회한다.
    let disposed = false

    const session = getSessionUserInfo()
    setSessionRole(session.role)
    setSessionCustomerId(session.customerId)

    if (!session.isAdmin) {
      setCustomerOptions([])
      setSelectedCustomerId('')
      setCustomerKeyword('')
      setCustomerListError(null)
      return
    }

    const loadAdminCustomers = async () => {
      setIsCustomerListLoading(true)
      setCustomerListError(null)

      try {
        const response = await fetch(withAppPrefix('/api/admin/getCustomers'), { method: 'GET' })
        const json = (await response.json().catch(() => null)) as GetCustomersResponseType | null

        if (!response.ok || !json?.success) {
          throw new Error(json?.message ?? '고객사 목록을 불러오지 못했습니다.')
        }

        const options = (Array.isArray(json.data) ? json.data : [])
          .map((item) => ({
            id: String(item.id ?? '').trim(),
            name: String(item.name ?? '-').trim() || '-',
          }))
          .filter((item) => Boolean(item.id))
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

        if (!disposed) {
          setCustomerOptions(options)
          setSelectedCustomerId((prev) => {
            if (prev && options.some((v) => v.id === prev)) return prev
            return '' // 관리자 최초 진입 시 고객사 자동 선택 안함
          })
        }
      } catch (error: any) {
        if (!disposed) {
          setCustomerOptions([])
          setSelectedCustomerId('')
          setCustomerListError(error?.message ?? '고객사 목록 조회 중 오류가 발생했습니다.')
        }
      } finally {
        if (!disposed) {
          setIsCustomerListLoading(false)
        }
      }
    }

    void loadAdminCustomers()

    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    // 선택된 customer_id 기준으로 연결 장비 목록을 조회한다.
    let disposed = false

    const loadTabs = async () => {
      setIsTabsLoading(true)
      setTabsError(null)

      try {
        const customerId = String(resolvedCustomerId ?? '').trim()

        // 관리자 미선택/세션 없음 케이스는 오류 없이 장비 비움 처리
        if (!customerId) {
          if (!disposed) {
            setTabs([])
            setSelectedCompressorId(0)
            setTabStartIndex(0)
          }
          return
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

    void loadTabs()

    return () => {
      disposed = true
    }
  }, [resolvedCustomerId, isAdminUser])

  useEffect(() => {
    if (!selectedTab) return // 선택 장비가 없으면 중단

    let disposed = false // 비동기 언마운트 가드
    let refreshTimer: ReturnType<typeof setTimeout> | null = null // 정시 갱신 타이머

    // 기존 타이머를 정리한다.
    const clearTimer = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }

    // 다음 정시 갱신 시각으로 타이머를 설정한다.
    const scheduleNext = () => {
      clearTimer()
      const delay = getNextRefreshDelayMs(new Date()) // 다음 정시까지 대기 시간 계산
      refreshTimer = setTimeout(() => {
        void fetchDashboard(false) // 정시 재조회
      }, delay)
    }

    // 선택 장비의 대시보드 데이터를 조회하고 화면 데이터로 변환한다.
    const fetchDashboard = async (initial: boolean) => {
      if (disposed) return

      if (initial) {
        setIsDashboardLoading(true) // 최초 진입 로딩 표시
      }
      setDashboardError(null) // 이전 오류 초기화

      try {
        const response = await fetch(
          withAppPrefix(
            `/api/monitor/dashboard/${encodeURIComponent(selectedTab.deviceId)}?lookback_hours=${LOOKBACK_HOURS}`,
          ),
          { method: 'GET' },
        )

        const json = (await response.json().catch(() => null)) as DashboardApiResponseType | null // 응답 파싱

        if (!response.ok || !json) {
          throw new Error(
            (json as any)?.message ?? `모니터링 데이터를 불러오지 못했습니다. (HTTP ${response.status})`,
          )
        }

        const built = buildDashboardData(json) // 화면 데이터 변환

        if (!disposed) {
          setDashboardMap((prev) => ({ ...prev, [selectedTab.deviceId]: built })) // 장비별 캐시에 저장
          setPeakThresholdByDevice((prev) => {
            if (typeof prev[selectedTab.deviceId] === 'number') return prev // 이미 사용자가 입력한 값이 있으면 유지
            return { ...prev, [selectedTab.deviceId]: built.peakThreshold } // 없으면 초기 피크값 세팅
          })
        }
      } catch (error: any) {
        if (!disposed) {
          setDashboardError(error?.message ?? '모니터링 조회 중 오류가 발생했습니다.')
        }
      } finally {
        if (!disposed) {
          setIsDashboardLoading(false) // 로딩 종료
          scheduleNext() // 정시 갱신 예약
        }
      }
    }

    void fetchDashboard(true) // 장비 선택 직후 즉시 1회 조회

    return () => {
      disposed = true // 언마운트 가드 활성화
      clearTimer() // 타이머 정리
    }
  }, [selectedTab?.deviceId])

  useEffect(() => {
    // 캐러셀 미사용 구간에서는 시작 인덱스를 0으로 고정한다.
    if (!shouldUseTabCarousel) {
      setTabStartIndex(0)
      return
    }

    // 선택된 탭이 보이는 범위를 벗어나면 시작 인덱스를 자동 보정한다.
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

  useEffect(() => {
    // 관리자 고객사 콤보박스 외부 클릭 시 드롭다운 닫기
    if (!isAdminUser) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!customerComboRef.current) return
      if (!customerComboRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isAdminUser])

  useEffect(() => {
    // 선택된 고객사가 있으면 input 텍스트를 고객사명으로 동기화
    if (!isAdminUser) return
    const selected = customerOptions.find((item) => item.id === selectedCustomerId)
    if (selected) {
      setCustomerKeyword(selected.name)
    }
  }, [isAdminUser, customerOptions, selectedCustomerId])

  return (
    <div className={dmc.detail_root}>
      <header className={dmc.detail_pageHead}>
        <div className={dmc.detail_pageHeadTop}>
          <div className={dmc.detail_pageHeadText}>
            <h1>컴프레서 상태 모니터링</h1>
            <p>실시간 컴프레서 운전 상태 및 30분에 대한 예측 결과를 확인하실 수 있습니다.</p>
          </div>

          {isAdminUser && (
            <div className={dmc.detail_customerSelectBox}>
              <strong className={dmc.detail_customerSelectTitle}>고객사 선택</strong>

            <div className={dmc.detail_customerSelectControls}>
              <div className={dmc.detail_customerCombo} ref={customerComboRef}>
                <input
                  type="text"
                  className={dmc.detail_customerSearchInput}
                  placeholder="고객사 검색 후 선택"
                  value={customerKeyword}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onChange={(e) => handleCustomerKeywordChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsCustomerDropdownOpen(false)
                    }

                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const first = filteredCustomerOptions[0]
                      if (first) handleCustomerSelect(first)
                    }
                  }}
                  disabled={isCustomerListLoading}
                />

                <button
                  type="button"
                  className={dmc.detail_customerComboArrow}
                  onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
                  disabled={isCustomerListLoading}
                  aria-label="고객사 목록 열기"
                >
                  ▾
                </button>

                {isCustomerDropdownOpen && (
                  <div className={dmc.detail_customerDropdown}>
                    {filteredCustomerOptions.length ? (
                      filteredCustomerOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`${dmc.detail_customerDropdownItem} ${
                            item.id === selectedCustomerId ? dmc.detail_customerDropdownItemActive : ''
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleCustomerSelect(item)}
                        >
                          {item.name}
                        </button>
                      ))
                    ) : (
                      <div className={dmc.detail_customerDropdownEmpty}>검색 결과가 없습니다.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
        </div>

        {isAdminUser && customerListError ? (
          <p className={dmc.detail_customerSelectError}>{customerListError}</p>
        ) : null}
      </header>

      {!shouldHideShell && (
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
                  const isActive = tab.id === selectedCompressorId // 활성 탭 여부

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
                  isAdminUser ? null : (
                    <button type="button" className={dmc.detail_tabBtn} disabled>
                      <span>{emptyTabsMessage}</span>
                    </button>
                  )
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
                    const next = Number(event.target.value) // 사용자 입력값
                    const value = Number.isNaN(next) ? 0 : Math.max(0, round(next, 1)) // 안전 보정값
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
                const metric = selectedDashboard.metrics[metricKey] // 현재 카드 데이터
                const isActive = selectedMetricKey === metricKey // 카드 선택 여부

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
      )}
    </div>
  )
}
