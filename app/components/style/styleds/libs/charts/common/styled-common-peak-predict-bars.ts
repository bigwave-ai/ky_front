/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분 : 모든권한 - 스타일 - Charts Common
 * 04. 설명     : 장비 가동 예측 막대 차트 스타일 (styled-components)
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

import styled from 'styled-components'

type CommonPeakPredictBarsWrapProps = {
  $gapPx: number
  $sidePaddingPx: number
}

type CommonPeakPredictBarValueProps = {
  $bottomPx: number
}

type CommonPeakPredictBarFillProps = {
  $heightPx: number
}

/** 장비 가동 예측 막대 그룹 래퍼 */
export const CommonPeakPredictBarsWrap = styled.div<CommonPeakPredictBarsWrapProps>`
  display: grid;
  grid-template-columns: repeat(2, minmax(130px, 1fr));
  align-items: end;
  gap: ${({ $gapPx }) => `${$gapPx}px`};
  padding-left: ${({ $sidePaddingPx }) => `${$sidePaddingPx}px`};
  padding-right: ${({ $sidePaddingPx }) => `${$sidePaddingPx}px`};

  @media (max-width: 1280px) {
    gap: 28px;
    padding-left: 0;
    padding-right: 0;
  }

  @media (max-width: 980px) {
    gap: 24px;
  }

  @media (max-width: 760px) {
    width: 100%;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 16px;
    justify-items: center;
  }
`

/** 막대 아이템 */
export const CommonPeakPredictBarItem = styled.div`
  min-width: 130px;
  display: grid;
  gap: 8px;
  justify-items: center;
`

/** 막대 트랙 */
export const CommonPeakPredictBarTrack = styled.div`
  position: relative;
  width: 130px;
  height: 126px;
  margin-top: 30px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: visible;
`

/** 막대 위 값 라벨 */
export const CommonPeakPredictBarValue = styled.strong<CommonPeakPredictBarValueProps>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: ${({ $bottomPx }) => `${$bottomPx}px`};
  margin: 0;
  color: #1f1f1f;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
`

/** 실제 막대 */
export const CommonPeakPredictBarFill = styled.div<CommonPeakPredictBarFillProps>`
  width: 130px;
  height: ${({ $heightPx }) => `${$heightPx}px`};
  border-radius: 10px;
  background: linear-gradient(180deg, #7a91f4 0%, #6f86e8 100%);
`

/** X축 라벨 */
export const CommonPeakPredictBarLabel = styled.span`
  color: #224bc0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.4px;
  line-height: 1;
`
