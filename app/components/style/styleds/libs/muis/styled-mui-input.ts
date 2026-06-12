/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Mui
 * 03. 설명     : Mui Input 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

import React from "react";

const muiInputStyle = {
  "& .MuiSelect-select": {
    minHeight: "1rem !important",
  },
  "& .MuiOutlinedInput-input": {
    padding: "3px 12px",
    border: "1px solid #cccccc !important",
  },
  "& .MuiInputBase-inputAdorendEnd": {
    textAlign: "center",
  },
  "& .MuiInputAdorment-root": {
    marginLeft: "0px !important",
  },
};

export const muiTextFieldStyle: React.CSSProperties = {
  margin: "0px 3px",
  padding: "3px",
  backgroundColor: "#ffffff",
  borderRadius: 10,
};

export const muiTextAreaStyle: React.CSSProperties = {
  maxWidth: "calc(100% - 16px)",
  minWidth: "fit-content",
  margin: "3px 3px 0px 3px",
  padding: "5px",
  boxSizing: "content-box",
};

export const muiSelectStyle: React.CSSProperties = {
  minWidth: "80px",
  height: "25px",
  margin: "0px 3px",
  fontSize: "13px",
  backgroundColor: "#ffffff",
  verticalAlign: "middle",
  lineHeight: "initial",
  ...muiInputStyle,
};

export const muiCalendarStyle: React.CSSProperties = {
  minWidth: "150px",
  margin: "3px",
  fontSize: "13px",
  ...muiInputStyle,
};

export const muiformControlLabelStyle = {
  "& .MuiFormControlLabel-label": {
    fontSize: "13px",
  },
};

export const selectFormControlStyle = {
  display: "flex",
};

export const selectBoxStyle = {
  lineHeight: "35px", // 텍스트 수직 정렬
  fontSize: "14px", // 폰트 크기
};

/**
 * 🔹 로그인/공통 인풋용 OutlinedInput Root 스타일 (hover/focus 효과 포함)
 *  - backgroundColor, height, borderColor 등 "동적으로 바뀌는 값"은
 *    컴포넌트(MuiInputText2)에서만 주입하고,
 *  - 나머지 공통 효과(focus glow, hover, 폰트 등)는 여기서 관리
 */
export const muiLoginInputRootBase = {
  borderRadius: "10px",
  letterSpacing: "-0.5px",
  boxShadow: "0 0 0 0 rgba(3, 79, 164, 0)",
  transition:
    "box-shadow 0.16s ease, background-color 0.16s ease, border-color 0.16s ease",

  // 🔹 hover 시 살짝 강조
  "&:hover": {
    backgroundColor: "#F4F9FF",
  },
  "&:hover fieldset": {
    borderColor: "#1C6FD3",
  },

  // 🔹 focus 시 glow + 진한 파랑
  "&.Mui-focused": {
    backgroundColor: "#FFFFFF",
    boxShadow: "0 0 0 2px rgba(3, 79, 164, 0.45)",
  },
  "&.Mui-focused fieldset": {
    borderColor: "#034FA4",
  },

  // 🔹 disabled 시 연한 톤
  "&.Mui-disabled": {
    backgroundColor: "#E5E7EB",
    boxShadow: "none",
  },
  "&.Mui-disabled fieldset": {
    borderColor: "#D1D5DB",
  },

  // 텍스트 스타일
  "& input": {
    fontFamily: 'Heebo, "Noto Sans KR", sans-serif',
    fontSize: "16px",
  },

  // placeholder 스타일
  "& input::placeholder": {
    color: "#A0A1A4",
    fontFamily: "Heebo",
    fontSize: "16px",
    fontStyle: "normal",
    fontWeight: 400,
    lineHeight: "normal",
    letterSpacing: "-1px",
  },
};
