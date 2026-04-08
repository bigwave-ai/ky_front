import mmc from '../../style/resources/css/member.module.css'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Server Component
 * 03. 업무구분 : 관리자권한 - Layout
 * 04. 설명     : 관리자 레이아웃 컨텐츠 컴포넌트
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

const LayoutAdminContents = ({ children }: { children: React.ReactNode }) => {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return <div className={mmc.contents_container}>{children}</div>
}

export default LayoutAdminContents
