'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import systemLogo from '@/app/components/style/resources/imgs/system_logo_image_x2.png'
import {
  Overlay,
  ModalWrap,
  LogoWrap,
  Title,
  Detail,
  Actions,
  BtnPrimary,
  BtnGhost,
} from '@/app/components/style/styleds/libs/modals/styled-modal-common'

export type CommonModalProps = {
  open: boolean
  title: string
  detail: string
  confirmText?: string
  onConfirm: () => void

  cancelText?: string
  onCancel?: () => void
  showCancel?: boolean
}

export default function CommonModal({
  open,
  title,
  detail,
  confirmText = '확인',
  onConfirm,
  cancelText = '닫기',
  onCancel,
  showCancel = true,
}: CommonModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // (선택) 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (!mounted) return
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mounted])

  if (!open || !mounted) return null

  const canCancel = Boolean(onCancel) && showCancel

  const modalUi = (
    <>
      <Overlay onClick={canCancel ? onCancel : undefined} />
      <ModalWrap role="dialog" aria-modal="true" aria-labelledby="common-title">
        <LogoWrap>
          <Image
            src={systemLogo}
            alt="SAD/SDD 문서 자동화 시스템"
            fill
            sizes="180px"
            priority
            style={{ objectFit: 'contain' }}
          />
        </LogoWrap>

        <Title id="common-title">{title}</Title>
        <Detail>{detail}</Detail>

        <Actions>
          <BtnPrimary onClick={onConfirm}>{confirmText}</BtnPrimary>
          {canCancel && <BtnGhost onClick={onCancel}>{cancelText}</BtnGhost>}
        </Actions>
      </ModalWrap>
    </>
  )

  // ✅ 무조건 body에 붙여서 header/lsb 포함 전체를 덮게 함
  return createPortal(modalUi, document.body)
}
