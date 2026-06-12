'use client'

import { useId, useMemo, useState } from 'react'
import * as S from '@/app/components/style/styleds/libs/charts/common/styled-common-detail-monitoring-timeseries'

export type DetailMonitoringPointType = {
  time: string
  value: number
}

interface CommonDetailMonitoringTimeSeriesProps {
  unitLabel: string
  actualData: DetailMonitoringPointType[]
  forecastData: DetailMonitoringPointType[]
  peakValue?: number
  showPeakLine?: boolean
}

type PlotPointType = DetailMonitoringPointType & {
  x: number
  y: number
}

type TooltipStateType = {
  x: number
  y: number
  time: string
  value: number
  kind: 'actual' | 'forecast'
} | null

const CHART_WIDTH = 980
const CHART_HEIGHT = 400
const PADDING_LEFT = 64
const PADDING_RIGHT = 22
const PADDING_TOP = 14
const PADDING_BOTTOM = 82

const toLinePath = (points: PlotPointType[]) =>
  points.length ? points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') : ''

const toAreaPath = (points: PlotPointType[], baseY: number) => {
  if (!points.length) return ''
  const first = points[0]
  const last = points[points.length - 1]
  const body = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  return `${body} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
}

// 숫자 천단위 포맷 공통 함수
const formatNumberWithComma = (value: number, digits = 0) =>
  value.toLocaleString('ko-KR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })

const formatTick = (value: number) => {
  // Y축/이상치 기준 라벨 포맷
  if (Math.abs(value) >= 100 || Number.isInteger(value)) {
    return formatNumberWithComma(Math.round(value), 0)
  }
  return formatNumberWithComma(value, 1)
}

const formatPointValue = (value: number) => {
  // 툴팁 값 포맷
  if (Math.abs(value) >= 100) return formatNumberWithComma(value, 2)
  return formatNumberWithComma(value, 3)
}

export default function CommonDetailMonitoringTimeSeriesChart({
  unitLabel,
  actualData,
  forecastData,
  peakValue,
  showPeakLine = false,
}: CommonDetailMonitoringTimeSeriesProps) {
  const [tooltip, setTooltip] = useState<TooltipStateType>(null)

  const uid = useId().replace(/:/g, '')
  const plotBgId = `${uid}-plot-bg`
  const actualAreaId = `${uid}-actual-area`
  const forecastAreaId = `${uid}-forecast-area`
  const actualLineId = `${uid}-actual-line`
  const forecastLineId = `${uid}-forecast-line`

  const geometry = useMemo(() => {
    const merged = [...actualData, ...forecastData]
    if (!merged.length) return null

    const labels = merged.map((item) => item.time)
    const values = merged.map((item) => item.value)
    if (showPeakLine && typeof peakValue === 'number') values.push(peakValue)

    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const rangePadding = Math.max((rawMax - rawMin) * 0.16, Math.abs(rawMax) * 0.03, 1)

    const yMin = rawMin - rangePadding
    const yMax = rawMax + rangePadding
    const yRange = Math.max(1, yMax - yMin)

    const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT
    const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const maxIndex = Math.max(1, labels.length - 1)

    const xByIndex = (index: number) => PADDING_LEFT + (plotWidth * index) / maxIndex
    const yByValue = (value: number) => PADDING_TOP + ((yMax - value) / yRange) * plotHeight

    const actualPoints: PlotPointType[] = actualData.map((item, index) => ({
      ...item,
      x: xByIndex(index),
      y: yByValue(item.value),
    }))

    const forecastPoints: PlotPointType[] = forecastData.map((item, index) => ({
      ...item,
      x: xByIndex(actualData.length + index),
      y: yByValue(item.value),
    }))

    // 실제 구간 마지막 점과 예측 구간 첫 점을 자연스럽게 연결
    const forecastRenderPoints: PlotPointType[] =
      actualPoints.length > 0 && forecastPoints.length > 0
        ? [
            {
              time: actualPoints[actualPoints.length - 1].time,
              value: actualPoints[actualPoints.length - 1].value,
              x: actualPoints[actualPoints.length - 1].x,
              y: actualPoints[actualPoints.length - 1].y,
            },
            ...forecastPoints,
          ]
        : forecastPoints

    const yTickCount = 5
    const yTicks = Array.from({ length: yTickCount + 1 }, (_, idx) => {
      const ratio = idx / yTickCount
      const value = yMax - ratio * yRange
      const y = PADDING_TOP + ratio * plotHeight
      return { value, y }
    })

    const xTickStep = Math.max(1, Math.floor(labels.length / 8))
    const xTicks = labels
      .map((label, index) => ({ label, index, x: xByIndex(index) }))
      .filter((tick) => {
        if (tick.index === 0) return true
        if (tick.index === labels.length - 1) return true
        return tick.index % xTickStep === 0
      })

    const peakY = showPeakLine && typeof peakValue === 'number' ? yByValue(peakValue) : null

    return {
      plotTop: PADDING_TOP,
      plotBottom: PADDING_TOP + plotHeight,
      plotLeft: PADDING_LEFT,
      plotRight: PADDING_LEFT + plotWidth,
      xTicks,
      yTicks,
      actualPoints,
      forecastPoints,
      forecastRenderPoints,
      peakY,
      peakValue,
      chartBottom: CHART_HEIGHT,
      plotHeight,
      plotWidth,
    }
  }, [actualData, forecastData, peakValue, showPeakLine])

  if (!geometry) {
    return <S.NoData>표시할 시계열 데이터가 없습니다.</S.NoData>
  }

  const tooltipWidth = 164
  const tooltipHeight = 52
  const tooltipX = tooltip
    ? Math.min(
        Math.max(geometry.plotLeft + 6, tooltip.x - tooltipWidth / 2),
        geometry.plotRight - tooltipWidth - 6,
      )
    : 0
  const tooltipY = tooltip ? Math.max(geometry.plotTop + 6, tooltip.y - tooltipHeight - 12) : 0

  return (
    <S.ChartRoot>
      <S.ChartLegend>
        <S.LegendItem>
          <S.LegendSwatch $kind="actual" />
          <span>실제값</span>
        </S.LegendItem>
        <S.LegendItem>
          <S.LegendSwatch $kind="forecast" />
          <span>예측값</span>
        </S.LegendItem>
      </S.ChartLegend>

      <S.ChartSvg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="xMidYMin meet"
        role="img"
        aria-label="실제값과 예측값 시계열 그래프"
      >
        <defs>
          <linearGradient id={plotBgId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fafdff" />
            <stop offset="100%" stopColor="#f1f7ff" />
          </linearGradient>

          <linearGradient id={actualAreaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(59,123,255,0.30)" />
            <stop offset="100%" stopColor="rgba(59,123,255,0.08)" />
          </linearGradient>

          <linearGradient id={forecastAreaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(45,194,123,0.28)" />
            <stop offset="100%" stopColor="rgba(45,194,123,0.08)" />
          </linearGradient>

          <linearGradient id={actualLineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2f77ff" />
            <stop offset="100%" stopColor="#3359ea" />
          </linearGradient>

          <linearGradient id={forecastLineId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#18b66f" />
            <stop offset="100%" stopColor="#1aa8a3" />
          </linearGradient>
        </defs>

        <g>
          <S.PlotBackdrop
            x={geometry.plotLeft}
            y={geometry.plotTop}
            width={geometry.plotWidth}
            height={geometry.plotHeight}
            fill={`url(#${plotBgId})`}
          />

          {geometry.yTicks.map((tick, index) => (
            <g key={`y-tick-${index}`}>
              <S.GridLine
                x1={geometry.plotLeft}
                y1={tick.y}
                x2={geometry.plotRight}
                y2={tick.y}
                $strong={index === geometry.yTicks.length - 1}
              />
              <S.TickLabel x={geometry.plotLeft - 8} y={tick.y + 4} textAnchor="end">
                {formatTick(tick.value)}
              </S.TickLabel>
            </g>
          ))}

          {geometry.xTicks.map((tick) => (
            <S.GridLine
              key={`x-grid-${tick.index}`}
              x1={tick.x}
              y1={geometry.plotTop}
              x2={tick.x}
              y2={geometry.plotBottom}
            />
          ))}

          <S.AxisLine x1={geometry.plotLeft} y1={geometry.plotTop} x2={geometry.plotLeft} y2={geometry.plotBottom} />
          <S.AxisLine x1={geometry.plotLeft} y1={geometry.plotBottom} x2={geometry.plotRight} y2={geometry.plotBottom} />

          {geometry.actualPoints.length > 1 && (
            <>
              <S.ActualArea d={toAreaPath(geometry.actualPoints, geometry.plotBottom)} fill={`url(#${actualAreaId})`} />
              <S.ActualLine d={toLinePath(geometry.actualPoints)} stroke={`url(#${actualLineId})`} />
            </>
          )}

          {geometry.forecastRenderPoints.length > 1 && (
            <>
              <S.ForecastArea
                d={toAreaPath(geometry.forecastRenderPoints, geometry.plotBottom)}
                fill={`url(#${forecastAreaId})`}
              />
              <S.ForecastLine d={toLinePath(geometry.forecastRenderPoints)} stroke={`url(#${forecastLineId})`} />
            </>
          )}

          {showPeakLine && geometry.peakY !== null && (
            <>
              <S.PeakLine x1={geometry.plotLeft} y1={geometry.peakY} x2={geometry.plotRight} y2={geometry.peakY} />
              <S.PeakLabel x={geometry.plotRight - 4} y={geometry.peakY - 6} textAnchor="end">
                이상치 기준 ({formatTick(geometry.peakValue ?? 0)})
              </S.PeakLabel>
            </>
          )}

          {geometry.actualPoints.map((point, index) => (
            <S.HoverPoint
              key={`actual-point-${index}-${point.time}`}
              cx={point.x}
              cy={point.y}
              r={14}
              onMouseEnter={() =>
                setTooltip({
                  x: point.x,
                  y: point.y,
                  time: point.time,
                  value: point.value,
                  kind: 'actual',
                })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              <title>{`실제값 ${point.time} / ${formatPointValue(point.value)} ${unitLabel}`}</title>
            </S.HoverPoint>
          ))}

          {geometry.forecastPoints.map((point, index) => (
            <S.HoverPoint
              key={`forecast-point-${index}-${point.time}`}
              cx={point.x}
              cy={point.y}
              r={14}
              onMouseEnter={() =>
                setTooltip({
                  x: point.x,
                  y: point.y,
                  time: point.time,
                  value: point.value,
                  kind: 'forecast',
                })
              }
              onMouseLeave={() => setTooltip(null)}
            >
              <title>{`예측값 ${point.time} / ${formatPointValue(point.value)} ${unitLabel}`}</title>
            </S.HoverPoint>
          ))}

          {tooltip && (
            <S.TooltipGroup transform={`translate(${tooltipX}, ${tooltipY})`}>
              <S.TooltipRect width={tooltipWidth} height={tooltipHeight} rx={8} ry={8} />
              <S.TooltipHeadDot cx={10} cy={14} r={4} $kind={tooltip.kind} />
              <S.TooltipHeadText x={18} y={18}>
                {tooltip.kind === 'actual' ? '실제값' : '예측값'} ({tooltip.time})
              </S.TooltipHeadText>
              <S.TooltipValueText x={10} y={38}>
                {formatPointValue(tooltip.value)} {unitLabel}
              </S.TooltipValueText>
            </S.TooltipGroup>
          )}

          {geometry.xTicks.map((tick) => (
            <S.TickLabel
              key={`x-tick-${tick.index}`}
              x={tick.x}
              y={geometry.chartBottom - 34}
              textAnchor="end"
              transform={`rotate(-35 ${tick.x} ${geometry.chartBottom - 34})`}
            >
              {tick.label}
            </S.TickLabel>
          ))}

          <S.AxisTitle
            x={18}
            y={(geometry.plotTop + geometry.plotBottom) / 2}
            transform={`rotate(-90 18 ${(geometry.plotTop + geometry.plotBottom) / 2})`}
          >
            {unitLabel}
          </S.AxisTitle>

          <S.AxisTitle x={geometry.plotRight + 8} y={geometry.chartBottom - 16} textAnchor="end">
            시간
          </S.AxisTitle>
        </g>
      </S.ChartSvg>
    </S.ChartRoot>
  )
}
