import { redirect } from 'next/navigation';

/**
 * 01. 구분     : View 컴포넌트
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - Login
 * 03. 설명     : 로그인 화면 리다이렉팅
 * 04. 작성일자  : 2024.11.06
 * 05. 작성자   : 이우창
 */

export default function Home() {
  // 리디렉트
  redirect('/signin');
}