import { Heebo } from "next/font/google";

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든 권한 - 스타일 - Select Box
 * 03. 설명     : Select Box 스타일 정의
 * 04. 작성일자  : 2024.11.19
 * 05. 작성자   : 이우창
 */
const heebo = Heebo({
    subsets: ['latin'],
    weight: ['100','200','300','400','500','600','700','800','900'], // 사용할 폰트 굵기 설정
  });
  
export const selectFormControlStyle = {
    display: "flex",
  };
  
export const selectBoxStyle = {
  lineHeight: "35px", // 텍스트 수직 정렬
  fontSize: "14px", // 폰트 크기
  fontFamily:'NanumSquareNeo, sans-serif', // 폰트 적용 부분
};