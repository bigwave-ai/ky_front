import { NextRequest, NextResponse } from 'next/server'
import { PYTHON_CONFIG } from '@/config/environment'
import { getScopedCustomerId } from '@/app/services/util/api-auth'
import { jsonError, pythonFetch, requireSession, resolvePythonUrl } from '@/app/api/_lib/bff'

/*
 * 01. 구분     : API Route (App Router)
 * 02. 타입     : POST
 * 03. 업무구분 : 멤버 - Peak Shaving MILP 실행
 * 04. 설명     : 프론트 요청을 Python API(/api/optimize/peak-dispatch)로 프록시
 * 05. 작성일자 : 2026.04.08
 * 06. 작성자   : Codex
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // 세션 검증: 로그인 사용자만 실행 가능
  const { session, error } = await requireSession(request)
  if (error) return error

  try {
    const body = await request.json()

    // 테넌트 스코프 강제: 비관리자는 본인 고객사로만 최적화 실행 가능 (IDOR 방지).
    // 클라이언트가 보낸 customer_id가 세션과 다르면 차단하고, 누락 시 세션 값으로 강제한다.
    const scopedCustomerId = getScopedCustomerId(session)
    if (scopedCustomerId !== null) {
      if (!scopedCustomerId) {
        return jsonError(403, '세션에 고객사 정보가 없습니다. 다시 로그인해주세요.')
      }
      const requestedCustomerId = String(body?.customer_id ?? '').trim()
      if (requestedCustomerId && requestedCustomerId !== scopedCustomerId) {
        return jsonError(403, '본인 고객사에 대해서만 실행할 수 있습니다.')
      }
      body.customer_id = scopedCustomerId
    }

    const { url: backendUrl, error: urlError } = resolvePythonUrl(
      PYTHON_CONFIG.ENDPOINTS.PEAK_DISPATCH_OPTIMIZE,
    )
    if (urlError) return urlError

    const { response, data } = await pythonFetch(backendUrl, {
      method: 'POST',
      body,
      timeoutMs: 60_000,
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message ?? `Python API 요청 실패 (${response.status})`,
          details: data,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(data ?? { success: false, message: '응답 파싱 실패' }, {
      status: data ? 200 : 502,
    })
  } catch (error: any) {
    return jsonError(
      500,
      'MILP 프록시 처리 중 서버 오류가 발생했습니다.',
      error?.message ?? 'Unknown error',
    )
  }
}
