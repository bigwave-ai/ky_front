// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyJwtToken } from './app/services/util/jwt'

/*
 * 01. 구분     : Middleware
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - Middleware
 * 04. 설명     : 관리자 전용 경로(IntegratedMonitoring/UserManagement) 접근 제어
 * 05. 작성일자  : 2025.10.29
 * 06. 작성자   : 이우창
 */

/** 세션 쿠키 이름 */
const SESSION_COOKIE = 'session-Info'

/**
 * 관리자 전용 경로
 * - 하위 경로도 포함되도록 prefix 매칭
 * - 경로 비교는 대소문자 이슈를 피하기 위해 소문자 기준으로 처리
 */
const ADMIN_ONLY_PREFIXES = ['/Integratedmonitoring', '/Usermanagement']

/** prefix 목록 검사 유틸 */
function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** 현재 요청 경로가 관리자 전용 경로인지 검사 */
function isAdminOnlyPath(pathname: string): boolean {
  const normalizedPath = pathname.toLowerCase()
  return startsWithAny(normalizedPath, ADMIN_ONLY_PREFIXES)
}

/**
 * JWT payload에서 권한 문자열 추출
 * - 로그인 API/기존 토큰 형태 차이를 고려해 여러 key를 순서대로 확인
 */
function resolveAuthFromPayload(payload: Record<string, any>): string {
  const candidates = [
    payload.auth,
    payload.CUSTOMER_AUTH,
    payload.customer_auth,
    payload.role,
    payload.ROLE,
    payload.user_role,
  ]

  for (const v of candidates) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** 관리자 권한인지 판정 (CUSTOMER_AUTH = "admin" 기준 + 호환) */
function isAdminAuth(rawAuth: string): boolean {
  if (!rawAuth) return false

  const lower = rawAuth.toLowerCase().trim()

  // 요청사항 기준: CUSTOMER_AUTH가 "admin"인 경우
  if (lower === 'admin' || lower.includes('admin')) return true

  // 과거 데이터 호환(한글 권한값)
  if (rawAuth.includes('관리자')) return true

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  /**
   * 1) 관리자 전용 경로가 아니면 전부 통과
   *    (요청사항: 나머지는 접근 가능)
   */
  if (!isAdminOnlyPath(pathname)) {
    return NextResponse.next()
  }

  /**
   * 2) 관리자 전용 경로 접근 시: 로그인 토큰 필요
   */
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? ''
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  /**
   * 3) JWT 검증
   *    - 만료/위조/손상 토큰이면 로그인 화면으로 이동
   */
  const payload = await verifyJwtToken(token)
  if (!payload || typeof payload !== 'object') {
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('error', 'session_expired')
    return NextResponse.redirect(url)
  }

  /**
   * 4) 권한 확인: admin만 허용
   *    - 비관리자면 접근 차단 후 일반 사용자 진입 페이지로 보냄
   */
  const rawAuth = resolveAuthFromPayload(payload)
  const isAdmin = isAdminAuth(rawAuth)

  if (!isAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/Simulation'
    url.searchParams.set('error', 'forbidden')
    return NextResponse.redirect(url)
  }

  /**
   * 5) 관리자면 요청 허용
   */
  return NextResponse.next()
}

/**
 * 정적 리소스/API 경로 제외
 */
export const config = {
  matcher:
    '/((?!_next/|api/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|pdf)$).*)',
}
