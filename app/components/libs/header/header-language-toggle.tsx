'use client'

import mmc from '../../style/resources/css/member.module.css'
import { useTranslation } from '@/app/services/i18n/LanguageProvider'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 헤더 언어 전환 버튼
 * 04. 설명     : 헤더 우측의 한글/English 토글. 클릭 시 전역 언어가 즉시 전환된다.
 * 05. 작성일자 : 2026.06.15
 */

const HeaderLanguageToggle = () => {
  /******************** 변수 영역 ********************/
  const { lang, setLang } = useTranslation()

  /******************** 수행 영역 ********************/
  return (
    <div className={mmc.lang_toggle} role="group" aria-label="Language">
      <button
        type="button"
        className={`${mmc.lang_toggle_btn} ${lang === 'ko' ? mmc.lang_toggle_btn_active : ''}`}
        onClick={() => setLang('ko')}
        aria-pressed={lang === 'ko'}
      >
        한글
      </button>
      <button
        type="button"
        className={`${mmc.lang_toggle_btn} ${lang === 'en' ? mmc.lang_toggle_btn_active : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
      >
        English
      </button>
    </div>
  )
}

export default HeaderLanguageToggle
