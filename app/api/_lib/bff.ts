import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl } from '@/config/environment'
import { getRouteSession } from '@/app/services/util/api-auth'

/**
 * BFF(Backend-for-Frontend) 공통 헬퍼.
 *
 * Python 백엔드로 프록시하는 app/api/* 라우트들이 중복 구현하던
 * readJsonSafe / 세션가드 / Python URL 빌드 / fetch+타임아웃+에러래핑을 한 곳으로 모은다.
 * 각 라우트의 검증·후처리·에러 메시지/형태는 호출부가 그대로 유지(동작보존).
 */

/** 응답 JSON 안전 파싱(실패 시 null). 기존 각 라우트 로컬 readJsonSafe 통합.
 *  T 는 호출부가 지정하는 응답 계약(app/models/api/responses) — 런타임 검증이 아닌 타입 단언.
 *  기본값 any: BFF 라우트는 성공·에러 응답을 같은 data로 다뤄(에러 .message 접근) 성공타입 강제 불가. */
export async function readJsonSafe<T = any>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

/** 표준 에러 JSON 응답({success:false, message[, details]}). */
export function jsonError(status: number, message: string, details?: unknown) {
  const body = details === undefined ? { success: false, message } : { success: false, message, details }
  return NextResponse.json(body, { status })
}

type RouteSession = NonNullable<Awaited<ReturnType<typeof getRouteSession>>>

/** 세션 필수 가드. 반환 판별 유니온: {session, error:null} | {session:null, error:401}. */
export async function requireSession(
  request: NextRequest,
): Promise<{ session: RouteSession; error: null } | { session: null; error: NextResponse }> {
  const session = await getRouteSession(request)
  if (!session) {
    return { session: null, error: jsonError(401, '로그인이 필요합니다.') }
  }
  return { session, error: null }
}

/** Python API URL 빌드 + 미설정 시 500. 반환: {url} 또는 {error}. */
export function resolvePythonUrl(path: string): { url: string; error: null } | { url: null; error: NextResponse } {
  const url = getPythonUrl(path)
  if (!url) {
    return { url: null, error: jsonError(500, 'Python API URL이 설정되지 않았습니다. (.env 확인 필요)') }
  }
  return { url, error: null }
}

/**
 * Python 백엔드 호출(AbortController 타임아웃 + cache:no-store + 안전파싱).
 * 반환 {response, data} — !response.ok 등 라우트별 처리는 호출부가 수행(동작보존).
 */
export async function pythonFetch<T = any>(
  url: string,
  opts: { method?: string; body?: unknown; timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<{ response: Response; data: T | null }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000)
  try {
    const hasBody = opts.body !== undefined
    const response = await fetch(url, {
      method: opts.method ?? 'GET',
      cache: 'no-store',
      signal: controller.signal,
      ...(hasBody ? { body: JSON.stringify(opts.body) } : {}),
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.headers ?? {}),
      },
    })
    const data = await readJsonSafe<T>(response)
    return { response, data }
  } finally {
    clearTimeout(timeoutId)
  }
}
