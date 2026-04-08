import LayoutAdmin from '../../components/layouts/admin/layout-admin'

/*
 * 01. 구분     : View 컴포넌트
 * 02. 타입     : Server Component
 * 03. 업무구분 : 관리자 권한 - admin layout
 * 04. 설명     : 관리자 전용 레이아웃 래핑
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return <LayoutAdmin>{children}</LayoutAdmin>
}
