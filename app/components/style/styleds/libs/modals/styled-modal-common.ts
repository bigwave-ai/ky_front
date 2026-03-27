'use client';

import styled from 'styled-components';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 일반 메시지 모달
 * 03. 설명     : 모달 스타일 제공
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */


/* 오버레이 */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 20000;
`;

/* 모달 래퍼 (화이트 카드 + 은은한 하단 그라데이션) */
export const ModalWrap = styled.div`
  position: fixed;
  z-index: 20001;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(640px, 92vw);
  padding: 28px 28px 24px;
  border-radius: 12px;
  border: 1px solid #E7ECF3;
  background:
    radial-gradient(120% 60% at 90% 100%, #EAFBF6 0%, rgba(234,251,246,0) 60%) /* mint glow */,
    #FFF;
  box-shadow: 0 14px 48px rgba(0,0,0,0.14);
  text-align: center;
`;

/* 상단 로고 */
export const LogoWrap = styled.div`
  position: relative;
  width: 180px;
  height: 32px;
  margin: 6px auto 18px;
`;

/* 제목 (블루) */
export const Title = styled.h3`
  margin: 0 0 12px;
  color: #1E5EAA;                 /* K-water Blue 톤 */
  text-align: center;
  font-family: Heebo, system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', sans-serif;
  font-size: 28px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -1.6px;
`;

/* 상세 문구 */
export const Detail = styled.p`
  margin: 0 0 22px;
  color: #585858;
  text-align: center;
  font-family: Heebo, 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.6px;
  white-space: pre-line;
`;

/* 버튼 영역 */
export const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
`;

/* 공통 버튼 */
export const Btn = styled.button`
  min-width: 120px;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  font-family: Heebo, 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 40px;
`;

/* 기본(확인) – 파란 버튼 */
export const BtnPrimary = styled(Btn)`
  background: #034FA4;
  color: #FFF;
  border: none;
`;

/* 서브(닫기) – 화이트 아웃라인 */
export const BtnGhost = styled(Btn)`
  background: #FFF;
  color: #034FA4;
  border: 1px solid #034FA4;
`;
