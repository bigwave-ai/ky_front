/* c:\Users\USER\Desktop\bigwave\케이와이\program\kyfront_2026_03_23\app\api\simulate\predict\route.ts */
import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl, PYTHON_CONFIG } from '@/config/environment'

/*
 * 01. 구분     : API Route (App Router)
 * 02. 타입     : POST
 * 03. 업무구분  : 멤버 - 시뮬레이션 예측 실행
 * 04. 설명     : Python API /api/simulate/predict 프록시
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const deviceId = String(body?.device_id ?? '').trim()
    const lookbackHours = Number(body?.lookback_hours)
    const baseTimestamp = String(body?.base_timestamp ?? '').trim()
    const baseLogId = Number(body?.base_log_id)

    const rawOverrides = body?.overrides
    const overrides =
      rawOverrides && typeof rawOverrides === 'object' && !Array.isArray(rawOverrides)
        ? Object.fromEntries(
            Object.entries(rawOverrides).filter(([, v]) => Number.isFinite(Number(v))),
          )
        : {}

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: 'device_id가 필요합니다.' },
        { status: 400 },
      )
    }

    if (!Number.isInteger(lookbackHours) || lookbackHours < 1 || lookbackHours > 744) {
      return NextResponse.json(
        { success: false, message: 'lookback_hours는 1~744 사이의 정수여야 합니다.' },
        { status: 400 },
      )
    }

    if (!baseTimestamp) {
      return NextResponse.json(
        { success: false, message: 'base_timestamp가 필요합니다.' },
        { status: 400 },
      )
    }

    if (!Number.isFinite(baseLogId)) {
      return NextResponse.json(
        { success: false, message: 'base_log_id가 필요합니다.' },
        { status: 400 },
      )
    }

    const backendUrl = getPythonUrl(PYTHON_CONFIG.ENDPOINTS.SIMULATION_PREDICT)
    if (!backendUrl) {
      return NextResponse.json(
        {
          success: false,
          message: 'Python API URL이 설정되지 않았습니다. (.env 확인 필요)',
        },
        { status: 500 },
      )
    }

    const payload = {
      device_id: deviceId,
      overrides,
      lookback_hours: lookbackHours,
      base_timestamp: baseTimestamp,
      base_log_id: baseLogId,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60_000)

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        message: '시뮬레이션 예측 프록시 처리 중 서버 오류가 발생했습니다.',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 },
    )
  }
}
