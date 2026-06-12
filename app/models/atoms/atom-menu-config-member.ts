import type { SideMenuSectionConfigType } from './atom-menu-config'

/*
 * 01. 구분     : 전역 메뉴 정의
 * 02. 타입     : Config
 * 03. 업무구분 : 멤버권한 - LSB/Header 메뉴
 * 04. 설명     : 멤버 메뉴 구성 정의
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

export const SideMenuConfigMember: SideMenuSectionConfigType[] = [
  {
    title: 'menu',
    items: [
      {
        menuId: 'member-detail-monitoring',
        menuNm: '상세 모니터링 및 AI 예측',
        path: '/DetailMonitoring',
        isOpen: false,
        isButton: false,
      },
      {
        menuId: 'member-simulation',
        menuNm: '설비 영향 분석 시뮬레이션',
        path: '/simulation',
        isOpen: false,
        isButton: false,
      },
      {
        menuId: 'member-peak-shaving',
        menuNm: 'MILP 피크 분배 대시보드',
        path: '/PeakShaving',
        isOpen: false,
        isButton: false,
      },
      {
        menuId: 'member-chatbot',
        menuNm: '통합 AI 챗봇',
        path: '/Chatbot',
        isOpen: false,
        isButton: false,
      },
    ],
  },
]
