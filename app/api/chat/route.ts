import { NextRequest, NextResponse } from 'next/server'
import { getRouteSession } from '../../services/util/api-auth'

const getBackendUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.API_URL ||
    process.env.BACKEND_URL

  if (!baseUrl) {
    throw new Error('Backend URL not configured in environment variables')
  }

  return `${baseUrl}/python-api/rag/generate`
}

export async function POST(request: NextRequest) {
  // 세션 검증: 로그인 사용자만 백엔드 프록시 호출 가능
  const session = await getRouteSession(request)
  if (!session) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const backendUrl = getBackendUrl()

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          Authorization: request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    if (body.stream && response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to proxy request to backend',
        details: error?.message ?? 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
