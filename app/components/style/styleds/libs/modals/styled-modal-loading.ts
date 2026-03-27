'use client';

import styled, { keyframes } from 'styled-components';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 로딩중 모달
 * 03. 설명     : 모달 스타일 제공
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  z-index: 999999;
`;

export const ModalWrap = styled.div`
  position: fixed;
  z-index: 999999;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(460px, 92vw);
  padding: 28px 28px 24px;
  border-radius: 10px;
  border: 1px solid var(--_input_, #C3C4C6);
  background: linear-gradient(335deg, #cfe8ff 0%, #FFF 42.31%);
  box-shadow: 0 10px 40px rgba(0,0,0,0.12);
  text-align: center;
`;

const spin = keyframes`
  0%   { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
`;

export const Spinner = styled.div`
  width: 54px;
  height: 54px;
  margin: 8px auto 14px;
  border-radius: 50%;
  border: 6px solid #cfe8ff;   
  border-top-color: #1e73ff;   
  animation: ${spin} 1s linear infinite;
`;

export const Message = styled.div`
  margin: 6px 0 4px;
  color: #312E37;
  text-align: center;
  font-family: Heebo;
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
  letter-spacing: -0.6px;
`;

export const SubMessage = styled.div`
  margin-top: 2px;
  color: #6b6b6b;
  text-align: center;
  font-family: Heebo;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.2px;
  white-space: pre-line;
`;
