'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CdeCenter,
  CdeDonut,
  CdeDot,
  CdeLabel,
  CdeLegend,
  CdeLegendItem,
  CdeLegendLeft,
  CdeRoot,
  CdeSeg,
  CdeSide,
  CdeSvg,
  CdeTotalItem,
  CdeTrack,
  CdeValue,
  CdeVisual,
} from '@/app/components/style/styleds/libs/charts/common/styled-common-donut-equipment'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 차트
 * 04. 설명     : 장비 수 도넛 차트 UI 제공(범례 hover 연동)
 * 05. 작성일자 : 2026.03.27
 * 06. 작성자   : 이우창
 */

export type CommonDonutEquipmentItem = {
  label: string
  value: number | string
  unit?: string
  color: string
}

type CommonDonutEquipmentProps = {
  legend: CommonDonutEquipmentItem[]
  totalLabel?: string
}

const toNumber = (value: number | string) => {
  const parsed =
    typeof value === 'string' ? Number(value.replaceAll(',', '')) : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function CommonDonutEquipment({
  legend,
  totalLabel = '전체 장비 수',
}: CommonDonutEquipmentProps) {
  /******************** 변수 영역 ********************/
  const prepared = useMemo(() => {
    const normalized = legend.map((item) => {
      const rawValue = toNumber(item.value)
      return {
        ...item,
        rawValue,
        unit: item.unit ?? '',
        displayValue: `${rawValue.toLocaleString('ko-KR')}${item.unit ?? ''}`,
      }
    })

    const total = normalized.reduce((acc, item) => acc + item.rawValue, 0)
    const safeTotal = total > 0 ? total : 1

    return normalized.map((item) => ({
      ...item,
      total,
      share: (item.rawValue / safeTotal) * 100,
    }))
  }, [legend])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  /******************** 함수 영역 ********************/
  useEffect(() => {
    setMounted(true)
  }, [])

  /******************** 수행 영역 ********************/
  if (prepared.length === 0) return null

  const maxIndex = prepared.reduce(
    (best, item, idx) => (item.rawValue > prepared[best].rawValue ? idx : best),
    0,
  )

  const focusIndex = activeIndex ?? maxIndex
  const focusItem = prepared[focusIndex] ?? prepared[0]
  const totalValue = prepared.reduce((acc, item) => acc + item.rawValue, 0)

  const radius = 72
  const circumference = 2 * Math.PI * radius
  const gap = 7
  let offset = 0

  return (
    <CdeRoot>
      <CdeVisual>
        <CdeDonut role="img" aria-label="장비 수 구성비 도넛 차트">
          <CdeSvg viewBox="0 0 180 180" width={210} height={210} preserveAspectRatio="xMidYMid meet">
            <CdeTrack cx="90" cy="90" r={radius} fill="none" />
            {prepared.map((item, idx) => {
              const length = (item.rawValue / (totalValue || 1)) * circumference
              const segment = Math.max(0, length - gap)
              const dashArray = `${segment} ${circumference - segment}`
              const dashOffset = -offset
              offset += length

              return (
                <CdeSeg
                  key={item.label}
                  $active={idx === focusIndex}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              )
            })}
          </CdeSvg>

          {mounted && (
            <CdeCenter>
              <span>{focusItem?.label}</span>
              <strong>{focusItem?.displayValue}</strong>
              <small>실제값</small>
            </CdeCenter>
          )}
        </CdeDonut>
      </CdeVisual>

      <CdeSide>
        <CdeLegend>
          {prepared.map((item, idx) => (
            <CdeLegendItem
              key={item.label}
              $active={idx === focusIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <CdeLegendLeft>
                <CdeDot style={{ background: item.color }} />
                <CdeLabel>{item.label}</CdeLabel>
              </CdeLegendLeft>
              <CdeValue>{item.displayValue}</CdeValue>
            </CdeLegendItem>
          ))}

          <CdeTotalItem>
            <CdeLegendLeft>
              <CdeLabel>{totalLabel}</CdeLabel>
            </CdeLegendLeft>
            <CdeValue>{`${totalValue.toLocaleString('ko-KR')}대`}</CdeValue>
          </CdeTotalItem>
        </CdeLegend>
      </CdeSide>
    </CdeRoot>
  )
}
