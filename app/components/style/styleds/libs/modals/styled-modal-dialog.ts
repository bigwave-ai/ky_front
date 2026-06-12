import styled from 'styled-components';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 모달
 * 03. 설명     : 모달 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

export const DialogMask = styled.div`
  z-index: 10;
  position: fixed;
  display: flex;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.1);
  font-size: 13px;
`;
export const DialogBox = styled.div`
  overflow: hidden;
  border-radius: 5px;
  background-color: #ffffff;
`;

export const DialogHeader = styled.div`
  min-width: 200px;
  max-width: 250px;
  line-height: 1.5;
  padding: 10px;
  background-color: #747474;
  font-weight: 500;
  font-size: 13px;
  color: #ffffff;
  cursor: move;
`;

export const DialogContents = styled.div`
  min-width: 200px;
  max-width: 250px;
  min-height: 50px;
  line-height: 1.5;
  padding: 10px;
  color: #535353;
`;

export const DialogFooter = styled.div`
  min-width: 200px;
  max-width: 250px;
  line-height: 1.5;
  padding: 10px;
  text-align: right;
`;

export const DialogButton = styled.div`
  display: inline-block;
  margin-left: 8px;
  padding: 3px 8px;
  border: 1px solid #535353;
  border-radius: 3px;
  background-color: #e2e2e2;
  font-weight: 500;
  font-size: 13px;
  color: #535353;
  cursor: pointer;
  &:hover {
    background-color: #535353;
    color: #ffffff;
  }
`;
