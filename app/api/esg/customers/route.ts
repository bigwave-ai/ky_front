import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl, PYTHON_CONFIG } from '@/config/environment'
import { getRouteSession, getScopedCustomerId } from '@/app/services/util/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type EsgCustomer = {
  customer_id: string
  customer_name: string
  customer_user_id?: string | null
}

/**
 * ESG 보고서용 고객사 목록.
 * - 관리자: 전체 고객사
 * - 일반 사용자: 본인 고객사만(테넌트 격리) — 백엔드가 무인증이라 BFF에서 강제 스코프
 */
export async function GET(request: NextRequest) {
  const session = await getRouteSession(request)
  if (!session) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const backendUrl = getPythonUrl(PYTHON_CONFIG.ENDPOINTS.ESG_CUSTOMERS)
    if (!backendUrl) {
      return NextResponse.json(
        { success: false, message: 'Python API URL이 설정되지 않았습니다. (.env 확인 필요)' },
        { status: 500 },
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30_000)
    const response = await fetch(`${backendUrl}?limit=500`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const raw = await response.json().catch(() => null)
    if (!response.ok || !Array.isArray(raw)) {
      return NextResponse.json(
        { success: false, message: raw?.detail ?? `고객사 목록 조회 실패 (${response.status})` },
        { status: response.ok ? 502 : response.status },
      )
    }

    let list = (raw as EsgCustomer[])
      .map((c) => ({
        customer_id: String(c?.customer_id ?? '').trim(),
        customer_name: String(c?.customer_name ?? '').trim(),
        customer_user_id: c?.customer_user_id ?? null,
      }))
      .filter((c) => c.customer_id && c.customer_name)

    // 테넌트 스코프: 비관리자는 본인 고객사만 노출
    const scopedCustomerId = getScopedCustomerId(session)
    if (scopedCustomerId !== null) {
      list = list.filter((c) => c.customer_id === scopedCustomerId)
    }

    return NextResponse.json({ success: true, data: list })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'ESG 고객사 목록 프록시 처리 중 오류가 발생했습니다.',
        details: error?.message ?? 'Unknown error',
      },
      { status: 500 },
    )
  }
}
