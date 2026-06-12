import mmc from '../../style/resources/css/member.module.css';

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Server Component
 * 03. 업무구분  : 멤버권한 - Layout
 * 03. 설명     : 멤버 레이아웃 컨텐츠 컴포넌트
 * 04. 작성일자  : 2025.08.27
 * 05. 작성자   : 이우창
 */

const LayoutMemberContents = ({children }: {children: React.ReactNode }) => {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return (
    <div className={mmc.contents_container}>{children}</div>
  );
};

export default LayoutMemberContents;
