import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl, PYTHON_CONFIG } from '@/config/environment'
import { getRouteSession, getScopedCustomerId } from '@/app/services/util/api-auth'

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

const readJsonSafe = async (response: Response): Promise<any | null> => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  // 세션 검증: 로그인 사용자만 실행 가능
  const session = await getRouteSession(request)
  if (!session) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // 테넌트 스코프 강제: 비관리자는 본인 고객사로만 최적화 실행 가능 (IDOR 방지).
    // 클라이언트가 보낸 customer_id가 세션과 다르면 차단하고, 누락 시 세션 값으로 강제한다.
    const scopedCustomerId = getScopedCustomerId(session)
    if (scopedCustomerId !== null) {
      if (!scopedCustomerId) {
        return NextResponse.json(
          { success: false, message: '세션에 고객사 정보가 없습니다. 다시 로그인해주세요.' },
          { status: 403 },
        )
      }
      const requestedCustomerId = String(body?.customer_id ?? '').trim()
      if (requestedCustomerId && requestedCustomerId !== scopedCustomerId) {
        return NextResponse.json(
          { success: false, message: '본인 고객사에 대해서만 실행할 수 있습니다.' },
          { status: 403 },
        )
      }
      body.customer_id = scopedCustomerId
    }

    const backendUrl = getPythonUrl(PYTHON_CONFIG.ENDPOINTS.PEAK_DISPATCH_OPTIMIZE)
    if (!backendUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Python API URL이 설정되지 않았습니다. (.env 확인 필요)',
        },
        { status: 500 },
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    const data = await readJsonSafe(response)

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
    return NextResponse.json(
      {
        success: false,
        message: 'MILP 프록시 처리 중 서버 오류가 발생했습니다.',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 },
    )
  }
}
