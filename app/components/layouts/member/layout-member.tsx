'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from '@/app/services/i18n/LanguageProvider'
import LayoutMemberContents from './layout-member-contents'
import LayoutMemberHeader from './layout-member-header'
import LayoutMemberLsb from './layout-member-lsb'
import mmc from '../../style/resources/css/member.module.css'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분 : 멤버 권한 - Layout
 * 04. 설명     : 멤버 레이아웃 컴포넌트 (모바일 LSB 토글 포함)
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

const MOBILE_BREAKPOINT = 1200

const LayoutMember = ({ children }: { children: React.ReactNode }) => {
  /******************** 변수 영역 ********************/
  const { t } = useTranslation()
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
          aria-label={t('사이드바 닫기 오버레이')}
        />
      )}

      <LayoutMemberLsb isMobileOpen={isMobile && isMobileOpen} onClose={closeMobileMenu} />

      <div className={mmc.total_content}>
        <LayoutMemberHeader
          showMenuButton={isMobile && !isMobileOpen}
          onOpenMenu={openMobileMenu}
        />
        <LayoutMemberContents>{children}</LayoutMemberContents>
      </div>
    </div>
  )
}

export default LayoutMember
