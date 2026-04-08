import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl, PYTHON_CONFIG } from '@/config/environment'

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
  try {
    const body = await request.json()

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
