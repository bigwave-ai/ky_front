/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분 : 모든권한 - 스타일 - Common
 * 04. 설명     : 공통 Horizontal Bar 목록 스타일 (styled-components)
 * 05. 작성일자 : 2026.03.26
 * 06. 작성자   : 이우창
 */

import styled from 'styled-components'

type CommonHorizontalBarFillProps = {
  $rate: number
}

/** 가로 막대 목록 래퍼 */
export const CommonHorizontalBarList = styled.div`
  display: grid;
  gap: 22px;
  min-width: 0;
`

/** 가로 막대 한 줄 */
export const CommonHorizontalBarRow = styled.div`
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 44px;
  gap: 8px;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 130px minmax(0, 1fr) 40px;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
`

/** 좌측 라벨 */
export const CommonHorizontalBarLabel = styled.span`
  color: #2b2b2b;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.4px;
  white-space: nowrap;

  @media (max-width: 1024px) {
    font-size: 13px;
  }
`

/** 트랙 */
export const CommonHorizontalBarTrack = styled.div`
  height: 10px;
  border-radius: 999px;
  background: #d9dbe0;
  overflow: hidden;
`

/** 채워지는 바 */
export const CommonHorizontalBarFill = styled.div<CommonHorizontalBarFillProps>`
  height: 100%;
  width: ${({ $rate }) => `${$rate}%`};
  border-radius: 999px;
  background: linear-gradient(90deg, #7f93ee 0%, #6d86e8 100%);
`

/** 우측 값 */
export const CommonHorizontalBarValue = styled.strong`
  color: #2b2b2b;
  font-size: 14px;
  font-weight: 800;
  text-align: right;
  letter-spacing: -0.3px;

  @media (max-width: 1024px) {
    font-size: 13px;
  }

  @media (max-width: 760px) {
    text-align: left;
  }
`
