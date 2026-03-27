'use client'

import * as S from '@/app/components/style/styleds/libs/charts/common/styled-common-bar-chart'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 차트
 * 04. 설명     : 공통 Bar Chart UI 제공
 * 05. 작성일자 : 2026.03.26
 * 06. 작성자   : 이우창
 */

export type CommonBarChartItemType = {
  label: string
  value: string
  height: number
  pred?: boolean
}

interface CommonBarChartProps {
  bars: CommonBarChartItemType[]
  yAxisTicks?: number[]
  valueOffsetPx?: number
}

const DEFAULT_Y_AXIS_TICKS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0]

export default function CommonBarChart({
  bars,
  yAxisTicks = DEFAULT_Y_AXIS_TICKS,
  valueOffsetPx = 6,
}: CommonBarChartProps) {
  /******************** 변수 영역 ********************/
  const mergedYAxisTicks = yAxisTicks.length > 0 ? yAxisTicks : DEFAULT_Y_AXIS_TICKS

  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return (
    <S.ChartFrame>
      <S.ChartYAxis>
        {mergedYAxisTicks.map((tick) => (
          <S.ChartTick key={`tick-${tick}`}>{tick}</S.ChartTick>
        ))}
      </S.ChartYAxis>

      <S.ChartCanvas>
        <S.ChartGuides aria-hidden="true" />

        <S.ChartBars>
          {bars.map((bar) => (
            <S.ChartBarItem key={bar.label}>
              <S.ChartTrack>
                <S.ChartValue $height={bar.height} $offsetPx={valueOffsetPx}>
                  {bar.value}
                </S.ChartValue>

                <S.ChartBar $height={bar.height} $pred={Boolean(bar.pred)} />
              </S.ChartTrack>

              <S.ChartLabel>{bar.label}</S.ChartLabel>
            </S.ChartBarItem>
          ))}
        </S.ChartBars>
      </S.ChartCanvas>
    </S.ChartFrame>
  )
}
