import { NextRequest, NextResponse } from 'next/server'
import { PYTHON_CONFIG } from '@/config/environment'
import { canAccessDevice } from '@/app/services/util/api-auth'
import { jsonError, pythonFetch, requireSession, resolvePythonUrl } from '@/app/api/_lib/bff'

/*
 * 01. 구분     : API Route (App Router)
 * 02. 타입     : GET
 * 03. 업무구분  : 멤버 - 상세 모니터링 대시보드
 * 04. 설명     : Python API /api/monitor/dashboard/{device_id} 프록시
 * 05. 작성일자  : 2026.04.13
 * 06. 작성자   : Codex
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ device_id: string }> },
) {
  // 세션 검증: 로그인 사용자만 조회 가능
  const { session, error } = await requireSession(request)
  if (error) return error

  try {
    const { device_id } = await params
    const deviceId = String(device_id ?? '').trim()

    const rawLookback = request.nextUrl.searchParams.get('lookback_hours') ?? '24'
    const lookbackHours = Number(rawLookback)

    if (!deviceId) {
      return jsonError(400, 'device_id가 필요합니다.')
    }

    // 소유권 검증: 비관리자는 본인 고객사 장비만 조회 가능 (IDOR 방지)
    const access = await canAccessDevice(session, deviceId)
    if (!access.ok) {
      return jsonError(access.status, access.message)
    }

    if (!Number.isInteger(lookbackHours) || lookbackHours < 1 || lookbackHours > 744) {
      return jsonError(400, 'lookback_hours는 1~744 사이의 정수여야 합니다.')
    }

    const { url: baseUrl, error: urlError } = resolvePythonUrl(
      PYTHON_CONFIG.ENDPOINTS.MONITOR_DASHBOARD(deviceId),
    )
    if (urlError) return urlError

    const { response, data } = await pythonFetch(`${baseUrl}?lookback_hours=${lookbackHours}`, {
      method: 'GET',
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
      '모니터링 대시보드 프록시 처리 중 서버 오류가 발생했습니다.',
      error?.message ?? 'Unknown error',
    )
  }
}
