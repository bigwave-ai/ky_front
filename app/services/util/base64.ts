import { Base64 } from "js-base64";

/*
 * 01. 구분     : Service
 * 02. 타입     : -
 * 03. 업무구분  : 모든 권한
 * 03. 설명     : base64 기반 인코딩 변환
 * 04. 작성일자  : 2024.12.2
 * 05. 작성자   : 채승완
 */

export const base64Encode = (pw: string) => {
  return Base64.encode(pw);
};
