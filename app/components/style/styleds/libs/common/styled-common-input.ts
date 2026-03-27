import styled from 'styled-components'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Common
 * 03. 설명     : 공용 텍스트 인풋 스타일
 * 04. 작성일자  : 2025.08.25
 * 05. 작성자   : 이우창
 */

export const TextInputStyled = styled.input`
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--_input_, #c3c4c6);
  background: var(--div_fill_white, #fff);
  padding: 0 12px;
  outline: none;

  &::placeholder {
    color: var(--_input_, #c3c4c6);
    font-family: Heebo;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
  }
`