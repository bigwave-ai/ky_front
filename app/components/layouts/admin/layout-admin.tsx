import LayoutAdminContents from './layout-admin-contents';
import LayoutAdminHeader from './layout-admin-header';
import LayoutAdminLsb from './layout-admin-lsb'
import mmc from '../../style/resources/css/admin.module.css'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Server Component
 * 03. 업무구분  : 관리자 권한 - Layout
 * 03. 설명     : 관리자 레이아웃 컴포넌트
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이우창
 */

const LayoutAdmin= ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={mmc.total}>
      <LayoutAdminLsb />
      <div className={mmc.total_content}>
        <LayoutAdminHeader/>
        <LayoutAdminContents>{children}</LayoutAdminContents>
      </div>
    </div>
  )
}

export default LayoutAdmin