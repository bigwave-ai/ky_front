import styled from 'styled-components'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 헤더 breadcrumb
 * 03. 설명     : 헤더 breadcrumb 스타일 제공
 * 04. 작성일자  : 2025.09.02
 * 05. 작성자   : 이우창
 */

export const BreadcrumbWrapper = styled.div`
  font-family: Heebo;
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -1.5px;

  .prev {
    color: #8B8B8B;
  }

  .current {
    color: #585858;
  }

  .separator {
    margin: 0 15px; /* ✅ > 좌우 여백 */
    color: #8B8B8B; /* 구분자 색상 */
  }
`