import { NextRequest, NextResponse } from 'next/server'
import { PYTHON_CONFIG } from '@/config/environment'
import { getScopedCustomerId } from '@/app/services/util/api-auth'
import { jsonError, pythonFetch, requireSession, resolvePythonUrl } from '@/app/api/_lib/bff'

/*
 * 01. 구분     : API Route (App Router)
 * 02. 타입     : GET
 * 03. 업무구분 : 멤버·관리자 - 효율(압력당 전력) 분석 + 운영 스케줄
 * 04. 설명     : Python /api/optimize/efficiency 프록시 + 테넌트 격리
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { session, error } = await requireSession(request)
  if (error) return error
  try {
    let customerId = String(request.nextUrl.searchParams.get('customer_id') ?? '').trim()
    const lookback = String(request.nextUrl.searchParams.get('lookback_hours') ?? '168').trim()

    // 테넌트 격리: 멤버는 본인 고객사로 강제, 불일치 403. admin(null)은 임의 허용.
    const scoped = getScopedCustomerId(session)
    if (scoped !== null) {
      if (!scoped) return jsonError(403, '세션에 고객사 정보가 없습니다. 다시 로그인해주세요.')
      if (customerId && customerId !== scoped) return jsonError(403, '본인 고객사만 조회할 수 있습니다.')
      customerId = scoped
    }
    if (!customerId) return jsonError(400, 'customer_id가 필요합니다.')

    const { url, error: urlError } = resolvePythonUrl(PYTHON_CONFIG.ENDPOINTS.EFFICIENCY)
    if (urlError) return urlError

    const target = `${url}?customer_id=${encodeURIComponent(customerId)}&lookback_hours=${encodeURIComponent(lookback)}`
    const { response, data } = await pythonFetch(target, { method: 'GET', timeoutMs: 120_000 })
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.message ?? data?.detail ?? `Python API 요청 실패 (${response.status})`, details: data },
        { status: response.status },
      )
    }
    return NextResponse.json(data ?? { success: false, message: '응답 파싱 실패' }, { status: data ? 200 : 502 })
  } catch (e: any) {
    return jsonError(500, '효율 분석 중 서버 오류가 발생했습니다.', e?.message ?? 'Unknown error')
  }
}
