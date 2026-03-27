import axios, { AxiosError } from 'axios';
import modalDialog from '../../components/libs/modals/modal-dialog';
import { EnumDialogBtns } from '../../models/enums/enum-lib-group';

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - axios
 * 03. 설명     : axios 기능 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleRequestError = (error: AxiosError | Error) => {
  if (axios.isAxiosError(error)) {
    modalDialog({
      dialogTitle: '오류',
      dialogContent: error.response?.data.message,
      dialogBtns: [
        {
          btnId: EnumDialogBtns.BTN_CONFIRM_ID,
          btnNm: EnumDialogBtns.BTN_CONFIRM_NM,
        },
      ],
      callback: (params: void) => {
        console.log(params);
      },
    });
  }
};

const axiosUtil = {
  get: async (url: string, params = {}) => {
    try {
      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return handleRequestError(error);
      }
    }
  },
  post: async (url: string, data = {}) => {
    try {
      const response = await axiosInstance.post(url, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return handleRequestError(error);
      }
    }
  },
  // PUT, PATCH, DELETE 등의 다른 HTTP 메서드도 필요한 경우 추가할 수 있습니다.
};

export default axiosUtil;
