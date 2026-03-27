import styled from 'styled-components';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 프로그레스
 * 03. 설명     : 프로그레스 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

export const ProgressMask = styled.div`
  z-index: 4;
  position: fixed;
  top: calc(50% - 20px);
  left: calc(50% - 20px);
  width: 100%;
  height: 100%;
`;
