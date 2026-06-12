import styled, { css } from 'styled-components'

/*
 * 01. 구분     : Styled
 * 02. 타입     : Styled Component
 * 03. 업무구분 : 모든권한 - 차트
 * 04. 설명     : 장비 수 도넛 차트 스타일 제공
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

const PRETENDARD = `Pretendard, system-ui, -apple-system, "Segoe UI", sans-serif`

export const CdeRoot = styled.div`
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`

export const CdeVisual = styled.div`
  display: grid;
  place-items: center;
  min-height: 210px;
  background: transparent;

  @media (max-width: 980px) {
    min-height: auto;
  }
`

export const CdeDonut = styled.div`
  position: relative;
  width: 210px;
  height: 210px;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
`

export const CdeSvg = styled.svg`
  width: 210px;
  height: 210px;
  max-width: 100%;
  max-height: 100%;
  display: block;
  transform: rotate(-90deg);
  background: transparent;
`

export const CdeTrack = styled.circle`
  fill: none;
  stroke: rgba(15, 35, 60, 0.14);
  stroke-width: 16;
`

export const CdeSeg = styled.circle<{ $active?: boolean }>`
  fill: none;
  stroke-width: 16;
  stroke-linecap: round;
  opacity: 0.72;
  transition: opacity 0.18s ease, stroke-width 0.18s ease;
  cursor: pointer;

  ${({ $active }) =>
    $active &&
    css`
      opacity: 1;
      stroke-width: 18;
    `}
`

export const CdeCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  text-align: center;
  pointer-events: none;
  font-family: ${PRETENDARD};

  span {
    font-size: 14px;
    font-weight: 700;
    color: #51657f;
    letter-spacing: -0.2px;
  }

  strong {
    font-size: 50px;
    font-size: 44px;
    font-size: 38px;
    font-size: 34px;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: -0.7px;
    color: #1e2a3f;
    line-height: 1;
  }

  small {
    font-size: 12px;
    color: #6f8198;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    strong {
      font-size: 28px;
    }
  }
`

export const CdeSide = styled.div`
  display: grid;
  gap: 8px;
  align-content: start;
  min-width: 0;
  font-family: ${PRETENDARD};
`

export const CdeLegend = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
`

export const CdeLegendItem = styled.li<{ $active?: boolean }>`
  border: 1px solid #dbe4ec;
  border-radius: 10px;
  background: #fff;
  padding: 0 10px;
  min-height: 44px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease;

  ${({ $active }) =>
    $active &&
    css`
      border-color: #86c7e9;
      background: #f3faff;
    `}
`

export const CdeTotalItem = styled.li`
  border: 1px solid #e7e8ea;
  border-radius: 10px;
  background: linear-gradient(90deg, #e0f1f5 0%, #fbf0e4 100%);
  padding: 0 10px;
  min-height: 44px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
`

export const CdeLegendLeft = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

export const CdeDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
`

export const CdeLabel = styled.em`
  font-style: normal;
  color: #4f6880;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.3px;
  min-width: 0;
`

export const CdeValue = styled.strong`
  color: #2b2b2b;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.4px;
  white-space: nowrap;
`
