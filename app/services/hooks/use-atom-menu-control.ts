"use client";

import { useAtom } from "jotai";
import { AtomSideMenu, AtomSideMenuItem, AtomSideMenuItemType } from "@/app/models/atoms/atom-side-menu";

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - Interface
 * 03. 설명     : Auth 관련 interface 타입 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

const useAtomMenuControl = () => {
  const [atomSideMenu, setAtomSideMenu] = useAtom(AtomSideMenu);
  const [atomSideMenuItem, setAtomSideMenuItem] = useAtom(AtomSideMenuItem);

  const fnSetAtomSideMenu = (data: boolean) => {
    setAtomSideMenu(!data);
  };
  const fnSetAtomSideMenuItem = (data: AtomSideMenuItemType) => {
    setAtomSideMenuItem(data);
  };
  const fnSetAtomSideMenuItemOpen = (menuId: string) => {
    const copyAtomSideMenuItem = JSON.parse(JSON.stringify(atomSideMenuItem));
    const changedAtomSideMenuItem = fnChangeAtomSideMenuItemOpen(copyAtomSideMenuItem, menuId);
    setAtomSideMenuItem(changedAtomSideMenuItem);
  };

  const fnChangeAtomSideMenuItemOpen = (AtomSideMenuItem: AtomSideMenuItemType, menuId: string) => {
    if (AtomSideMenuItem?.menuId == menuId) {
      AtomSideMenuItem.isOpen = !AtomSideMenuItem.isOpen;
    }
    if (AtomSideMenuItem?.childrens) {
      AtomSideMenuItem.childrens.forEach((x) => fnChangeAtomSideMenuItemOpen(x, menuId));
    }
    return AtomSideMenuItem;
  };
  return {
    atomSideMenu,
    fnSetAtomSideMenu,
    atomSideMenuItem,
    fnSetAtomSideMenuItem,
    fnSetAtomSideMenuItemOpen,
  };
};

export default useAtomMenuControl;
