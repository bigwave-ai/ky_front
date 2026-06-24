import { NextRequest, NextResponse } from 'next/server'
import { PYTHON_CONFIG } from '@/config/environment'
import { getScopedCustomerId } from '@/app/services/util/api-auth'
import { jsonError, pythonFetch, requireSession, resolvePythonUrl } from '@/app/api/_lib/bff'
import type { EsgCustomer } from '@/app/models/api/responses'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ESG 보고서용 고객사 목록.
 * - 관리자: 전체 고객사
 * - 일반 사용자: 본인 고객사만(테넌트 격리) — 백엔드가 무인증이라 BFF에서 강제 스코프
 */
export async function GET(request: NextRequest) {
  const { session, error } = await requireSession(request)
  if (error) return error

  try {
    const { url: backendUrl, error: urlError } = resolvePythonUrl(PYTHON_CONFIG.ENDPOINTS.ESG_CUSTOMERS)
    if (urlError) return urlError

    const { response, data: raw } = await pythonFetch(`${backendUrl}?limit=500`, {
      method: 'GET',
      timeoutMs: 30_000,
    })

    if (!response.ok || !Array.isArray(raw)) {
      return jsonError(
        response.ok ? 502 : response.status,
        raw?.detail ?? `고객사 목록 조회 실패 (${response.status})`,
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
    return jsonError(
      500,
      'ESG 고객사 목록 프록시 처리 중 오류가 발생했습니다.',
      error?.message ?? 'Unknown error',
    )
  }
}
