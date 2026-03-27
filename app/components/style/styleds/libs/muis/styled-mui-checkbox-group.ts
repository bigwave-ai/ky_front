import { Heebo } from "next/font/google";
import type { SxProps, Theme } from '@mui/material/styles'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든 권한 - 스타일 - Checkbox 그룹
 * 03. 설명     : Checkbox 그룹 스타일 정의
 * 04. 작성일자  : 2024.11.19
 * 05. 작성자   : 이우창
 */


const heebo = Heebo({
    subsets: ['latin'],
    weight: ['100','200','300','400','500','600','700','800','900'], // 사용할 폰트 굵기 설정
  });

export const muiCheckboxStyle = {
    "& .MuiSvgIcon-root": {
      fontSize: "20px", // 아이콘 크기 설정
    },
    color: "#C3C4C6", // 기본 색상
    "&.Mui-checked": {
      color: "#003876", // 선택된 색상
    },
  };
  
  export const muiLabelStyle = {
    marginRight: "20px", // 간격 설정
    color: "#312E37", // 텍스트 색상
    fontFamily: `${heebo.style.fontFamily}`,    
    fontSize: "14px", // 폰트 크기
    fontStyle: "normal", // 폰트 스타일
    fontWeight: 400, // 폰트 두께
    lineHeight: "normal", // 줄 간격
  };

  
/** 체크박스 자체 스타일 */
export const checkboxSx: SxProps<Theme> = {
  width: 24,
  height: 20,
  color: '#C3C4C6', // 기본 색상
  marginLeft:'9px',
  '&.Mui-checked': {
    color: '#4200FF',
  },
}

/** 라벨 텍스트 스타일 */
export const checkboxLabelSx: SxProps<Theme> = {
  '& .MuiFormControlLabel-label': {
    color: '#312E37',
    fontFamily: 'Pretendard',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: 400,
    lineHeight: 'normal',
    marginLeft:'3px'    
  },
}