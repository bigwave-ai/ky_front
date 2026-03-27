import amc from '../../style/resources/css/admin.module.css';
import imag from '../../style/resources/css/image.module.css';

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Server Component
 * 03. 업무구분  : 관리자권한 - Layout
 * 03. 설명     : 관리자 레이아웃 헤더 컴포넌트
 * 04. 작성일자  : 2025.08.25
 * 05. 작성자   : 이우창
 */

const LayoutAdminHeader = () => {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/

  return (
    <>
      <div className={amc.header}>
        <div className={imag.logo_dip}/>
      </div>
    </>
  );
};

export default LayoutAdminHeader;
