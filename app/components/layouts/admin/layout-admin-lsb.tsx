'use client'

import { useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAtom, useAtomValue } from 'jotai'

import mmc from '../../style/resources/css/member.module.css'
import imag from '../../style/resources/css/image.module.css'
import {
  AtomSideMenuItem,
  type AtomSideMenuItemType,
} from '@/app/models/atoms/atom-side-menu'
import { SideMenuConfigAdmin } from '@/app/models/atoms/atom-menu-config'
import { SideMenuConfigMember } from '@/app/models/atoms/atom-menu-config-member'
import { userInfoAtom } from '@/app/models/atoms/atom-user-info'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분 : 관리자권한 - Layout
 * 04. 설명     : 관리자 좌측 사이드바(LSB) - 로그인 role 기반 메뉴 노출
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

type LayoutAdminLsbProps = {
  isMobileOpen?: boolean
  onClose?: () => void
}

export default function LayoutAdminLsb({
  isMobileOpen = false,
  onClose,
}: LayoutAdminLsbProps) {
  /******************** 변수 영역 ********************/
  const pathname = usePathname()
  const router = useRouter()
  const session = useAtomValue(userInfoAtom)
  const [, setSelected] = useAtom(AtomSideMenuItem)

  const lastRoleRef = useRef<string>('')

  /******************** 함수 영역 ********************/
  useEffect(() => {
    const rawRole = (session?.role ?? '').trim().toLowerCase()
    if (rawRole) lastRoleRef.current = rawRole
  }, [session?.role])

  const resolvedRole = useMemo(() => {
    const rawRole = (session?.role ?? '').trim().toLowerCase()
    return rawRole || lastRoleRef.current
  }, [session?.role])

  const isAdminRole =
    resolvedRole === 'admin' || resolvedRole.includes('admin')

  const menuSections = useMemo(
    () =>
      isAdminRole
        ? [...SideMenuConfigAdmin, ...SideMenuConfigMember]
        : SideMenuConfigMember,
    [isAdminRole],
  )

  const normalizePath = (value?: string | null) => {
    if (!value) return '/'
    const normalized = value.toLowerCase().replace(/\/+$/, '')
    return normalized || '/'
  }

  const isActive = (path: string) => {
    const current = normalizePath(pathname)
    const target = normalizePath(path)
    return current === target || current.startsWith(`${target}/`)
  }

  const handleSelect = (item: AtomSideMenuItemType) => {
    setSelected(item)
    if (!isActive(item.path)) router.push(item.path)
    onClose?.()
  }

  /******************** 수행 영역 ********************/
  return (
    <aside
      id="admin-lsb"
      className={`${mmc.lsb} ${isMobileOpen ? mmc.lsbMobileOpen : ''}`}
    >
      <div className={mmc.lsb_brand}>
        <div className={imag.company_logo} aria-label="케이와이 로고" />
        <div
          className={`${mmc.lsb_brand_texts} ${isMobileOpen ? mmc.lsb_brand_texts_compact : ''}`}
        >
          <strong>(주)케이와이</strong>
          <span>케이와이 AI Agent</span>
        </div>

        <button
          type="button"
          className={mmc.lsbCloseBtn}
          onClick={onClose}
          aria-label="사이드바 닫기"
        >
          ×
        </button>
      </div>

      <div className={mmc.lsb_inner}>
        {menuSections.map((section) => (
          <section key={section.title} className={mmc.lsb_group}>
            <div className={mmc.lsb_section_title}>{section.title}</div>

            <nav className={mmc.lsb_nav} aria-label={`${section.title} 메뉴`}>
              {section.items.map((item) => {
                const active = isActive(item.path)

                return (
                  <button
                    key={item.menuId}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`${mmc.lsb_item} ${active ? mmc.lsb_item_active : ''}`}
                    aria-current={active ? 'page' : undefined}
                    aria-label={item.menuNm}
                    title={item.menuNm}
                  >
                    <span className={mmc.lsb_item_dot} aria-hidden="true" />
                    <span className={mmc.lsb_item_label}>{item.menuNm}</span>
                  </button>
                )
              })}
            </nav>
          </section>
        ))}
      </div>
    </aside>
  )
}
