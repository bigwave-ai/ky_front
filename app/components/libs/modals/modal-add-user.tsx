'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from '@/app/components/style/styleds/libs/modals/styled-modal-add-user';
import WarningModal from '@/app/components/libs/modals/modal-warnning';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - 모달
 * 04. 설명     : 고객사 추가 모달 (유효성 검증 포함)
 * 05. 작성일자 : 2026.03.31
 * 06. 작성자   : 이우찬
 */

export type AddCompanyFormType = {
  accountId: string;
  password: string;
  passwordConfirm: string;
  companyName: string;
  businessType: string;
  handlingItem: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
};

type AddCompanyErrorsType = Partial<Record<keyof AddCompanyFormType, string>>;

type AddModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: AddCompanyFormType) => void | Promise<void>;
};

const INITIAL_FORM: AddCompanyFormType = {
  accountId: '',
  password: '',
  passwordConfirm: '',
  companyName: '',
  businessType: '',
  handlingItem: '',
  managerName: '',
  managerPhone: '',
  managerEmail: '',
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

const validateForm = (form: AddCompanyFormType): AddCompanyErrorsType => {
  const errors: AddCompanyErrorsType = {};

  if (!form.accountId.trim()) errors.accountId = requiredMessage('아이디');
  if (!form.password.trim()) errors.password = requiredMessage('비밀번호');
  if (!form.passwordConfirm.trim()) errors.passwordConfirm = requiredMessage('비밀번호 재입력');
  if (!form.companyName.trim()) errors.companyName = requiredMessage('고객사');
  if (!form.businessType.trim()) errors.businessType = requiredMessage('업종');
  if (!form.handlingItem.trim()) errors.handlingItem = requiredMessage('취급품목');
  if (!form.managerName.trim()) errors.managerName = requiredMessage('담당자 명');
  if (!form.managerPhone.trim()) errors.managerPhone = requiredMessage('담당자 연락처');
  if (!form.managerEmail.trim()) errors.managerEmail = requiredMessage('담당자 이메일');

  if (!errors.password && !errors.passwordConfirm && form.password !== form.passwordConfirm) {
    errors.passwordConfirm = '*비밀번호와 비밀번호 재입력이 일치하지 않습니다.';
  }

  if (!errors.managerPhone) {
    const phoneDigits = onlyNumber(form.managerPhone);
    if (phoneDigits.length !== 11) {
      errors.managerPhone = '*담당자 연락처는 11자리 숫자를 입력해주세요.';
    }
  }

  if (!errors.managerEmail && !EMAIL_REGEX.test(form.managerEmail.trim())) {
    errors.managerEmail = '*담당자 이메일 형식이 올바르지 않습니다. (@ 포함)';
  }

  return errors;
};

export default function AddModal({ open, onClose, onSubmit }: AddModalProps) {
  /******************** 변수 영역 ********************/
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<AddCompanyFormType>(INITIAL_FORM);
  const [errors, setErrors] = useState<AddCompanyErrorsType>({});

  const [warningOpen, setWarningOpen] = useState(false);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningDetail, setWarningDetail] = useState('');

  /******************** 함수 영역 ********************/
  const hasError = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const openWarning = (title: string, detail: string) => {
    setWarningTitle(title);
    setWarningDetail(detail);
    setWarningOpen(true);
  };

  const handleChange = (key: keyof AddCompanyFormType, value: string) => {
    const nextValue = key === 'managerPhone' ? formatPhone(value) : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm(form);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const lines = Object.values(nextErrors).filter(Boolean) as string[];
      openWarning('입력값 오류', `아래 항목을 확인해주세요.\n\n${lines.map((m) => `• ${m}`).join('\n')}`);
      return;
    }

    try {
      await Promise.resolve(
        onSubmit({
          ...form,
          accountId: form.accountId.trim(),
          password: form.password.trim(),
          passwordConfirm: form.passwordConfirm.trim(),
          companyName: form.companyName.trim(),
          businessType: form.businessType.trim(),
          handlingItem: form.handlingItem.trim(),
          managerName: form.managerName.trim(),
          managerPhone: formatPhone(form.managerPhone),
          managerEmail: form.managerEmail.trim(),
        }),
      );
    } catch (e: any) {
      openWarning(
        '고객사 추가 실패',
        e?.message ?? '고객사 추가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      );
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
    if (!open) return;
    setForm(INITIAL_FORM);
    setErrors({});
    setWarningOpen(false);
    setWarningTitle('');
    setWarningDetail('');
  }, [open]);

  if (!mounted || !open) return null;

  const modalUi = (
    <>
      <S.Overlay onClick={onClose} />
      <S.ModalWrap role="dialog" aria-modal="true" aria-labelledby="add-company-title">
        <S.ModalHead>
          <S.HeadBadge>AI Agent 기반</S.HeadBadge>
          <S.HeadTitle>컴프레셔 현황 관리 시스템</S.HeadTitle>
          <S.CloseButton type="button" onClick={onClose} aria-label="닫기">
            ×
          </S.CloseButton>
        </S.ModalHead>

        <S.ModalBody>
          <S.BodyTitle id="add-company-title">고객사 추가하기</S.BodyTitle>
          <S.BodyDescription>추가하고자 하는 고객사의 정보를 입력해주세요.</S.BodyDescription>

          <S.Form>
            <S.Field>
              <S.Label>아이디</S.Label>
              <S.Input
                value={form.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                $error={Boolean(errors.accountId)}
                placeholder="아이디를 입력해주세요."
              />
              {errors.accountId && <S.ErrorText>{errors.accountId}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>비밀번호</S.Label>
              <S.Input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                $error={Boolean(errors.password)}
                placeholder="비밀번호를 입력해주세요."
              />
              {errors.password && <S.ErrorText>{errors.password}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>비밀번호 재입력</S.Label>
              <S.Input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                $error={Boolean(errors.passwordConfirm)}
                placeholder="비밀번호를 다시 입력해주세요."
              />
              {errors.passwordConfirm && <S.ErrorText>{errors.passwordConfirm}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>고객사</S.Label>
              <S.Input
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                $error={Boolean(errors.companyName)}
                placeholder="기업/기관 명을 입력해주세요."
              />
              {errors.companyName && <S.ErrorText>{errors.companyName}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>업종</S.Label>
              <S.Input
                value={form.businessType}
                onChange={(e) => handleChange('businessType', e.target.value)}
                $error={Boolean(errors.businessType)}
                placeholder="기업/기관의 업종을 입력해주세요."
              />
              {errors.businessType && <S.ErrorText>{errors.businessType}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>취급품목</S.Label>
              <S.Input
                value={form.handlingItem}
                onChange={(e) => handleChange('handlingItem', e.target.value)}
                $error={Boolean(errors.handlingItem)}
                placeholder="취급 품목을 입력해주세요."
              />
              {errors.handlingItem && <S.ErrorText>{errors.handlingItem}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>담당자 명</S.Label>
              <S.Input
                value={form.managerName}
                onChange={(e) => handleChange('managerName', e.target.value)}
                $error={Boolean(errors.managerName)}
                placeholder="담당자 명을 입력해주세요."
              />
              {errors.managerName && <S.ErrorText>{errors.managerName}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>담당자 연락처</S.Label>
              <S.Input
                value={form.managerPhone}
                onChange={(e) => handleChange('managerPhone', e.target.value)}
                $error={Boolean(errors.managerPhone)}
                placeholder="'-'을 제외하고 입력해주세요."
                inputMode="numeric"
              />
              {errors.managerPhone && <S.ErrorText>{errors.managerPhone}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>담당자 이메일</S.Label>
              <S.Input
                value={form.managerEmail}
                onChange={(e) => handleChange('managerEmail', e.target.value)}
                $error={Boolean(errors.managerEmail)}
                placeholder="담당자 이메일을 입력해주세요."
              />
              {errors.managerEmail && <S.ErrorText>{errors.managerEmail}</S.ErrorText>}
            </S.Field>
          </S.Form>
        </S.ModalBody>

        <S.ModalFooter>
          <S.SubmitButton type="button" onClick={handleSubmit}>
            추가하기
          </S.SubmitButton>
        </S.ModalFooter>

        {hasError && <S.ErrorSummary>입력값을 다시 확인해주세요.</S.ErrorSummary>}
      </S.ModalWrap>

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
