"use client";

import { Suspense } from 'react';
import SigninClient from './signin-client';

/*
 * 01. 구분     : Credential Component
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - Login
 * 03. 설명     : 커스텀 로그인 화면 제공
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */

export default function Page() {
  /******************** 변수 영역 ********************/
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>로딩 중…</div>}>
      <SigninClient />
    </Suspense>
  );
}