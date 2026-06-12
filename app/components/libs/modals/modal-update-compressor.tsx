'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import * as S from '@/app/components/style/styleds/libs/modals/styled-modal-update-compressor';
import WarningModal from '@/app/components/libs/modals/modal-warnning';
import type { CompressorSelectOptionType } from './modal-add-compressor';

export type UpdateCompressorInitialDataType = {
  deviceId: string;
  serialNumber: string;
  deviceName: string;
  deviceTypeCode: string;
  dataTypeCode: string;
  equipmentPower: string;
  equipmentNumber: string;
};

export type UpdateCompressorFormType = UpdateCompressorInitialDataType;

type UpdateCompressorErrorsType = Partial<Record<keyof UpdateCompressorFormType, string>>;

type UpdateCompressorModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: UpdateCompressorFormType) => void | Promise<void>;
  onDelete: (deviceId: string) => void | Promise<void>;
  initialData: UpdateCompressorInitialDataType | null;
  deviceTypeOptions: CompressorSelectOptionType[];
  dataTypeOptions: CompressorSelectOptionType[];
  isSubmitting?: boolean;
  isDeleting?: boolean;
};

const INITIAL_FORM: UpdateCompressorFormType = {
  deviceId: '',
  serialNumber: '',
  deviceName: '',
  deviceTypeCode: '',
  dataTypeCode: '',
  equipmentPower: '',
  equipmentNumber: '',
};

const SERIAL_REGEX = /^\d{10}$/;
const NUMERIC_REGEX = /^\d+(\.\d+)?$/;
const INT_REGEX = /^\d+$/;
const DEVICE_NAME_MAX_LENGTH = 100;

const onlyDigits = (value: string) => value.replace(/\D/g, '');
const normalizePower = (value: string) => {
  const raw = value.replace(/[^0-9.]/g, '');
  const parts = raw.split('.');
  if (parts.length <= 1) return raw;
  return `${parts[0]}.${parts.slice(1).join('')}`;
};

const validateForm = (form: UpdateCompressorFormType): UpdateCompressorErrorsType => {
  const errors: UpdateCompressorErrorsType = {};
  if (!form.deviceId) errors.deviceId = '*장비 ID가 없습니다.';
  if (!SERIAL_REGEX.test(form.serialNumber)) errors.serialNumber = '*시리얼 번호는 10자리 숫자여야 합니다.';
  if (!form.deviceName.trim()) errors.deviceName = '*장비 명이 입력되지 않았습니다.';
  if (form.deviceName.trim().length > DEVICE_NAME_MAX_LENGTH) {
    errors.deviceName = `*장비 명은 ${DEVICE_NAME_MAX_LENGTH}자 이하로 입력해주세요.`;
  }
  if (!form.deviceTypeCode) errors.deviceTypeCode = '*장비 타입을 선택해주세요.';
  if (!form.dataTypeCode) errors.dataTypeCode = '*데이터 타입을 선택해주세요.';
  if (!NUMERIC_REGEX.test(form.equipmentPower)) errors.equipmentPower = '*장비 마력은 숫자만 입력 가능합니다.';
  if (!INT_REGEX.test(form.equipmentNumber)) errors.equipmentNumber = '*장비 번호는 숫자만 입력 가능합니다.';
  return errors;
};

