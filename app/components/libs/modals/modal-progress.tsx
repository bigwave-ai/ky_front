import { CircularProgress } from '@mui/material';

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 프로그레스바
 * 03. 설명     : 프로그레스바 기능 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

const ModalProgress = () => {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 'calc(50% - 20px)',
          left: 'calc(50% - 20px)',
        }}
      >
        <CircularProgress></CircularProgress>
      </div>
    </>
  );
};

export default ModalProgress;
