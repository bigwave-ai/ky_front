/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분 : 모든권한 - 스타일 - Charts Common
 * 04. 설명     : 공통 Bar Chart 스타일 (styled-components)
 * 05. 작성일자 : 2026.03.26
 * 06. 작성자   : 이우창
 */

import styled, { css } from 'styled-components'

type ChartValueProps = {
  $height: number
  $offsetPx: number
}

type ChartBarProps = {
  $height: number
  $pred?: boolean
}

/** Y축 + 차트 캔버스 프레임 */
export const ChartFrame = styled.div`
  width: 100%;
  min-width: 0;
  overflow: hidden;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 8px;
  padding-top: 10px;
  border-top: 0;

  @media (max-width: 1024px) {
    grid-template-columns: 50px minmax(0, 1fr);
    gap: 8px;
  }
`

/** Y축 레이블 컬럼 */
export const ChartYAxis = styled.div`
  height: 320px;
  padding: 24px 2px 22px 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  color: #5c6f87;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.2px;
  line-height: 1;

  @media (max-width: 1024px) {
    height: 286px;
    padding: 20px 2px 20px 0;
    font-size: 11px;
  }

  @media (max-width: 760px) {
    height: 260px;
    padding: 18px 2px 18px 0;
    font-size: 10px;
  }

  @media (max-width: 560px) {
    height: 228px;
    padding: 16px 2px 16px 0;
  }
`

/** Y축 눈금 텍스트 */
export const ChartTick = styled.span``

/** 차트 드로잉 캔버스 */
export const ChartCanvas = styled.div`
  position: relative;
  height: 320px;
  padding: 0 8px;
  min-width: 0;
  overflow: hidden;

  @media (max-width: 1024px) {
    height: 286px;
  }

  @media (max-width: 760px) {
    height: 260px;
  }

  @media (max-width: 560px) {
    height: 228px;
    padding: 0 4px;
  }
`

/** 그리드 라인 */
export const ChartGuides = styled.div`
  position: absolute;
  inset: 24px 8px 22px;
  border: 1px solid #d2d9e3;
  border-left: 0;
  background-image:
    repeating-linear-gradient(
      to top,
      rgba(195, 202, 214, 0.75) 0 1px,
      transparent 1px 10%
    ),
    linear-gradient(
      to right,
      transparent 24.9%,
      rgba(195, 202, 214, 0.75) 24.9% 25.1%,
      transparent 25.1% 49.9%,
      rgba(195, 202, 214, 0.75) 49.9% 50.1%,
      transparent 50.1% 74.9%,
      rgba(195, 202, 214, 0.75) 74.9% 75.1%,
      transparent 75.1%
    );
  pointer-events: none;

  @media (max-width: 1024px) {
    inset: 20px 6px 20px;
  }

  @media (max-width: 760px) {
    inset: 18px 6px 18px;
  }

  @media (max-width: 560px) {
    inset: 16px 4px 16px;
  }
`

/** 막대 그룹 */
export const ChartBars = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  min-width: 0;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 560px) {
    gap: 6px;
  }
`

/** 막대 1개 아이템 */
export const ChartBarItem = styled.div`
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto;
  align-items: stretch;
  justify-items: center;
  min-width: 0;
`

/** 막대 트랙 */
export const ChartTrack = styled.div`
  position: relative;
  width: 100%;
  max-width: 96px;
  height: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow: visible;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  @media (max-width: 1024px) {
    max-width: 78px;
  }

  @media (max-width: 760px) {
    max-width: 64px;
  }

  @media (max-width: 560px) {
    max-width: 50px;
  }
`


/** 막대 위 값 */

export const ChartValue = styled.span<ChartValueProps>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: ${({ $height, $offsetPx }) => `calc(${$height}% + ${$offsetPx}px)`};
  margin: 0;
  max-width: calc(100% + 20px);
  text-align: center;
  color: #1f1f1f;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.3px;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  z-index: 2;

  @media (max-width: 560px) {
    font-size: 11px;
  }
`
/** 실제 막대 */
export const ChartBar = styled.div<ChartBarProps>`
  width: 100%;
  max-width: 94px;
  min-height: 4px;
  height: ${({ $height }) => `${$height}%`};
  border-radius: 2px 2px 0 0;
  background: #c7c7ca;

  ${({ $pred }) =>
    $pred &&
    css`
      background: #7085e2;
    `}

  @media (max-width: 1024px) {
    max-width: 74px;
  }

  @media (max-width: 760px) {
    max-width: 62px;
  }

  @media (max-width: 560px) {
    max-width: 48px;
  }
`

/** X축 라벨 */
export const ChartLabel = styled.span`
  align-self: start;
  padding-top: 8px;
  color: #2f4d9a;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: -0.35px;
  text-align: center;
  white-space: nowrap;

  @media (max-width: 560px) {
    font-size: 10px;
  }
`
