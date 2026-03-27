// app/models/atoms/atom-user-info.ts
"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

/*
 * 01. 구분     : 전역 상태 관리 (Jotai)
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 전역 상태 관리
 * 03. 설명     : 유저 정보 전역 상태 제공 (localStorage 영속)
 * 04. 작성일자  : 2024.10.11 (Jotai로 전환)
 * 05. 작성자   : 이우창
 */

export type UserInfoState = {
  user_id: string;
  // user_id_uuid?: string; // ✅ (현재는 토큰/응답에서 제거할 예정이라면 나중에 삭제 가능)
  name?: string;
  email?: string;
  role?: string;
  contact?: string;

  // ✅ 추가: 사용자 상태 (예: "가입신청", "활성화" 등)
  status?: string;
};

// localStorage 키는 기존 recoilPersist의 "session"과 충돌 없게 분리
export const userInfoAtom = atomWithStorage<UserInfoState>("session.userInfo", {
  user_id: "",
  // user_id_uuid: "", // 기존 유지
  status: "",       // ✅ 추가 (초기값에도 넣어줘야 controlled/TS 안정적)
});

// 필요 시 파생 atom도 만들 수 있습니다.
export const isLoggedInAtom = atom((get) => !!get(userInfoAtom).user_id);
