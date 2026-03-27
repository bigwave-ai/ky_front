'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import amc from '../../style/resources/css/admin.module.css'
import imag from '../../style/resources/css/image.module.css'
import {
  AtomSideMenuItem,
  type AtomSideMenuItemType,
} from '@/app/models/atoms/atom-side-menu'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분  : 관리자권한 - Layout
 * 03. 설명     : 관리자 좌측 사이드바(LSB)
 * 04. 작성일자  : 2025.08.27
 * 05. 작성자   : 이우창
 */

export default function LayoutAdminLsb() {
  /******************** 변수 영역 ********************/
  const pathname = usePathname()
  const router = useRouter()
  const [, setSelected] = useAtom(AtomSideMenuItem)

  const menuItems: AtomSideMenuItemType[] = [
    {
      menuId: 'structured',
      menuNm: '정형 데이터',
      path: '/structureddata',
      isOpen: false,
      isButton: false,
    },
    {
      menuId: 'text',
      menuNm: '텍스트 데이터',
      path: '/textdata',
      isOpen: false,
      isButton: false,
    },
    {
      menuId: 'video',
      menuNm: '영상 데이터',
      path: '/videodata',
      isOpen: false,
      isButton: false,
    },
  ]

  const iconMap: Record<string, string> = {
    structured: imag.structured_data_icon,
    text: imag.text_data_icon,
    video: imag.video_data_icon,
  }

  /******************** 함수 영역 ********************/
  const handleSelect = (item: AtomSideMenuItemType) => {
    setSelected(item)
    if (pathname !== item.path) router.push(item.path)
  }

  const isActive = (path: string) =>
    pathname === path || (pathname?.startsWith(path + '/') ?? false)

  /******************** 수행 영역 ********************/
  return (
    <div className={amc.lsb}>
      <div className={amc.lsb_inner}>
        <div className={amc.lsb_section_title}>MENU</div>

        <nav className={amc.lsb_nav}>
          {menuItems.map((item) => (
            <button
              key={item.menuId}
              type="button"
              onClick={() => handleSelect(item)}
              className={`${amc.lsb_item} ${isActive(item.path) ? amc.lsb_item_active : ''}`}
              aria-current={isActive(item.path) ? 'page' : undefined}
              aria-label={item.menuNm}
              title={item.menuNm}
            >
              <div className={iconMap[item.menuId]} />
              <span className={amc.lsb_item_label}>{item.menuNm}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
