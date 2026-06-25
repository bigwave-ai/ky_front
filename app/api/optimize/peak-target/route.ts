import { NextRequest, NextResponse } from 'next/server'
import { PYTHON_CONFIG } from '@/config/environment'
import { getScopedCustomerId } from '@/app/services/util/api-auth'
import { jsonError, pythonFetch, requireSession, resolvePythonUrl } from '@/app/api/_lib/bff'

/*
 * 01. 구분     : API Route (App Router)
 * 02. 타입     : GET / PUT / POST / DELETE
 * 03. 업무구분 : 멤버·관리자 - 피크 분배 목표선(target peak) 설정/조회/삭제
 * 04. 설명     : Python API(/api/optimize/peak-target)로 프록시 + 테넌트 격리(IDOR 방지)
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SessionLike = Parameters<typeof getScopedCustomerId>[0]

// 멤버는 본인 고객사로만(누락 시 강제, 불일치 403). admin(null)은 임의 허용.
function scopeCustomerId(
  session: SessionLike,
  requested: string,
): { value: string; error: null } | { value: null; error: NextResponse } {
  const scoped = getScopedCustomerId(session)
  if (scoped === null) return { value: String(requested ?? '').trim(), error: null } // 관리자
  if (!scoped) return { value: null, error: jsonError(403, '세션에 고객사 정보가 없습니다. 다시 로그인해주세요.') }
  const req = String(requested ?? '').trim()
  if (req && req !== scoped) {
    return { value: null, error: jsonError(403, '본인 고객사에 대해서만 설정할 수 있습니다.') }
  }
  return { value: scoped, error: null }
}

async function proxy(method: string, url: string, body?: unknown) {
  const { response, data } = await pythonFetch(url, { method, body, timeoutMs: 30_000 })
  if (!response.ok) {
    return NextResponse.json(
      {
        success: false,
        message: data?.message ?? data?.detail ?? `Python API 요청 실패 (${response.status})`,
        details: data,
      },
      { status: response.status },
    )
  }
  return NextResponse.json(data ?? { success: false, message: '응답 파싱 실패' }, { status: data ? 200 : 502 })
}

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession(request)
  if (error) return error
  try {
    const scoped = scopeCustomerId(session, request.nextUrl.searchParams.get('customer_id') ?? '')
    if (scoped.error) return scoped.error
    if (!scoped.value) return jsonError(400, 'customer_id가 필요합니다.')
    const { url, error: urlError } = resolvePythonUrl(PYTHON_CONFIG.ENDPOINTS.PEAK_TARGET)
    if (urlError) return urlError
    return await proxy('GET', `${url}?customer_id=${encodeURIComponent(scoped.value)}`)
  } catch (e: any) {
    return jsonError(500, '목표선 조회 중 서버 오류가 발생했습니다.', e?.message ?? 'Unknown error')
  }
}

async function upsert(request: NextRequest) {
  const { session, error } = await requireSession(request)
  if (error) return error
  try {
    const body = await request.json()
    const scoped = scopeCustomerId(session, String(body?.customer_id ?? ''))
    if (scoped.error) return scoped.error
    body.customer_id = scoped.value
    const { url, error: urlError } = resolvePythonUrl(PYTHON_CONFIG.ENDPOINTS.PEAK_TARGET)
    if (urlError) return urlError
    return await proxy('PUT', url, body)
  } catch (e: any) {
    return jsonError(500, '목표선 설정 중 서버 오류가 발생했습니다.', e?.message ?? 'Unknown error')
  }
}
export const PUT = upsert
export const POST = upsert

export async function DELETE(request: NextRequest) {
  const { session, error } = await requireSession(request)
  if (error) return error
  try {
    const scoped = scopeCustomerId(session, request.nextUrl.searchParams.get('customer_id') ?? '')
    if (scoped.error) return scoped.error
    if (!scoped.value) return jsonError(400, 'customer_id가 필요합니다.')
    const deviceId = request.nextUrl.searchParams.get('device_id') ?? ''
    const { url, error: urlError } = resolvePythonUrl(PYTHON_CONFIG.ENDPOINTS.PEAK_TARGET)
    if (urlError) return urlError
    let target = `${url}?customer_id=${encodeURIComponent(scoped.value)}`
    if (deviceId) target += `&device_id=${encodeURIComponent(deviceId)}`
    return await proxy('DELETE', target)
  } catch (e: any) {
    return jsonError(500, '목표선 삭제 중 서버 오류가 발생했습니다.', e?.message ?? 'Unknown error')
  }
}
