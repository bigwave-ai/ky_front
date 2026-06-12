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
  customer_id?: string; // 추가
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
  customer_id: "", // 추가
  status: "",
});

// 필요 시 파생 atom도 만들 수 있습니다.
export const isLoggedInAtom = atom((get) => !!get(userInfoAtom).user_id);
