import { atom } from "jotai";

/*
 * 01. 구분     : 전역 상태 관리
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 전역 상태 관리
 * 03. 설명     : 사이드메뉴 전역 상태 제공
 * 04. 작성일자  : 2025.02.05
 * 05. 작성자   : 이우창
 */

export interface AtomSideMenuItemType {
  menuId: string;
  menuNm: string;
  isOpen: boolean;
  path: string;
  isButton: boolean;
  childrens?: Array<AtomSideMenuItemType>;
}

// Jotai에서는 기존 Recoil의 key는 필요 없음
export const AtomSideMenu = atom<boolean>(false);
export const AtomSideMenuItem = atom<AtomSideMenuItemType | null | undefined>(null);
