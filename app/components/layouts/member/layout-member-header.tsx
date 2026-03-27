'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAtomValue } from 'jotai'

import HeaderAdminBreadcrumb from '../../libs/header/header-breadcrumb'
import HeaderUserModal from '../../libs/header/header-user-modal'
import mmc from '../../style/resources/css/member.module.css'
import { userInfoAtom } from '@/app/models/atoms/atom-user-info'
import { SideMenuConfigAdmin } from '@/app/models/atoms/atom-menu-config'
import { SideMenuConfigMember } from '@/app/models/atoms/atom-menu-config-member'
import type { AtomSideMenuItemType } from '@/app/models/atoms/atom-side-menu'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분 : 멤버권한 - Header
 * 04. 설명     : 메뉴 config 기반 경로 타이틀/인사 영역 렌더링
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

interface Props {
  showMenuButton?: boolean
  onOpenMenu?: () => void
}

const normalizePath = (value?: string | null) => {
  if (!value) return '/'
  const normalized = value.toLowerCase().replace(/\/+$/, '')
  return normalized || '/'
}

const resolveTitleByPath = (
  pathname: string,
  menuItems: AtomSideMenuItemType[],
): string => {
  const current = normalizePath(pathname)

  const matched = menuItems
    .filter((item) => {
      const target = normalizePath(item.path)
      return current === target || current.startsWith(`${target}/`)
    })
    .sort((a, b) => normalizePath(b.path).length - normalizePath(a.path).length)[0]

  return matched?.menuNm ?? ''
}

export default function LayoutMemberHeader({
  showMenuButton = false,
  onOpenMenu,
}: Props) {
  /******************** 변수 영역 ********************/
  const pathname = usePathname() ?? '/'
  const session = useAtomValue(userInfoAtom)

  const [isMounted, setIsMounted] = useState(false)
  const lastUserNameRef = useRef<string>('')

  const allMenuItems = useMemo(
    () =>
      [...SideMenuConfigAdmin, ...SideMenuConfigMember].flatMap(
        (section) => section.items,
      ),
    [],
  )

  const headerTitle = useMemo(
    () => resolveTitleByPath(pathname, allMenuItems),
    [pathname, allMenuItems],
  )

  const breadcrumb = useMemo(
    () => (headerTitle ? [headerTitle] : []),
    [headerTitle],
  )

  /******************** 함수 영역 ********************/
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const rawName =
      (session?.name ?? '').trim() ||
      (session?.user_id ?? '').trim()

    if (rawName) {
      lastUserNameRef.current = rawName.endsWith('님')
        ? rawName.slice(0, -1)
        : rawName
    }
  }, [session?.name, session?.user_id])

  const displayName = useMemo(() => {
    if (!isMounted) return '\u00A0'

    const rawName =
      (session?.name ?? '').trim() ||
      (session?.user_id ?? '').trim()

    if (rawName) {
      return rawName.endsWith('님') ? rawName.slice(0, -1) : rawName
    }

    return lastUserNameRef.current || '\u00A0'
  }, [isMounted, session?.name, session?.user_id])

  const hasUserName = displayName !== '\u00A0'

  /******************** 수행 영역 ********************/
  return (
    <div className={mmc.header}>
      <div className={mmc.header_left}>
        {showMenuButton && onOpenMenu && (
          <button
            type="button"
            className={mmc.header_menu_btn}
            onClick={onOpenMenu}
            aria-label="사이드바 열기"
          >
            <span className={mmc.header_menu_icon} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>
        )}

        <HeaderAdminBreadcrumb breadcrumb={breadcrumb} />
      </div>

      <div className={mmc.header_right}>
        <span className={mmc.header_username}>
          {hasUserName ? `${displayName}님` : '\u00A0'}
        </span>
        <span className={mmc.header_text}>
          {hasUserName ? '안녕하세요' : '\u00A0'}
        </span>
        <HeaderUserModal />
      </div>
    </div>
  )
}
