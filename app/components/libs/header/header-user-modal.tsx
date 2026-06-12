'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSetAtom } from 'jotai'

import * as S from '../../style/styleds/libs/header/styled-header-user-modal'
import imag from '../../style/resources/css/image.module.css'
import { userInfoAtom } from '@/app/models/atoms/atom-user-info'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 헤더 사용자 모달
 * 04. 설명     : 사용자 아이콘 클릭 시 로그아웃 모달 제공
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

const HeaderUserModal = () => {
  /******************** 변수 영역 ********************/
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const setUserInfo = useSetAtom(userInfoAtom)

  /******************** 함수 영역 ********************/
  const handleClickOutside = (e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }

  /** 로그아웃 처리: 서버 쿠키 삭제 + 클라이언트 사용자 정보 초기화 */
  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const resp = await fetch('/api/auth/deleteCookies', {
        method: 'POST',
        credentials: 'include',
      })

      if (!resp.ok) {
        console.error('deleteCookies failed:', await resp.text())
      }
    } catch (error) {
      console.error('logout error:', error)
    } finally {
      setUserInfo({
        user_id: '',
        name: '',
        email: '',
        role: '',
        contact: '',
        status: '',
      })

      setOpen(false)
      setIsLoggingOut(false)
      router.replace('/signin')
    }
  }

  /******************** 수행 영역 ********************/
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <S.UserWrapper ref={wrapperRef}>
      <button
        type="button"
        aria-label="사용자 메뉴 열기"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          margin: 0,
          width: '26px',
          height: '26px',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
        }}
      >
        <span className={imag.header_user_icon} />
      </button>

      {open && (
        <S.Modal>
          <S.ModalItem onClick={handleLogout} disabled={isLoggingOut}>
            <S.Icon className={imag.logout_icon} />
            <S.Text>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</S.Text>
          </S.ModalItem>
        </S.Modal>
      )}
    </S.UserWrapper>
  )
}

export default HeaderUserModal
