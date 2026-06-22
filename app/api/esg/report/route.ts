import { NextRequest, NextResponse } from 'next/server'
import { getPythonUrl, PYTHON_CONFIG } from '@/config/environment'
import { getRouteSession, getScopedCustomerId, isAdminSession } from '@/app/services/util/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/**
 * ESG 보고서(xlsx) 생성 프록시.
 * 백엔드 POST /api/esg/report 는 customer_name(이름)으로 식별하고 무인증이므로,
 * BFF에서 테넌트를 강제한다: 비관리자는 본인 회사(세션 name)로 고정, 관리자만 요청 customer_name 사용.
 * 성공 시 백엔드의 xlsx 바이너리를 그대로(Content-Disposition 포함) 통과시킨다.
 */
export async function POST(request: NextRequest) {
  const session = await getRouteSession(request)
  if (!session) {
    return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({} as Record<string, any>))

    // 테넌트 가드: 비관리자는 본인 회사(customer_name)로 강제
    let customerName = String(body?.customer_name ?? '').trim()
    if (!isAdminSession(session)) {
      const ownName = String(session?.name ?? '').trim()
      if (!ownName) {
        return NextResponse.json(
          { success: false, message: '세션에 회사 정보가 없습니다. 다시 로그인해주세요.' },
          { status: 403 },
        )
      }
      customerName = ownName
    }
    if (!customerName) {
      return NextResponse.json({ success: false, message: '대상 고객사를 선택해주세요.' }, { status: 400 })
    }

    const periodStart = String(body?.period_start ?? '').trim()
    const periodEnd = String(body?.period_end ?? '').trim()
    if (!periodStart || !periodEnd) {
      return NextResponse.json({ success: false, message: '보고서 기간을 입력해주세요.' }, { status: 400 })
    }
    if (periodEnd < periodStart) {
      return NextResponse.json({ success: false, message: '종료일은 시작일 이후여야 합니다.' }, { status: 400 })
    }

    const payload: Record<string, any> = {
      customer_name: customerName,
      period_start: periodStart,
      period_end: periodEnd,
      data_source:
        typeof body?.data_source === 'string' && body.data_source ? body.data_source : 'auto',
    }
    const kwPrice = Number(body?.kw_price_won)
    if (body?.kw_price_won !== undefined && body?.kw_price_won !== null && body?.kw_price_won !== '' && Number.isFinite(kwPrice) && kwPrice >= 0) {
      payload.kw_price_won = kwPrice
    }
    const baseline = Number(body?.baseline_total_kwh)
    if (body?.baseline_total_kwh !== undefined && body?.baseline_total_kwh !== null && body?.baseline_total_kwh !== '' && Number.isFinite(baseline) && baseline >= 0) {
      payload.baseline_total_kwh = baseline
    }

    const backendUrl = getPythonUrl(PYTHON_CONFIG.ENDPOINTS.ESG_REPORT)
    if (!backendUrl) {
      return NextResponse.json(
        { success: false, message: 'Python API URL이 설정되지 않았습니다. (.env 확인 필요)' },
        { status: 500 },
      )
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120_000)
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { success: false, message: err?.detail ?? `ESG 보고서 생성 실패 (${response.status})` },
        { status: response.status },
      )
    }

    const buf = await response.arrayBuffer()
    const disposition =
      response.headers.get('content-disposition') ??
      `attachment; filename="ESG_report_${periodStart}_${periodEnd}.xlsx"`

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': XLSX_MIME,
        'Content-Disposition': disposition,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    const aborted = error?.name === 'AbortError'
    return NextResponse.json(
      {
        success: false,
        message: aborted
          ? 'ESG 보고서 생성 시간이 초과되었습니다.'
          : 'ESG 보고서 프록시 처리 중 오류가 발생했습니다.',
        details: error?.message ?? 'Unknown error',
      },
      { status: aborted ? 504 : 500 },
    )
  }
}
