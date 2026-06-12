/*
 * 01. 구분     : Interface
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - Interface
 * 03. 설명     : Auth 관련 interface 타입 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

export interface UserInfo {
  id: string;
  password: string;
}

export interface User {
  id: string;
  password?: string;
  name: string;
  role?: string;
}

export interface Credential {
  id: string;
  password: string;
}
