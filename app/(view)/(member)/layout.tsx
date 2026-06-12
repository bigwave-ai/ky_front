import LayoutMember from '../../components/layouts/member/layout-member'

/*
 * 01. 구분     : View 컴포넌트
 * 02. 타입     : Server Component
 * 03. 업무구분  : 멤버권한 - member layout
 * 03. 설명     : member layout
 * 04. 작성일자  : 2025.08.25
 * 05. 작성자   : 이우창
 */

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return (
    <>
      <LayoutMember>{children}</LayoutMember>
    </>
  );
}
