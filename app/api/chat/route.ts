import { NextRequest, NextResponse } from 'next/server'
import { getRouteSession, SESSION_COOKIE } from '../../services/util/api-auth'

/**
 * 챗 BFF 프록시 (RAG 챗봇 연동 — FRONTEND_INTEGRATION.md).
 * RAG 서버 주소는 NEXT_PUBLIC_API_URL, 경로는 RAG_CHAT_PATH(기본 /rag/generate/)로 설정.
 * 권한(role/plant_code)은 세션 JWT(Authorization: Bearer)에 실어 보내고 RAG가 검증·스코프한다.
 */
const getBackendUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.API_URL ||
    process.env.BACKEND_URL

  if (!baseUrl) {
    throw new Error('Backend URL not configured in environment variables')
  }

  const path = process.env.RAG_CHAT_PATH || '/rag/generate/'
  return `${baseUrl.replace(/\/+$/, '')}${path}`
}

export async function POST(request: NextRequest) {
  try {
    // 로그인 세션(JWT 쿠키) 필수. 권한 스코프(role/plant_code)는 RAG가 이 JWT를 검증해 읽는다.
    const session = await getRouteSession(request).catch(() => null)
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    // 세션 JWT를 Authorization: Bearer 로 전달(role/plant_code/customer_id 클레임 포함).
    // 본문은 question/stream/messages/limit/session_id 그대로 통과(권한값은 body로 보내지 않는다).
    const token = request.cookies.get(SESSION_COOKIE)?.value

    const backendUrl = getBackendUrl()
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return NextResponse.json(
        { error: 'Backend error', status: response.status, details: detail.slice(0, 500) },
        { status: 502 },
      )
    }

    // 스트림 요청이면 그대로 통과(백엔드가 단일 JSON을 줘도 프론트의 parseStreamingJSON 이 처리).
    if (body?.stream && response.body) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
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
