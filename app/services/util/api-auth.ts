import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyJwtToken } from './jwt'

/*
 * 01. 구분     : Service
 * 02. 타입     : 공용 (Server)
 * 03. 업무구분 : 모든권한 - API 인증
 * 04. 설명     : API Route 공용 세션(JWT 쿠키) 검증 및 권한 확인 유틸
 * 05. 작성일자 : 2026.06.12
 * 06. 작성자   : Claude
 */

/** 세션 쿠키 이름 (signin.ts / middleware.ts와 동일해야 함) */
export const SESSION_COOKIE = 'session-Info'

export type SessionPayload = Record<string, any>

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * JWT payload에서 권한 문자열 추출
 * - 로그인 API/기존 토큰 형태 차이를 고려해 여러 key를 순서대로 확인 (middleware.ts와 동일 규칙)
 */
function resolveAuthFromPayload(payload: SessionPayload): string {
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

/** 관리자 권한인지 판정 (CUSTOMER_AUTH = "admin" 기준 + 호환, middleware.ts와 동일 규칙) */
export function isAdminSession(payload: SessionPayload): boolean {
  const rawAuth = resolveAuthFromPayload(payload)
  if (!rawAuth) return false

  const lower = rawAuth.toLowerCase().trim()
  if (lower === 'admin' || lower.includes('admin')) return true
  if (rawAuth.includes('관리자')) return true

  return false
}

/** Pages Router API 요청의 세션 쿠키를 검증하고 payload 반환 (실패 시 null) */
export async function getApiSession(req: NextApiRequest): Promise<SessionPayload | null> {
  const token = req.cookies?.[SESSION_COOKIE] ?? ''
  if (!token) return null
  return await verifyJwtToken(token)
}

/** App Router(route.ts) 요청의 세션 쿠키를 검증하고 payload 반환 (실패 시 null) */
export async function getRouteSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value ?? ''
  if (!token) return null
  return await verifyJwtToken(token)
}

export type AccessResult = { ok: true } | { ok: false; status: number; message: string }

/**
 * 장비 단위 소유권 검증 (IDOR 방지)
 * - 관리자: 모든 장비 허용
 * - 비관리자: 세션 customer_id가 소유한 장비만 허용
 * 호출 측에서 result.ok가 false면 result.status/message로 응답하면 된다.
 */
export async function canAccessDevice(
  session: SessionPayload,
  deviceId: string,
): Promise<AccessResult> {
  if (isAdminSession(session)) return { ok: true }

  const sessionCustomerId = String(session.customer_id ?? '').trim()
  if (!sessionCustomerId) {
    return { ok: false, status: 403, message: '세션에 고객사 정보가 없습니다. 다시 로그인해주세요.' }
  }

  const device = await prisma.tB_DEVICE.findUnique({
    where: { DEVICE_ID: deviceId },
    select: { CUSTOMER_ID: true },
  })

  if (!device) {
    return { ok: false, status: 404, message: '장비를 찾을 수 없습니다.' }
  }
  if (String(device.CUSTOMER_ID ?? '') !== sessionCustomerId) {
    return { ok: false, status: 403, message: '본인 고객사의 장비만 접근할 수 있습니다.' }
  }
  return { ok: true }
}

/**
 * 세션이 소유한 고객사 ID 반환 (비관리자 테넌트 스코프 강제용)
 * - 관리자: null (제약 없음)
 * - 비관리자: 세션 customer_id (없으면 빈 문자열)
 */
export function getScopedCustomerId(session: SessionPayload): string | null {
  if (isAdminSession(session)) return null
  return String(session.customer_id ?? '').trim()
}

/**
 * 로그인 세션 필수 가드 (Pages Router)
 * - 유효한 세션이면 payload 반환, 아니면 401 응답 후 null 반환
 */
export async function requireSession(
  req: NextApiRequest,
  res: NextApiResponse<any>,
): Promise<SessionPayload | null> {
  const session = await getApiSession(req)
  if (!session) {
    res.status(401).json({ success: false, message: '로그인이 필요합니다.' })
    return null
  }
  return session
}

/**
 * 관리자 세션 필수 가드 (Pages Router)
 * - 관리자 세션이면 payload 반환
 * - 비로그인 401 / 비관리자 403 응답 후 null 반환
 */
export async function requireAdminSession(
  req: NextApiRequest,
  res: NextApiResponse<any>,
): Promise<SessionPayload | null> {
  const session = await getApiSession(req)
  if (!session) {
    res.status(401).json({ success: false, message: '로그인이 필요합니다.' })
    return null
  }
  if (!isAdminSession(session)) {
    res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' })
    return null
  }
  return session
}
