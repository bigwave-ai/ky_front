'use client'

import mmc from '../../style/resources/css/member.module.css'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 헤더 Context
 * 04. 설명     : 헤더 breadcrumb 렌더링 (CSS Module 기반)
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

interface HeaderAdminBreadcrumbProps {
  breadcrumb: string[]
}

const HeaderAdminBreadcrumb = ({ breadcrumb }: HeaderAdminBreadcrumbProps) => {
  return (
    <div className={mmc.header_breadcrumb}>
      {breadcrumb.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className={
            idx < breadcrumb.length - 1
              ? mmc.header_breadcrumb_prev
              : mmc.header_breadcrumb_current
          }
        >
          {item}
          {idx < breadcrumb.length - 1 && (
            <span className={mmc.header_breadcrumb_separator}>&gt;</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default HeaderAdminBreadcrumb
