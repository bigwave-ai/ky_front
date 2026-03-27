'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import warnIcon from '@/app/components/style/resources/imgs/warnning_icon.png';
import {
  Overlay,
  ModalWrap,
  WarnImage,
  Title,
  Detail,
  Actions,
  Btn,
  BtnConfirm,
  BtnCancel,
} from '@/app/components/style/styleds/libs/modals/styled-modal-warning';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 모달
 * 03. 설명     : 경고 메시지 모달 (단일 확인 버튼 모드 지원)
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */

export type WarningModalProps = {
  open: boolean;
  title: string;
  detail: string;
  onConfirm: () => void;
  onCancel?: () => void;      // 선택값: 없으면 취소 버튼/오버레이 닫기 숨김
  confirmText?: string;       // 기본 '확인'
  cancelText?: string;        // 기본 '취소'
  showCancel?: boolean;       // 기본 true, false면 취소 버튼 숨김
};

export default function WarningModal({
  open,
  title,
  detail,
  onConfirm,
  onCancel,
  confirmText = '확인',
  cancelText = '취소',
  showCancel = true,
}: WarningModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // (선택) 모달 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (!mounted) return;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const canCancel = Boolean(onCancel) && showCancel;

  const modalUi = (
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
    <>
      <Overlay onClick={canCancel ? onCancel : undefined} />
      <ModalWrap role="dialog" aria-modal="true" aria-labelledby="warn-title">
        <WarnImage>
          <Image src={warnIcon} alt="경고" fill sizes="64px" style={{ objectFit: 'contain' }} />
        </WarnImage>

        <Title id="warn-title">{title}</Title>
        <Detail>{detail}</Detail>

        <Actions>
          <BtnConfirm as={Btn} onClick={onConfirm}>{confirmText}</BtnConfirm>
          {canCancel && <BtnCancel as={Btn} onClick={onCancel}>{cancelText}</BtnCancel>}
        </Actions>
      </ModalWrap>
    </>
  );

  // 무조건 body에 붙여서 header/lsb 포함 전체를 덮게 함
  return createPortal(modalUi, document.body);
}
