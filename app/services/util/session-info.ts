'use client'

/*
 * 클라이언트 세션 정보 단일 소스.
 *
 * 멤버 페이지(DetailMonitoring/PeakShaving/simulation/EsgReport)들이 각자 복붙하던
 * getSessionUserInfo(localStorage 'session.userInfo' 파싱 + role/isAdmin 파생)를 한 곳으로 통합.
 * 키 우선순위·isAdmin 판정·SSR 가드 로직은 기존과 100% 동일(동작보존). customerName 까지 포함해
 * 반환하므로 {customerId, role, isAdmin}만 쓰던 페이지는 그대로, EsgReport는 customerName 도 사용.
 *
 * session.userInfo 는 로그인 후 Jotai userInfoAtom(atomWithStorage)이 localStorage 에 영속한 값.
 */

export type SessionUserInfo = {
  customerId: string
  customerName: string
  role: string
  isAdmin: boolean
}

const EMPTY: SessionUserInfo = { customerId: '', customerName: '', role: '', isAdmin: false }

export const getSessionUserInfo = (): SessionUserInfo => {
  if (typeof window === 'undefined') {
    return EMPTY
  }

  const raw = localStorage.getItem('session.userInfo')
  if (!raw) {
    return EMPTY
  }

  try {
    const parsed = JSON.parse(raw) as {
      customer_id?: string
      customerId?: string
      name?: string
      customer_name?: string
      role?: string
      customer_auth?: string
      auth?: string
    }

    const customerId = String(parsed.customer_id ?? parsed.customerId ?? '').trim()
    const customerName = String(parsed.name ?? parsed.customer_name ?? '').trim()
    const roleRaw = String(parsed.role ?? parsed.customer_auth ?? parsed.auth ?? '')
      .trim()
      .toLowerCase()

    const isAdmin = roleRaw === 'admin' || roleRaw.includes('admin') || roleRaw.includes('관리')

    return { customerId, customerName, role: roleRaw, isAdmin }
  } catch {
    return EMPTY
  }
}
