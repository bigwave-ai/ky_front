/*
 * 01. 구분     : Style Component
 * 02. 유형     : -
 * 03. 업무구분 : 모든권한 - 스타일 - Charts Common
 * 04. 설명     : Detail Monitoring TimeSeries 차트 스타일(styled-components)
 * 05. 작성일자 : 2026.03.30
 */

'use client'

import styled from 'styled-components'

type GridLineProps = {
  $strong?: boolean
}

type LegendSwatchProps = {
  $kind: 'actual' | 'forecast'
}

type TooltipHeadDotProps = {
  $kind: 'actual' | 'forecast'
}

export const ChartRoot = styled.div`
  width: 100%;
  min-height: 300px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 6px 8px 2px;
  border-radius: 10px;
  border: 1px solid #dbe9f8;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(245, 251, 255, 0.96) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
`

export const ChartLegend = styled.div`
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #d6e7fb;
  background: rgba(255, 255, 255, 0.92);
`

export const LegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4a6481;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.2px;
`

export const LegendSwatch = styled.i<LegendSwatchProps>`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  background: ${({ $kind }) =>
    $kind === 'actual'
      ? 'linear-gradient(135deg, #2f77ff 0%, #3359ea 100%)'
      : 'linear-gradient(135deg, #18b66f 0%, #1aa8a3 100%)'};
`

export const ChartSvg = styled.svg`
  width: 100%;
  min-width: 880px;
  height: auto;
  display: block;
`

export const PlotBackdrop = styled.rect`
  stroke: #d9e8f9;
  stroke-width: 1;
  rx: 6;
  ry: 6;
`

export const GridLine = styled.line<GridLineProps>`
  stroke: ${({ $strong }) => ($strong ? '#c8d9ea' : '#e3edf8')};
  stroke-width: ${({ $strong }) => ($strong ? 1.2 : 1)};
`

export const AxisLine = styled.line`
  stroke: #90a9c3;
  stroke-width: 1.4;
`

export const TickLabel = styled.text`
  fill: #4d5f74;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.2px;
`

export const AxisTitle = styled.text`
  fill: #5a6f86;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.3px;
`

export const ActualArea = styled.path`
  fill: rgba(59, 123, 255, 0.18);
`

export const ForecastArea = styled.path`
  fill: rgba(45, 194, 123, 0.18);
`

export const ActualLine = styled.path`
  fill: none;
  stroke: #2f77ff;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 3px rgba(44, 101, 220, 0.2));
`

export const ForecastLine = styled.path`
  fill: none;
  stroke: #18b66f;
  stroke-width: 2.2;
  stroke-dasharray: 7 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: none;
  stroke-dashoffset: 0;
  transition: none;
  filter: drop-shadow(0 2px 3px rgba(39, 176, 126, 0.18));
`

export const PeakLine = styled.line`
  stroke: #e06a6a;
  stroke-width: 2;
`

export const PeakLabel = styled.text`
  fill: #d55b5b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.2px;
`

export const HoverPoint = styled.circle`
  fill: transparent;
  stroke: transparent;
  cursor: pointer;
`

export const TooltipGroup = styled.g`
  pointer-events: none;
`

export const TooltipRect = styled.rect`
  fill: rgba(20, 31, 48, 0.92);
  stroke: rgba(154, 189, 255, 0.4);
  stroke-width: 1;
`

export const TooltipHeadDot = styled.circle<TooltipHeadDotProps>`
  fill: ${({ $kind }) => ($kind === 'actual' ? '#2f77ff' : '#18b66f')};
`

export const TooltipHeadText = styled.text`
  fill: #eaf2ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.2px;
`

export const TooltipValueText = styled.text`
  fill: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.2px;
`

export const NoData = styled.div`
  width: 100%;
  min-height: 320px;
  border-radius: 10px;
  border: 1px dashed #bdd6eb;
  background: #f8fcff;
  display: grid;
  place-items: center;
  color: #65849f;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.3px;
`
