import styled from 'styled-components';
import btnModalPopupClose from '../../../resources/imgs/close.png';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 모달
 * 03. 설명     : 모달 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

export const PopupMask = styled.div`
  z-index: 10;
  position: fixed;
  display: flex;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  flex-direction: row;
  justify-content: cener;
  aligh-items; center;
  background-color: rgba(0,0,0,0.1);
  font-size: 13px;
`;

export const PopupBox = styled.div`
  overflow: hidden;
  border-radius: 5px;
  background-color: #ffffff;
`;

export const PopupHeader = styled.div`
  overflow: hidden;
  border-radius: 5px 5px 0 0;
  background-color: #747474;
  font-weight: 500;
  font-size: 13px;
  cursor: move;
`;

export const PopupHeaderLeft = styled.div`
  float: left;
  width: 75%;
  padding: 10px;
  color: #ffffff;
`;

export const PopupHeaderRight = styled.div`
  float: right;
  width: 15%;
  padding: 10px;
  text-align: right;
`;

export const PopupCloseBtn = styled.div`
  display: inline-block;
  float: right;
  width: 15px;
  height: 15px;
  background: url($(btnModalPopupClose)) no-repeat left center;
  cursor: pointer;
`;

export const PopupBody = styled.div`
  overflow-y: auto;
  padding: 10px;
  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  &::webkit-scrollbar-thumb {
    backgroun: #cccccc;
    border-radius: 2px;
  }
  &::webkit-scrollbar-track {
    background: #ffffff;
  }
`;
