/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Common
 * 03. 설명     : 다국어 스위처 스타일 (styled-components)
 * 04. 작성일자  : 2025.08.25
 * 05. 작성자   : 이우창
 */

import styled, { css } from 'styled-components'

/** 외곽 캡슐 컨테이너 */
export const CommonSwitcherSegment = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border: 1px solid #d6e1f0; /* 라이트 블루 아웃라인 */
  border-radius: 9999px;
  background: #ffffff;
`

/** 각 탭 버튼 */
export const CommonSwitcherItem = styled.button<{ $active?: boolean }>`
  position: relative;
  min-width: 50px;     /* 이미지 느낌 맞춤 */
  height: 40px;
  padding: 0 18px;
  border: 0;
  background: transparent;
  border-radius: 9999px;

  /* 요청하신 텍스트 스타일 */
  font-family: Pretendard;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;

  color: #2b2f38;
  cursor: pointer;

  /* 형제 간 간격 + 세로 구분선 */
  &:not(:first-child) {
    margin-left: 12px;
  }
  &:not(:first-child)::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 6px;
    bottom: 6px;
    width: 1px;
    background: #dee1eb;
    border-radius: 1px;
  }

  /* 활성 탭 */
  ${({ $active }) =>
    $active &&
    css`
      background: #8b7bff;
      color: #ffffff;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15);
    `}
`