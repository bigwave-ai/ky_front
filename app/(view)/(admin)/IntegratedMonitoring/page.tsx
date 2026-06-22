'use client'

import { useMemo, useState } from 'react'
import imc from './IntegratedMonitoring.module.css'
import imag from '@/app/components/style/resources/css/image.module.css'
import { useTranslation } from '@/app/services/i18n/LanguageProvider'

/*
 * 01. 구분     : Page 컴포넌트
 * 02. 타입     : Client Component
 * 03. 업무구분  : 관리자권한 - 통합 관제 모니터링 페이지
 * 04. 설명     : 통합 관제 현황/고객사 알람 로그 UI 제공
 * 05. 작성일자  : 2026.04.20
 * 06. 작성자   : 이우창
 */

type AlarmLevelType = '정상' | '경고'

type AlarmLogRowType = {
  seq: string
  time: string
  level: AlarmLevelType
  customer: string
  message: string
}

export default function IntegratedMonitoringPage() {
  /******************** 변수 영역 ********************/
  const { t } = useTranslation()
  const [activePage, setActivePage] = useState(6) // 현재 선택된 페이지네이션 번호

  const totalCustomerCount = '1,432' // 전체 고객사 수
  const runningCompressorCount = '23,435' // 가동 컴프레셔 수
  const normalCompressorCount = '20,622' // 정상 컴프레셔 수
  const normalRate = 88 // 정상 비율(%)
  const warningCompressorCount = '2,813' // 경고 컴프레셔 수
  const warningRate = 12 // 경고 비율(%)

  const alarmRows: AlarmLogRowType[] = useMemo(
    () => [
      {
        seq: 'RTX-00001',
        time: '2026-01-10 23:51:00',
        level: '정상',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 A컴프레셔에서 정상적으로 작동하고 있으나 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00002',
        time: '2026-01-10 23:50:00',
        level: '경고',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 B컴프레셔에서 경고가 발생하여 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00003',
        time: '2026-01-10 23:49:00',
        level: '정상',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 A컴프레셔에서 정상적으로 작동하고 있으나 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00004',
        time: '2026-01-10 23:48:00',
        level: '경고',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 B컴프레셔에서 경고가 발생하여 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00005',
        time: '2026-01-10 23:47:00',
        level: '정상',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 A컴프레셔에서 정상적으로 작동하고 있으나 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00006',
        time: '2026-01-10 23:46:00',
        level: '경고',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 B컴프레셔에서 경고가 발생하여 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00007',
        time: '2026-01-10 23:45:00',
        level: '정상',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 A컴프레셔에서 정상적으로 작동하고 있으나 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00008',
        time: '2026-01-10 23:44:00',
        level: '경고',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 B컴프레셔에서 경고가 발생하여 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00009',
        time: '2026-01-10 23:43:00',
        level: '정상',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 A컴프레셔에서 정상적으로 작동하고 있으나 확인이 필요합니다.',
      },
      {
        seq: 'RTX-00010',
        time: '2026-01-10 23:42:00',
        level: '경고',
        customer: 'LH179QA5-EM01(D183)',
        message:
          'LH179QA5-EM01(D183) 고객사의 B컴프레셔에서 경고가 발생하여 확인이 필요합니다.',
      },
    ],
    [],
  ) // 테이블 표시용 알람 로그 더미 데이터

  const pages = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 1), []) // 페이지네이션 번호 목록(1~10)

  /******************** 함수 영역 ********************/
  // 알람 레벨(정상/경고)에 맞는 뱃지 스타일 클래스를 반환하는 함수
  const getAlarmStatusClassName = (level: AlarmLevelType) =>
    level === '정상' ? imc.integrated_statusNormal : imc.integrated_statusWarning

  /******************** 수행 영역 ********************/
  return (
    <div className={imc.integrated_root}>
      <header className={imc.integrated_pageHead}>
        <h1>{t('시스템 통합 관제 현황')}</h1>
        <p>{t('전체 고객사와 컴프레셔 가동에 대한 종합적인 정보를 확인하실 수 있습니다.')}</p>
      </header>

      <section className={imc.integrated_statsGrid}>
        <article className={imc.integrated_statCard}>
          <div className={imc.integrated_statTop}>
            <h3>{t('전체 고객사 수')}</h3>
            <div className={imc.integrated_iconWrap}>
              <div className={imag.user_circle_icon} aria-hidden="true" />
            </div>
          </div>
          <div className={imc.integrated_statValueBlue}>{totalCustomerCount}</div>
        </article>

        <article className={imc.integrated_statCard}>
          <div className={imc.integrated_statTop}>
            <h3>{t('가동 컴프레셔 수')}</h3>
            <div className={imc.integrated_iconWrap}>
              <div className={imag.compressor_circle_blue_icon} aria-hidden="true" />
            </div>
          </div>
          <div className={imc.integrated_statValueBlue}>{runningCompressorCount}</div>
        </article>

        <article className={imc.integrated_statCard}>
          <div className={imc.integrated_statTop}>
            <h3 className={imc.integrated_titleGreen}>
              {t('정상')} <span style={{ color: '#2B2B2B' }}>{t('컴프레셔 수')}</span>
            </h3>
            <div className={imc.integrated_iconWrap}>
              <div className={imag.compressor_circle_green_icon} aria-hidden="true" />
            </div>
          </div>

          <div className={imc.integrated_statMetricRow}>
            <strong className={imc.integrated_statValueGreen}>{normalCompressorCount}</strong>
            <strong className={imc.integrated_statRateGreen}>{normalRate}%</strong>
          </div>
          <div className={imc.integrated_progressTrack}>
            <div
              className={imc.integrated_progressFillGreen}
              style={{ width: `${normalRate}%` }}
            />
          </div>
        </article>

        <article className={imc.integrated_statCard}>
          <div className={imc.integrated_statTop}>
            <h3 className={imc.integrated_titleRed}>
              {t('경고')} <span style={{ color: '#2B2B2B' }}>{t('컴프레셔 수')}</span>
            </h3>
            <div className={imc.integrated_iconWrap}>
              <div className={imag.compressor_circle_red_icon} aria-hidden="true" />
            </div>
          </div>

          <div className={imc.integrated_statMetricRow}>
            <strong className={imc.integrated_statValueRed}>{warningCompressorCount}</strong>
            <strong className={imc.integrated_statRateRed}>{warningRate}%</strong>
          </div>
          <div className={imc.integrated_progressTrack}>
            <div
              className={imc.integrated_progressFillRed}
              style={{ width: `${warningRate}%` }}
            />
          </div>
        </article>
      </section>

      <article className={imc.integrated_logCard}>
        <div className={imc.integrated_logHead}>
          <div className={imc.integrated_logTitleWrap}>
            <span className={imc.integrated_logDot} aria-hidden="true" />
            <h3>{t('고객사 알람 로그')}</h3>
            <p>{t('고객사의 알람에 따른 내용을 확인해주세요.')}</p>
          </div>
        </div>

        <div className={imc.integrated_tableWrap}>
          <table className={imc.integrated_table}>
            <thead>
              <tr>
                <th>{t('일련번호')}</th>
                <th>{t('일시')}</th>
                <th>{t('알람 종류')}</th>
                <th>{t('고객사')}</th>
                <th>{t('알람 내용')}</th>
              </tr>
            </thead>
            <tbody>
              {alarmRows.map((row) => (
                <tr key={row.seq}>
                  <td>{row.seq}</td>
                  <td>{row.time}</td>
                  <td>
                    <span className={getAlarmStatusClassName(row.level)}>{t(row.level)}</span>
                  </td>
                  <td>{row.customer}</td>
                  <td>{t(row.message)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={imc.integrated_pagination}>
          <button type="button" className={imc.integrated_pageArrow} aria-label={t('이전 페이지')}>
            &lt;
          </button>

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`${imc.integrated_pageNum} ${page === activePage ? imc.integrated_pageNumActive : ''}`}
              onClick={() => setActivePage(page)} // 페이지 번호 클릭 시 활성 페이지 상태 변경
            >
              {page}
            </button>
          ))}

          <button type="button" className={imc.integrated_pageArrow} aria-label={t('다음 페이지')}>
            &gt;
          </button>
        </div>
      </article>
    </div>
  )
}
