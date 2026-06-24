/*
 * 백엔드(Python API) 응답 타입계약 — 프론트↔백엔드 경계 문서화.
 *
 * 실제 응답 형태 기반(골든 캡처 + 백엔드 코드). BFF 프록시(pythonFetch<T>)와 페이지가
 * 응답을 타입 안전하게 소비하도록 단일 계약을 제공한다. 런타임 검증이 아니라 컴파일 타입
 * 계약이므로, 백엔드 응답 형태가 바뀌면 여기와 백엔드를 함께 갱신해야 한다.
 */

/** BFF 공통 에러 봉투(_lib/bff.ts jsonError 가 반환). */
export type BffError = {
  success: false
  message: string
  details?: unknown
}

/** 예측 결과(GET /api/predict/{device} auto, POST /api/predict manual, 시뮬 baseline/simulated). */
export type PredictResponse = {
  device_id: string
  best_model: string
  preds: Array<{ y_15_pred: number; y_30_pred: number }>
  missing_features?: string[]
  missing_feature_count?: number
  base_timestamp?: string
}

/** 대시보드 한 시점의 센서 값(GET /api/monitor/dashboard history_by_time 의 value). */
export type DashboardSensorRow = {
  PRESSURE: number
  TEMPERATURE: number
  HZ: number
  AVGVOLTAGE: number
  AVGCURRENT: number
  CURVOLTAGE: number
  FACTOR: number
}

/** GET /api/monitor/dashboard/{device_id} */
export type MonitorDashboardResponse = {
  device_id: string
  daily_energy_wh: number
  history_by_time: Record<string, DashboardSensorRow>
  timestamp: string
}

/** POST /api/optimize/peak-dispatch (MILP result_payload). 상세 필드가 많아 핵심만 명시. */
export type PeakDispatchResponse = {
  status: string
  success: boolean
  message: string
  device_count: number
  donor_device_ids: string[]
  idle_device_ids: string[]
  peak_15_before: number
  peak_15_after: number
  peak_30_before: number
  peak_30_after: number
  // devices / allocation_plan / company_summaries 등 추가 필드는 백엔드 result_payload 참조
  [key: string]: unknown
}

/** GET /api/esg/customers 항목. */
export type EsgCustomer = {
  customer_id: string
  customer_name: string
  customer_user_id?: string | null
}

/** GET /api/simulate/template/{device_id} */
export type SimulationTemplateResponse = {
  device_id: string
  base_timestamp: string
  base_log_id: number
  editable_fields: Record<string, number>
  baseline: PredictResponse
}

/** POST /api/simulate/predict */
export type SimulationPredictResponse = {
  device_id: string
  base_timestamp: string
  overrides: Record<string, number>
  baseline: PredictResponse
  simulated: PredictResponse
}
