'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from '@/app/components/style/styleds/libs/modals/styled-modal-update-user';
import WarningModal from '@/app/components/libs/modals/modal-warnning';
import { useTranslation } from '@/app/services/i18n/LanguageProvider';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 모달
 * 04. 설명     : 고객사 정보 변경 모달 (유효성 검증/삭제 확인 포함)
 * 05. 작성일자 : 2026.03.31
 * 06. 작성자   : 이우창
 */

export type UpdateCompanyInitialDataType = {
  customerId: string;
  accountId: string;
  companyName: string;
  businessType: string;
  handlingItem: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
};

export type UpdateCompanyFormType = UpdateCompanyInitialDataType & {
  newPassword: string;
  newPasswordConfirm: string;
};

type UpdateCompanyErrorsType = Partial<Record<keyof UpdateCompanyFormType, string>>;

type UpdateModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: UpdateCompanyFormType) => void | Promise<void>;
  onDelete: (customerId: string) => void | Promise<void>;
  initialData: UpdateCompanyInitialDataType | null;
  isSubmitting?: boolean;
  isDeleting?: boolean;
};

const INITIAL_FORM: UpdateCompanyFormType = {
  customerId: '',
  accountId: '',
  companyName: '',
  businessType: '',
  handlingItem: '',
  managerName: '',
  managerPhone: '',
  managerEmail: '',
  newPassword: '',
  newPasswordConfirm: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const onlyNumber = (value: string) => value.replace(/\D/g, '');

const formatPhone = (value: string) => {
  const digits = onlyNumber(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

const requiredMessage = (label: string) => `*${label}가 입력이 되지 않았습니다.`;

const validateForm = (form: UpdateCompanyFormType): UpdateCompanyErrorsType => {
  const errors: UpdateCompanyErrorsType = {};

  // 필수: 아이디/고객사명(핵심 식별값)만. 나머지(업종/취급품목/담당자/연락처/이메일)는
  // 일부 항목만 수정하는 경우를 허용하기 위해 선택값으로 둔다.
  if (!form.accountId.trim()) errors.accountId = requiredMessage('아이디');
  if (!form.companyName.trim()) errors.companyName = requiredMessage('고객사');

  // 연락처/이메일은 "값이 입력된 경우에만" 형식 검증(빈 값은 허용)
  const phone = form.managerPhone.trim();
  if (phone && onlyNumber(phone).length !== 11) {
    errors.managerPhone = '*담당자 연락처는 11자리 숫자를 입력해주세요.';
  }

  const email = form.managerEmail.trim();
  if (email && !EMAIL_REGEX.test(email)) {
    errors.managerEmail = '*담당자 이메일 형식이 올바르지 않습니다. (@ 포함)';
  }

  const hasAnyNewPassword = form.newPassword.trim() || form.newPasswordConfirm.trim();
  if (hasAnyNewPassword) {
    if (!form.newPassword.trim()) {
      errors.newPassword = '*새로운 비밀번호가 입력이 되지 않았습니다.';
    }
    if (!form.newPasswordConfirm.trim()) {
      errors.newPasswordConfirm = '*새로운 비밀번호 재입력이 입력이 되지 않았습니다.';
    }
    if (
      form.newPassword.trim() &&
      form.newPasswordConfirm.trim() &&
      form.newPassword !== form.newPasswordConfirm
    ) {
      errors.newPasswordConfirm = '*새로운 비밀번호와 재입력이 일치하지 않습니다.';
    }
  }

  return errors;
};

export default function UpdateUserModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isSubmitting = false,
  isDeleting = false,
}: UpdateModalProps) {
  /******************** 변수 영역 ********************/
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<UpdateCompanyFormType>(INITIAL_FORM);
  const [errors, setErrors] = useState<UpdateCompanyErrorsType>({});

  const [warningOpen, setWarningOpen] = useState(false);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningDetail, setWarningDetail] = useState('');

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  /******************** 함수 영역 ********************/
  const hasError = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const isBusy = isSubmitting || isDeleting;

  const openWarning = (title: string, detail: string) => {
    setWarningTitle(title);
    setWarningDetail(detail);
    setWarningOpen(true);
  };

  const handleChange = (key: keyof UpdateCompanyFormType, value: string) => {
    const nextValue = key === 'managerPhone' ? formatPhone(value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (isBusy) return;

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const lines = Object.values(nextErrors).filter(Boolean) as string[];
      openWarning(t('입력값 오류'), `${t('아래 항목을 확인해주세요.')}\n\n${lines.map((m) => `• ${t(m)}`).join('\n')}`);
      return;
    }

    try {
      await Promise.resolve(
        onSubmit({
          ...form,
          accountId: form.accountId.trim(),
          companyName: form.companyName.trim(),
          businessType: form.businessType.trim(),
          handlingItem: form.handlingItem.trim(),
          managerName: form.managerName.trim(),
          managerPhone: formatPhone(form.managerPhone),
          managerEmail: form.managerEmail.trim(),
          newPassword: form.newPassword.trim(),
          newPasswordConfirm: form.newPasswordConfirm.trim(),
        }),
      );
    } catch (e: any) {
      openWarning(t('고객사 정보 변경 실패'), e?.message ?? t('고객사 정보 변경 중 오류가 발생했습니다.'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (isBusy) return;
    setDeleteConfirmOpen(false);

    try {
      await Promise.resolve(onDelete(form.customerId));
    } catch (e: any) {
      openWarning(t('고객사 삭제 실패'), e?.message ?? t('고객사 삭제 중 오류가 발생했습니다.'));
    }
  };

  /******************** 실행 영역 ********************/
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
  }, [mounted, open]);

  useEffect(() => {
    if (!open || !initialData) return;

    setForm({
      customerId: initialData.customerId,
      accountId: initialData.accountId ?? '',
      companyName: initialData.companyName ?? '',
      businessType: initialData.businessType ?? '',
      handlingItem: initialData.handlingItem ?? '',
      managerName: initialData.managerName ?? '',
      managerPhone: formatPhone(initialData.managerPhone ?? ''),
      managerEmail: initialData.managerEmail ?? '',
      newPassword: '',
      newPasswordConfirm: '',
    });

    setErrors({});
    setWarningOpen(false);
    setWarningTitle('');
    setWarningDetail('');
    setDeleteConfirmOpen(false);
  }, [open, initialData]);

  if (!mounted || !open || !initialData) return null;

  const modalUi = (
    <>
      <S.Overlay onClick={isBusy ? undefined : onClose} />
      <S.ModalWrap role="dialog" aria-modal="true" aria-labelledby="update-company-title">
        <S.ModalHead>
          <S.HeadBadge>{t('AI Agent 기반')}</S.HeadBadge>
          <S.HeadTitle>{t('컴프레셔 현황 관리 시스템')}</S.HeadTitle>
          <S.CloseButton type="button" onClick={onClose} aria-label={t('닫기')} disabled={isBusy}>
            ×
          </S.CloseButton>
        </S.ModalHead>

        <S.ModalBody>
          <S.BodyTitle id="update-company-title">{t('고객사 정보변경')}</S.BodyTitle>
          <S.BodyDescription>{t('변경하고자 하는 고객사의 정보를 입력해주세요.')}</S.BodyDescription>

          <S.Form>
            <S.Field>
              <S.Label>{t('아이디')}</S.Label>
              <S.Input
                value={form.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                $error={Boolean(errors.accountId)}
                placeholder={t('아이디를 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.accountId && <S.ErrorText>{t(errors.accountId)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('새로운 비밀번호')}</S.Label>
              <S.Input
                type="password"
                value={form.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                $error={Boolean(errors.newPassword)}
                placeholder={t('새로운 비밀번호를 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.newPassword && <S.ErrorText>{t(errors.newPassword)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('새로운 비밀번호 재입력')}</S.Label>
              <S.Input
                type="password"
                value={form.newPasswordConfirm}
                onChange={(e) => handleChange('newPasswordConfirm', e.target.value)}
                $error={Boolean(errors.newPasswordConfirm)}
                placeholder={t('새로운 비밀번호를 다시 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.newPasswordConfirm && <S.ErrorText>{t(errors.newPasswordConfirm)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('고객사')}</S.Label>
              <S.Input
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                $error={Boolean(errors.companyName)}
                placeholder={t('기업/기관 명을 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.companyName && <S.ErrorText>{t(errors.companyName)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('업종')}</S.Label>
              <S.Input
                value={form.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                $error={Boolean(errors.businessType)}
                placeholder={t('기업/기관의 업종을 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.businessType && <S.ErrorText>{t(errors.businessType)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('취급품목')}</S.Label>
              <S.Input
                value={form.handlingItem}
                onChange={(e) => handleChange('handlingItem', e.target.value)}
                $error={Boolean(errors.handlingItem)}
                placeholder={t('취급 품목을 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.handlingItem && <S.ErrorText>{t(errors.handlingItem)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('담당자 명')}</S.Label>
              <S.Input
                value={form.managerName}
                onChange={(e) => handleChange('managerName', e.target.value)}
                $error={Boolean(errors.managerName)}
                placeholder={t('담당자 명을 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.managerName && <S.ErrorText>{t(errors.managerName)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('담당자 연락처')}</S.Label>
              <S.Input
                value={form.managerPhone}
                onChange={(e) => handleChange('managerPhone', e.target.value)}
                $error={Boolean(errors.managerPhone)}
                placeholder={t("'-'을 제외하고 입력해주세요.")}
                inputMode="numeric"
                disabled={isBusy}
              />
              {errors.managerPhone && <S.ErrorText>{t(errors.managerPhone)}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>{t('담당자 이메일')}</S.Label>
              <S.Input
                value={form.managerEmail}
                onChange={(e) => handleChange('managerEmail', e.target.value)}
                $error={Boolean(errors.managerEmail)}
                placeholder={t('담당자 이메일을 입력해주세요.')}
                disabled={isBusy}
              />
              {errors.managerEmail && <S.ErrorText>{t(errors.managerEmail)}</S.ErrorText>}
            </S.Field>
          </S.Form>
        </S.ModalBody>

        <S.ModalFooter>
          <S.DeleteButton type="button" onClick={() => setDeleteConfirmOpen(true)} disabled={isBusy}>
            {t('삭제')}
          </S.DeleteButton>

          <S.FooterRightActions>
            <S.ConfirmButton type="button" onClick={handleSubmit} disabled={isBusy}>
              {t('확인')}
            </S.ConfirmButton>
            <S.CancelButton type="button" onClick={onClose} disabled={isBusy}>
              {t('취소')}
            </S.CancelButton>
          </S.FooterRightActions>
        </S.ModalFooter>

        {hasError && <S.ErrorSummary>{t('입력값을 다시 확인해주세요.')}</S.ErrorSummary>}
      </S.ModalWrap>

      <WarningModal
        open={deleteConfirmOpen}
        title={t('삭제 확인')}
        detail={
          t('해당 고객사와 관련된 컴프레셔 장비 정보도 모두 삭제됩니다.\n정말로 삭제하시겠습니까?')
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmText={t('확인')}
        cancelText={t('취소')}
        showCancel
      />

      <WarningModal
        open={warningOpen}
        title={warningTitle}
        detail={warningDetail}
        onConfirm={() => setWarningOpen(false)}
        showCancel={false}
      />
    </>
  );

  return createPortal(modalUi, document.body);
}
