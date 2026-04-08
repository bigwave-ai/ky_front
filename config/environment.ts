/*
 * 01. 구분     : Environment Configuration
 * 02. 타입     : 공용 (Server/Client)
 * 03. 업무구분 : 모든권한 - Python API 경로
 * 04. 설명     : Python API URL / Endpoint / App Prefix 유틸
 * 05. 작성일자 : 2026.04.08
 * 06. 작성자   : Codex
 */

const PYTHON_API_PREFIX = (process.env.NEXT_PUBLIC_PYTHON_API_PREFIX ?? '').replace(/\/+$/, '')

const normalizeEndpointPath = (path: string) => {
  if (!path) return ''
  const withSlash = path.startsWith('/') ? path : `/${path}`
  return withSlash.replace(/\/{2,}/g, '/')
}

export const PYTHON_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_PYTHON_URL ?? '',
  ENDPOINTS: {
    // MILP 피크 분배 최적화
    PEAK_DISPATCH_OPTIMIZE: normalizeEndpointPath(`${PYTHON_API_PREFIX}/api/optimize/peak-dispatch`,),
  },
} as const

export function getPythonUrl(endpoint: string): string {
  const base = (PYTHON_CONFIG.BASE_URL ?? '').replace(/\/+$/, '')
  const path = String(endpoint ?? '').replace(/^\/+/, '')
  if (!base || !path) return ''
  return `${base}/${path}`
}

/** Next.js 앱 자체 prefix (예: /session-legacy) */
export const APP_PREFIX = (process.env.NEXT_PUBLIC_APP_PREFIX || '').replace(/\/+$/, '')

/** 프론트에서 /api, /main 등 요청할 때 prefix 붙여주는 유틸 */
export function withAppPrefix(path: string): string {
  const cleanPath = String(path ?? '').replace(/^\/+/, '')
  if (!APP_PREFIX) return `/${cleanPath}`
  return `${APP_PREFIX}/${cleanPath}`
}
