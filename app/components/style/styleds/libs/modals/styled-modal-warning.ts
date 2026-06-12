'use client';

import styled from 'styled-components';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 경고 메시지 모달
 * 03. 설명     : 모달 스타일 제공
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */

/** 오버레이 */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.25);
  z-index: 22000;  // 기존 20000
`;

/** 모달 래퍼 */
export const ModalWrap = styled.div`
  position: fixed;
  z-index: 22001;  // 기존 20001
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(640px, 92vw);
  padding: 28px 28px 24px;
  border-radius: 10px;
  border: 1px solid var(--_input_, #C3C4C6);
  background: linear-gradient(335deg, #FFF0EA 0%, #FFF 42.31%);
  box-shadow: 0 10px 40px rgba(0,0,0,0.12);
  text-align: center;
`;

/** 경고 아이콘 */
export const WarnImage = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  margin: 8px auto 12px;
`;

/** 제목 */
export const Title = styled.h3`
  margin: 8px 0 14px;
  color: #FF4E4E;
  text-align: center;
  font-family: Heebo, system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', sans-serif;
  font-size: 30px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -3px;
`;

/** 상세 문구 */
export const Detail = styled.p`
  margin: 0 0 24px;
  color: #312E37;
  text-align: center;
  font-family: Heebo;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -2px;
  white-space: pre-line;
`;

/** 버튼 영역 */
export const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`;

/** 공통 버튼 */
export const Btn = styled.button`
  min-width: 120px;
  padding: 12px 18px;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  font-family: Heebo;
  font-size: 16px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
`;

/** 확인 */
export const BtnConfirm = styled(Btn)`
  background: #D50A0A;
  color: #FFF;
  border: none;
`;

/** 취소 */
export const BtnCancel = styled(Btn)`
  background: #FFF;
  color: #D50A0A;
  border: 1px solid #D50A0A;
`;
