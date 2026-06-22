'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/app/services/i18n/LanguageProvider';
import {
  Overlay,
  ModalWrap,
  Spinner,
  Message,
  SubMessage,
} from '../../../components/style/styleds/libs/modals/styled-modal-loading';

export type LoadingModalProps = {
  open: boolean;
  message?: string;
  subMessage?: string;
};

export default function LoadingModal({
  open,
  message,
  subMessage,
}: LoadingModalProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const modalUi = (
    <>
      <Overlay />
      <ModalWrap role="dialog" aria-modal="true" aria-live="polite">
        <Spinner aria-hidden />
        <Message>{message ?? t('불러오는 중입니다...')}</Message>
        {subMessage ? <SubMessage>{subMessage}</SubMessage> : null}
      </ModalWrap>
    </>
  );

  return createPortal(modalUi, document.body);
}
