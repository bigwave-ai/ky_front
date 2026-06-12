import styled from 'styled-components'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분 : 모든권한 - 헤더 사용자 모달 스타일
 * 04. 설명     : 로그아웃 단일 액션 모달 스타일 제공
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

export const UserWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

export const Modal = styled.div`
  position: absolute;
  top: 34px;
  right: 0;
  width: 138px;
  padding: 6px 6px;
  border-radius: 10px;
  z-index: 200;
  border: 1px solid #b8d8f4;
  background: #fff;
  box-shadow: 0 6px 14px rgba(8, 31, 64, 0.18);
`

export const ModalItem = styled.button.attrs({ type: 'button' })`
  width: 100%;
  height: 36px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 14px;
  cursor: pointer;

  &:hover {
    background: #f2f7ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Divider = styled.div`
  display: none;
`

export const Icon = styled.span`
  width: 18px;
  height: 18px;
  display: inline-block;
  flex: 0 0 18px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`

export const Text = styled.span`
  color: #585858;
  font-family: Heebo, Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
  letter-spacing: -1.5px;
`
