'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { dictionary, type Lang } from './dictionary'

/*
 * 01. 구분     : 전역 상태 관리
 * 02. 타입     : Client Component (Context Provider)
 * 03. 업무구분 : 모든권한 - 다국어(한/영) 전역 상태
 * 04. 설명     : 현재 언어를 보관/전환하고 t(한국어) 번역 함수를 제공한다.
 *               선택 언어는 localStorage에 저장되어 새로고침 후에도 유지된다.
 * 05. 작성일자 : 2026.06.15
 */

const STORAGE_KEY = 'app.lang'

type LanguageContextType = {
  /** 현재 언어 ('ko' | 'en') */
  lang: Lang
  /** 언어 변경 */
  setLang: (lang: Lang) => void
  /** 한↔영 토글 */
  toggleLang: () => void
  /** 한국어 원문 → 현재 언어 문자열 변환 */
  t: (ko: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  /******************** 변수 영역 ********************/
  // SSR/최초 클라이언트 렌더는 항상 'ko'로 시작하여 hydration 불일치를 방지한다.
  const [lang, setLangState] = useState<Lang>('ko')

  /******************** 함수 영역 ********************/
  // 마운트 시 저장된 언어를 반영한다.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'ko' || saved === 'en') {
        setLangState(saved)
        document.documentElement.lang = saved
      }
    } catch {
      /* localStorage 접근 불가 시 무시 */
    }
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
    } catch {
      /* 무시 */
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'ko' ? 'en' : 'ko')
  }, [lang, setLang])

  // 한국어 원문을 현재 언어로 변환한다. (en일 때만 사전 조회, 미존재 시 원문 폴백)
  const t = useCallback(
    (ko: string): string => {
      if (lang === 'ko') return ko
      return dictionary[ko] ?? ko
    },
    [lang],
  )

  /******************** 수행 영역 ********************/
  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

/** 번역 함수 + 현재 언어 제어를 제공하는 훅 */
export function useTranslation(): LanguageContextType {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    // Provider 외부에서 호출되어도 앱이 깨지지 않도록 한국어 폴백을 반환한다.
    return {
      lang: 'ko',
      setLang: () => {},
      toggleLang: () => {},
      t: (ko: string) => ko,
    }
  }
  return ctx
}

/** useTranslation 의 별칭 */
export const useLanguage = useTranslation
