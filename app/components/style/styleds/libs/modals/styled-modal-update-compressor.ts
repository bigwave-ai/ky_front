'use client';

import styled, { css } from 'styled-components';

type FieldProps = {
  $error?: boolean;
};

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 21000;
`;

export const ModalWrap = styled.div`
  position: fixed;
  z-index: 21001;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(620px, calc(100vw - 28px));
  max-height: 92vh;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 14px 36px rgba(28, 50, 87, 0.18);
  display: flex;
  flex-direction: column;
`;

export const ModalHead = styled.div`
  position: relative;
  padding: 16px 18px 14px;
  background: linear-gradient(90deg, #b3b6f0 0%, #efb8bf 100%);
  display: grid;
  justify-items: center;
  gap: 8px;
`;

export const HeadBadge = styled.div`
  height: 26px;
  padding: 4px 16px;
  border-radius: 999px;
  background: #32489f;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
`;

export const HeadTitle = styled.h3`
  margin: 0;
  color: #3e499c;
  text-align: center;
  font-family: Pretendard;
  font-size: 28px;
  font-weight: 700;
  line-height: 48px;
  letter-spacing: -1.6px;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 12px;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  color: #243a87;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
`;

export const ModalBody = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 24px 12px;
`;

export const BodyTitle = styled.h2`
  margin: 0;
  color: #000;
  text-align: center;
  font-family: Heebo;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -1.6px;
`;

export const BodyDescription = styled.p`
  margin: 10px 0 18px;
  text-align: center;
  color: #8f8f92;
  font-size: 16px;
  font-weight: 500;
`;

export const Form = styled.div`
  display: grid;
  gap: 20px;
`;

export const Field = styled.div`
  display: grid;
  gap: 6px;
`;

export const Label = styled.label`
  color: #2f2f34;
  font-size: 16px;
  font-weight: 700;
`;

const fieldBase = css<FieldProps>`
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #b5d8f6;
  background: #f8fbff;
  color: #1f2a37;
  font-size: 15px;
  font-weight: 500;
  padding: 0 12px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #72aee0;
    box-shadow: 0 0 0 2px rgba(68, 141, 200, 0.15);
  }

  ${({ $error }) =>
    $error &&
    css`
      border-color: #e05050;
      box-shadow: 0 0 0 2px rgba(224, 80, 80, 0.12);
      background: #fffafa;
    `}
`;

export const Input = styled.input<FieldProps>`
  ${fieldBase}
`;

export const Select = styled.select<FieldProps>`
  ${fieldBase}
`;

export const ErrorText = styled.div`
  color: #e54848;
  font-size: 12px;
  font-weight: 700;
`;

export const ModalFooter = styled.div`
  flex-shrink: 0;
  padding: 12px 24px 16px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

export const FooterRightActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ActionButton = styled.button`
  height: 44px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: 0;
  padding: 0 36px;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const DeleteButton = styled(ActionButton)`
  background: #f56565;
  color: #fff;
`;

export const ConfirmButton = styled(ActionButton)`
  background: linear-gradient(180deg, #1d5dab 0%, #15529c 100%);
  color: #fff;
`;

export const CancelButton = styled(ActionButton)`
  background: #fff;
  color: #15529c;
  border: 1px solid #2f74c0;
`;

export const ErrorSummary = styled.div`
  padding: 0 24px 14px;
  color: #e54848;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
`;
