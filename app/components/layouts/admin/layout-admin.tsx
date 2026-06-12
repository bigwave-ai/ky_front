'use client'

import { useEffect, useState } from 'react'
import LayoutAdminContents from './layout-admin-contents'
import LayoutAdminHeader from './layout-admin-header'
import LayoutAdminLsb from './layout-admin-lsb'
import mmc from '../../style/resources/css/member.module.css'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분 : 관리자 권한 - Layout
 * 04. 설명     : 관리자 레이아웃 컴포넌트 (모바일 LSB 토글 포함)
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

const MOBILE_BREAKPOINT = 1200

const LayoutAdmin = ({ children }: { children: React.ReactNode }) => {
  /******************** 변수 영역 ********************/
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  /******************** 함수 영역 ********************/
  const closeMobileMenu = () => setIsMobileOpen(false)
  const openMobileMenu = () => setIsMobileOpen(true)

  /******************** 수행 영역 ********************/
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT
      setIsMobile(mobile)

      if (!mobile) setIsMobileOpen(false)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={mmc.total}>
      {isMobile && isMobileOpen && (
        <button
          type="button"
          className={mmc.mobileMenuOverlay}
          onClick={closeMobileMenu}
          aria-label="사이드바 닫기 오버레이"
        />
      )}

      <LayoutAdminLsb isMobileOpen={isMobile && isMobileOpen} onClose={closeMobileMenu} />

      <div className={mmc.total_content}>
        <LayoutAdminHeader
          showMenuButton={isMobile && !isMobileOpen}
          onOpenMenu={openMobileMenu}
        />
        <LayoutAdminContents>{children}</LayoutAdminContents>
      </div>
    </div>
  )
}

export default LayoutAdmin
