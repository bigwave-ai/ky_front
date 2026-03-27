import type { AtomSideMenuItemType } from './atom-side-menu'

/*
 * 01. 구분     : 전역 메뉴 정의
 * 02. 타입     : Config
 * 03. 업무구분 : 관리자권한 - LSB/Header 메뉴
 * 04. 설명     : 관리자 메뉴 구성 정의
 * 05. 작성일자 : 2026.03.25
 * 06. 작성자   : 이우창
 */

export interface SideMenuSectionConfigType {
  title: string
  items: AtomSideMenuItemType[]
}

export const SideMenuConfigAdmin: SideMenuSectionConfigType[] = [
  {
    title: 'admin',
    items: [
      {
        menuId: 'admin-integrated-monitoring',
        menuNm: '통합 관제 화면',
        path: '/IntegratedMonitoring',
        isOpen: false,
        isButton: false,
      },
      {
        menuId: 'admin-user-management',
        menuNm: '사용자 관리',
        path: '/UserManagement',
        isOpen: false,
        isButton: false,
      },
    ],
  },
]

/** 기존 참조 호환용 */
export const SideMenuConfig = SideMenuConfigAdmin
