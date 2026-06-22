import { dictionary, type Lang } from './dictionary'

/*
 * 01. 구분     : i18n 유틸
 * 02. 타입     : 비-React 헬퍼
 * 03. 업무구분 : 모든권한 - 다국어(한/영) 변환
 * 04. 설명     : React 컨텍스트 밖(명령형 모달 등, 별도 root)에서 사용하는 번역 함수.
 *               현재 언어를 localStorage에서 직접 읽어 동기적으로 번역한다.
 *               React 컴포넌트 내부에서는 useTranslation()의 t()를 사용할 것.
 * 05. 작성일자 : 2026.06.15
 */

const STORAGE_KEY = 'app.lang'

/** 저장된 현재 언어를 반환한다. (기본 'ko') */
export function getLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'en' ? 'en' : 'ko'
  } catch {
    return 'ko'
  }
}

/** 한국어 원문을 현재 언어로 변환한다. (en일 때만 사전 조회, 미존재 시 원문 폴백) */
export function translate(ko: string): string {
  if (!ko) return ko
  if (getLang() === 'ko') return ko
  return dictionary[ko] ?? ko
}
