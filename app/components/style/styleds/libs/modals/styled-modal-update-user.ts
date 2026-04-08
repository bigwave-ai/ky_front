'use client';

import styled, { css } from 'styled-components';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분 : 모든권한 - 스타일 - 고객사 정보변경 모달
 * 04. 설명     : 고객사 정보변경 모달 스타일 제공
 * 05. 작성일자 : 2026.03.31
 * 06. 작성자   : 이우창
 */

type InputProps = {
  $error?: boolean;
};

/** 오버레이 */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 21000;
`;

/** 모달 래퍼 */
export const ModalWrap = styled.div`
  position: fixed;
  z-index: 21001;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(620px, calc(100vw - 28px));
  max-height: 92vh;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 14px 36px rgba(28, 50, 87, 0.18);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: min(620px, calc(100vw - 20px));
    max-height: 94vh;
  }
`;

/** 상단 헤더 */
export const ModalHead = styled.div`
  position: relative;
  padding: 16px 18px 14px;
  background: linear-gradient(90deg, #b3b6f0 0%, #efb8bf 100%);
  display: grid;
  justify-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    padding: 14px 12px 12px;
  }
`;

/** 헤더 배지 */
export const HeadBadge = styled.div`
  height: 26px;
  padding: 4px 16px;
  border-radius: 999px;
  background: #32489f;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  letter-spacing: -0.2px;
`;

/** 헤더 타이틀 */
export const HeadTitle = styled.h3`
  margin: 0;
  color: #3e499c;
  text-align: center;
  font-family: Pretendard;
  font-size: 28px;
  font-style: normal;
  font-weight: 700;
  line-height: 48px;
  letter-spacing: -1.6px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

/** 닫기 버튼 */
export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: #243a87;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

/** 본문(스크롤 영역) */
export const ModalBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 12px;

  @media (max-width: 768px) {
    padding: 14px 16px 10px;
  }
`;

/** 본문 타이틀 */
export const BodyTitle = styled.h2`
  margin: 0;
  color: #000;
  text-align: center;
  font-family: Heebo;
  font-size: 32px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -1.6px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

/** 본문 설명 */
export const BodyDescription = styled.p`
  margin: 10px 0 18px;
  text-align: center;
  color: #8f8f92;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.3px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

/** 폼 */
export const Form = styled.div`
  display: grid;
  gap: 20px;
`;

/** 필드 */
export const Field = styled.div`
  display: grid;
  gap: 6px;
`;

/** 라벨 */
export const Label = styled.label`
  color: #2f2f34;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.3px;

  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

/** 입력 */
export const Input = styled.input<InputProps>`
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #b5d8f6;
  background: #f8fbff;
  color: #1f2a37;
  font-size: 15px;
  font-weight: 500;
  padding: 0 12px;
  box-sizing: border-box;

  &::placeholder {
    color: #b8bec7;
  }

  &:focus {
    outline: none;
    border-color: #72aee0;
    box-shadow: 0 0 0 2px rgba(68, 141, 200, 0.15);
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }

  ${({ $error }) =>
    $error &&
    css`
      border-color: #e05050;
      box-shadow: 0 0 0 2px rgba(224, 80, 80, 0.12);
      background: #fffafa;
    `}
`;

/** 에러 텍스트 */
export const ErrorText = styled.div`
  color: #e54848;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.2px;
`;

/** 하단 버튼 영역 */
export const ModalFooter = styled.div`
  flex-shrink: 0;
  padding: 12px 24px 16px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media (max-width: 768px) {
    padding: 10px 16px 14px;
  }
`;

export const FooterRightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ActionButton = styled.button`
  height: 44px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.4px;
  cursor: pointer;
  border: 0;
  padding: 0 36px;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: 768px) {
    height: 42px;
    font-size: 18px;
    padding: 0 22px;
  }
`;

export const DeleteButton = styled(ActionButton)`
  background: #f56565;
  color: #fff;
`;

export const ConfirmButton = styled(ActionButton)`
  background: linear-gradient(180deg, #1d5dab 0%, #15529c 100%);
  color: #fff;
`;

export const CancelButton = styled(ActionButton)`
  background: #fff;
  color: #15529c;
  border: 1px solid #2f74c0;
`;

/** 하단 공통 에러 */
export const ErrorSummary = styled.div`
  padding: 0 24px 14px;
  color: #e54848;
  font-size: 12px;
  font-weight: 700;
  text-align: center;

  @media (max-width: 768px) {
    padding: 0 16px 12px;
  }
`;
