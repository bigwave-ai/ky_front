import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl, PYTHON_CONFIG } from '@/config/environment'
import { canAccessDevice, getRouteSession } from '@/app/services/util/api-auth'

/*
 * 01. 구분     : API Route (App Router)
 * 02. 타입     : GET
 * 03. 업무구분  : 멤버 - 시뮬레이션 템플릿 조회
 * 04. 설명     : Python API /api/simulate/template/{device_id} 프록시
 * 05. 작성일자  : 2026.04.13
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> },
) {
  // 세션 검증: 로그인 사용자만 조회 가능
  const session = await getRouteSession(request)
  if (!session) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    // Next.js 동적 params는 비동기(await)로 해석
    const { device_id } = await params
    const deviceId = String(device_id ?? '').trim()

    const rawLookback = request.nextUrl.searchParams.get('lookback_hours') ?? '24'
    const lookbackHours = Number(rawLookback)

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: 'device_id가 필요합니다.' },
        { status: 400 },
      )
    }

    // 소유권 검증: 비관리자는 본인 고객사 장비만 조회 가능 (IDOR 방지)
    const access = await canAccessDevice(session, deviceId)
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status })
    }

    if (!Number.isInteger(lookbackHours) || lookbackHours < 1 || lookbackHours > 744) {
      return NextResponse.json(
        { success: false, message: 'lookback_hours는 1~744 사이의 정수여야 합니다.' },
        { status: 400 },
      )
    }

    const endpointPath = PYTHON_CONFIG.ENDPOINTS.SIMULATION_TEMPLATE(deviceId)
    const baseUrl = getPythonUrl(endpointPath)

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'Python API URL이 설정되지 않았습니다. (.env 확인 필요)' },
        { status: 500 },
      )
    }

    const backendUrl = `${baseUrl}?lookback_hours=${lookbackHours}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)

    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      })

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
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: '시뮬레이션 템플릿 프록시 처리 중 서버 오류가 발생했습니다.',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 },
    )
  }
}
