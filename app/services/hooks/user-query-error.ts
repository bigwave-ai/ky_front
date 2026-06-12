import modalDialog from '@/app/components/libs/modals/modal-dialog';
import { EnumDialogBtns } from '@/app/models/enums/enum-lib-group';
import { AxiosError, isAxiosError } from 'axios';
import { useCallback } from 'react';

interface UseQueryErrorProps {
  fnQueryError: (error: any) => void;
}

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - Error
 * 03. 설명     : Error 종류에 따른 에러 메세지
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

const useQueryError = (): UseQueryErrorProps => {
  const fnQueryError = useCallback((error: any) => {
    const axiosError: AxiosError = error;
    const response = error.response;
    const status = response?.data.status;
    const msg = response?.data.msg;
    switch (status) {
      case 401:
        modalDialog({
          dialogTitle: '알림',
          dialogContent: '인증이 필요합니다. 로그인 페이지로 이동 합니다.',
          dialogBtns: [
            {
              btnId: EnumDialogBtns.BTN_CONFIRM_ID,
              btnNm: EnumDialogBtns.BTN_CONFIRM_NM,
            },
          ],
          callback: () => {
            window.location.href = '/';
          },
        });
        break;
      case 403:
        modalDialog({
          dialogTitle: '알림',
          dialogContent: '전급 권한이 없습니다.',
          dialogBtns: [
            {
              btnId: EnumDialogBtns.BTN_CONFIRM_ID,
              btnNm: EnumDialogBtns.BTN_CONFIRM_NM,
            },
          ],
        });
        break;
      case 500:
        modalDialog({
          dialogTitle: '알림',
          dialogContent: msg,
          dialogBtns: [
            {
              btnId: EnumDialogBtns.BTN_CONFIRM_ID,
              btnNm: EnumDialogBtns.BTN_CONFIRM_NM,
            },
          ],
        });
        break;
      default:
        modalDialog({
          dialogTitle: '알림',
          dialogContent: msg,
          dialogBtns: [
            {
              btnId: EnumDialogBtns.BTN_CONFIRM_ID,
              btnNm: EnumDialogBtns.BTN_CONFIRM_NM,
            },
          ],
        });
    }
  }, []);
  return { fnQueryError };
};

export default useQueryError;