export default function UpdateCompressorModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  deviceTypeOptions,
  dataTypeOptions,
  isSubmitting = false,
  isDeleting = false,
}: UpdateCompressorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<UpdateCompressorFormType>(INITIAL_FORM);
  const [errors, setErrors] = useState<UpdateCompressorErrorsType>({});

  const [warningOpen, setWarningOpen] = useState(false);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningDetail, setWarningDetail] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const hasError = useMemo(() => Object.keys(errors).length > 0, [errors]);
  const isBusy = isSubmitting || isDeleting;

  const openWarning = (title: string, detail: string) => {
    setWarningTitle(title);
    setWarningDetail(detail);
    setWarningOpen(true);
  };

  const handleChange = (key: keyof UpdateCompressorFormType, value: string) => {
    let nextValue = value;
    if (key === 'serialNumber') nextValue = onlyDigits(value).slice(0, 10);
    if (key === 'equipmentNumber') nextValue = onlyDigits(value);
    if (key === 'equipmentPower') nextValue = normalizePower(value);
    if (key === 'deviceName') nextValue = value.slice(0, DEVICE_NAME_MAX_LENGTH);

    setForm((prev) => ({ ...prev, [key]: nextValue }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async () => {
    if (isBusy) return;
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
          deviceName: form.deviceName.trim(),
        }),
      );
    } catch (e: any) {
      openWarning('컴프레셔 수정 실패', e?.message ?? '컴프레셔 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (isBusy) return;
    setDeleteConfirmOpen(false);

    try {
      await Promise.resolve(onDelete(form.deviceId));
    } catch (e: any) {
      openWarning('컴프레셔 삭제 실패', e?.message ?? '컴프레셔 삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => setMounted(true), []);

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
    setForm(initialData);
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
      <S.ModalWrap role="dialog" aria-modal="true" aria-labelledby="update-compressor-title">
        <S.ModalHead>
          <S.HeadBadge>AI Agent 기반</S.HeadBadge>
          <S.HeadTitle>컴프레셔 현황 관리 시스템</S.HeadTitle>
          <S.CloseButton type="button" onClick={onClose} aria-label="닫기">×</S.CloseButton>
        </S.ModalHead>

        <S.ModalBody>
          <S.BodyTitle id="update-compressor-title">컴프레셔 장비 정보변경</S.BodyTitle>
          <S.BodyDescription>변경할 컴프레셔 장비 정보를 입력해주세요.</S.BodyDescription>

          <S.Form>
            <S.Field>
              <S.Label>시리얼 번호</S.Label>
              <S.Input
                value={form.serialNumber}
                onChange={(e) => handleChange('serialNumber', e.target.value)}
                $error={Boolean(errors.serialNumber)}
                inputMode="numeric"
              />
              {errors.serialNumber && <S.ErrorText>{errors.serialNumber}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>장비 명</S.Label>
              <S.Input
                value={form.deviceName}
                onChange={(e) => handleChange('deviceName', e.target.value)}
                $error={Boolean(errors.deviceName)}
              />
              {errors.deviceName && <S.ErrorText>{errors.deviceName}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>장비 타입</S.Label>
              <S.Select
                value={form.deviceTypeCode}
                onChange={(e) => handleChange('deviceTypeCode', e.target.value)}
                $error={Boolean(errors.deviceTypeCode)}
              >
                <option value="">장비 타입을 선택해주세요.</option>
                {deviceTypeOptions.map((op) => (
                  <option key={op.code} value={op.code}>{op.name}</option>
                ))}
              </S.Select>
              {errors.deviceTypeCode && <S.ErrorText>{errors.deviceTypeCode}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>데이터 타입</S.Label>
              <S.Select
                value={form.dataTypeCode}
                onChange={(e) => handleChange('dataTypeCode', e.target.value)}
                $error={Boolean(errors.dataTypeCode)}
              >
                <option value="">데이터 타입을 선택해주세요.</option>
                {dataTypeOptions.map((op) => (
                  <option key={op.code} value={op.code}>{op.name}</option>
                ))}
              </S.Select>
              {errors.dataTypeCode && <S.ErrorText>{errors.dataTypeCode}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>장비 마력</S.Label>
              <S.Input
                value={form.equipmentPower}
                onChange={(e) => handleChange('equipmentPower', e.target.value)}
                $error={Boolean(errors.equipmentPower)}
                inputMode="decimal"
              />
              {errors.equipmentPower && <S.ErrorText>{errors.equipmentPower}</S.ErrorText>}
            </S.Field>

            <S.Field>
              <S.Label>장비 번호</S.Label>
              <S.Input
                value={form.equipmentNumber}
                onChange={(e) => handleChange('equipmentNumber', e.target.value)}
                $error={Boolean(errors.equipmentNumber)}
                inputMode="numeric"
              />
              {errors.equipmentNumber && <S.ErrorText>{errors.equipmentNumber}</S.ErrorText>}
            </S.Field>
          </S.Form>
        </S.ModalBody>

        <S.ModalFooter>
          <S.DeleteButton type="button" onClick={() => setDeleteConfirmOpen(true)} disabled={isBusy}>
            삭제
          </S.DeleteButton>

          <S.FooterRightActions>
            <S.ConfirmButton type="button" onClick={handleSubmit} disabled={isBusy}>
              확인
            </S.ConfirmButton>
            <S.CancelButton type="button" onClick={onClose} disabled={isBusy}>
              취소
            </S.CancelButton>
          </S.FooterRightActions>
        </S.ModalFooter>

        {hasError && <S.ErrorSummary>입력값을 다시 확인해주세요.</S.ErrorSummary>}
      </S.ModalWrap>

      <WarningModal
        open={deleteConfirmOpen}
        title="삭제 확인"
        detail="정말로 삭제하시겠습니까?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
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
