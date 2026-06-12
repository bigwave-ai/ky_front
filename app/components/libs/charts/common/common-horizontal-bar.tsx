'use client'

import * as S from '@/app/components/style/styleds/libs/charts/common/styled-common-horizontal-bar'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 차트
 * 04. 설명     : 공통 Horizontal Bar 목록 UI 제공
 * 05. 작성일자 : 2026.03.26
 * 06. 작성자   : 이우창
 */

export type CommonHorizontalBarItemType = {
  label: string
  rate: number
}

interface CommonHorizontalBarProps {
  items: CommonHorizontalBarItemType[]
}

export default function CommonHorizontalBar({ items }: CommonHorizontalBarProps) {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  const normalizeRate = (rate: number) => Math.max(0, Math.min(100, rate))

  /******************** 수행 영역 ********************/
  return (
    <S.CommonHorizontalBarList>
      {items.map((item, index) => {
        const clampedRate = normalizeRate(item.rate)

        return (
          <S.CommonHorizontalBarRow key={`${item.label}-${index}`}>
            <S.CommonHorizontalBarLabel>{item.label}</S.CommonHorizontalBarLabel>

            <S.CommonHorizontalBarTrack>
              <S.CommonHorizontalBarFill $rate={clampedRate} />
            </S.CommonHorizontalBarTrack>

            <S.CommonHorizontalBarValue>{clampedRate}%</S.CommonHorizontalBarValue>
          </S.CommonHorizontalBarRow>
        )
      })}
    </S.CommonHorizontalBarList>
  )
}
