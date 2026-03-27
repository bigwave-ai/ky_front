import { SxProps } from "@mui/material"

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Mui
 * 03. 설명     : Mui Button 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

export const muiButtonCommonStyle = {
  margin: '0px 3px',
  padding: '3px 10px',
  lineHeight: 'initial',
  fontSize: '13px',
};

/* ==================== 추가 버튼 ==================== */
export const muiButtonAddStyle: SxProps = {
  width: "80px",
  height: "30px",
  borderRadius: "10px",
  backgroundColor: "#0A00CE",
  color: "#FFF",
  fontSize: "12px",
  fontWeight: 400,
  boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
  "&:hover": {
    backgroundColor: "#0800b3",
  },
}

/* ==================== 조회 버튼 ==================== */
export const muiButtonSearchStyle: SxProps = {
  width: "80px",
  height: "30px",
  borderRadius: "10px",
  backgroundColor: "#0070AF",
  color: "#FFF",
  fontSize: "12px",
  fontWeight: 400,
  boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
  "&:hover": {
    backgroundColor: "#005f94",
  },
}

/* ==================== 삭제 버튼 ==================== */
export const muiButtonDeleteStyle: SxProps = {
  width: "80px",
  height: "30px",
  borderRadius: "10px",
  backgroundColor: "#CE0000",
  color: "#FFF",
  fontSize: "12px",
  fontWeight: 400,
  boxShadow: "0 4px 4px rgba(0,0,0,0.25)",
  "&:hover": {
    backgroundColor: "#005f94",
  },
}


export const muiButtonCustom = {
  backgroundColor: '#034FA4', // 파란색 배경
  color: '#FFFFFF',           // 흰색 텍스트
  borderRadius: '10px',       // 둥근 모서리
  fontFamily:'NanumSquareNeo, sans-serif', // 폰트 적용 부분
  fontSize: '20px',           // 텍스트 크기
  fontWeight: 'bold',         // 텍스트 굵기
  width: '100%',
  maxWidth: '548px',
  height: '53px',
  '&:hover': {
    backgroundColor: '#002b5e', // 마우스 오버 시 조금 더 진한 파란색
  },
};
