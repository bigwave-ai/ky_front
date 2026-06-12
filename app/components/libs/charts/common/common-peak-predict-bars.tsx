'use client'

import * as S from '@/app/components/style/styleds/libs/charts/common/styled-common-peak-predict-bars'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 차트
 * 04. 설명     : 장비 가동 예측용 막대 차트 UI 제공
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

export type CommonPeakPredictBarItemType = {
  label: string
  value: number
}

interface CommonPeakPredictBarsProps {
  bars: CommonPeakPredictBarItemType[]
  unit?: string
  maxValue?: number
  minBarHeightPx?: number
  maxBarHeightPx?: number
  valueOffsetPx?: number
  gapPx?: number
  sidePaddingPx?: number
}

export default function CommonPeakPredictBars({
  bars,
  unit = 'KW',
  maxValue = 90,
  minBarHeightPx = 72,
  maxBarHeightPx = 126,
  valueOffsetPx = 8,
  gapPx = 80,
  sidePaddingPx = 40,
}: CommonPeakPredictBarsProps) {
  /******************** 변수 영역 ********************/
  const safeBars = bars ?? []
  const safeMaxValue = Math.max(1, maxValue)

  /******************** 함수 영역 ********************/
  const toBarHeightPx = (value: number) => {
    const normalized = (value / safeMaxValue) * maxBarHeightPx
    return Math.max(minBarHeightPx, Math.min(maxBarHeightPx, normalized))
  }

  const formatValue = (value: number) => `${value.toFixed(2)}${unit}`

  /******************** 수행 영역 ********************/
  if (safeBars.length === 0) return null

  return (
    <S.CommonPeakPredictBarsWrap $gapPx={gapPx} $sidePaddingPx={sidePaddingPx}>
      {safeBars.map((bar, index) => {
        const heightPx = toBarHeightPx(bar.value)

        return (
          <S.CommonPeakPredictBarItem key={`${bar.label}-${index}`}>
            <S.CommonPeakPredictBarTrack>
              <S.CommonPeakPredictBarValue $bottomPx={heightPx + valueOffsetPx}>
                {formatValue(bar.value)}
              </S.CommonPeakPredictBarValue>

              <S.CommonPeakPredictBarFill $heightPx={heightPx} />
            </S.CommonPeakPredictBarTrack>

            <S.CommonPeakPredictBarLabel>{bar.label}</S.CommonPeakPredictBarLabel>
          </S.CommonPeakPredictBarItem>
        )
      })}
    </S.CommonPeakPredictBarsWrap>
  )
}
