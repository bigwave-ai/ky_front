'use client';
import Button from '@mui/material/Button';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { muiButtonCommonStyle } from '../../style/styleds/libs/muis/styled-mui-button-common';
import imag from "../../style/resources/css/image.module.css";

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 버튼 컴포넌트
 * 03. 설명     : 버튼 컴포넌트 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

import { Poppins, Heebo } from "next/font/google";

// Heebo 폰트 설정
const heebo = Heebo({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

// Poppins 폰트 설정
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#2e7d32',
    },
  },
});

interface MuiButtonCommonProps {
  color: any;
  btnId: string;
  btnNm: string;
  variant: any;
  fnClickBtn?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, btnId: string) => void;
}

const MuiButtonCustom = ({ color, btnId, btnNm, variant, fnClickBtn }: MuiButtonCommonProps) => {
  return (
    <ThemeProvider theme={theme}>
      <Button
        color={color}
        size="small"
        variant={variant}
        sx={{ ...muiButtonCommonStyle }}
        onClick={(e) => {
          if (typeof fnClickBtn == 'function') {
            fnClickBtn(e, btnId);
          }
        }}
      >
        {btnNm}
      </Button>
    </ThemeProvider>
  );
};

interface MuiButtonCustomUnitProps {
  btnId: string;
  btnNm: string;
  variant: any;
  fnClickBtn?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, btnId: string) => void;
}

//커스텀 메인 버튼
export const MuiCustomMainButton = ({ btnId, btnNm, variant, fnClickBtn }: MuiButtonCustomUnitProps) => {
  return <MuiButtonCustom color={'primary'} btnId={btnId} btnNm={btnNm} variant={variant} fnClickBtn={fnClickBtn}></MuiButtonCustom>;
};

//커스텀 서브 버튼
export const MuiCustomSubButton = ({ btnId, btnNm, variant, fnClickBtn }: MuiButtonCustomUnitProps) => {
  return <MuiButtonCustom color={'secondary'} btnId={btnId} btnNm={btnNm} variant={variant} fnClickBtn={fnClickBtn}></MuiButtonCustom>;
};

// 아이콘이 들어간 커스텀 버튼
interface CustomIconButtonProps {
  label: string;
  value?: string;
  iconName?: string; // 아이콘의 클래스 이름
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  iconOnClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void; // 아이콘 클릭 이벤트
  width?: string;
  height?: string;
  backgroundColor?: string; // 사용자 입력 배경색 (단일 색상)
  backgroundGradient?: string; // 사용자 입력 그라데이션 배경색
  color?: string; // 사용자 입력 텍스트 색상
  borderRadius?: string; // 사용자 입력 모서리 둥글기
  border?: string; // 사용자 입력 border 값
  fontSize?: string; // 사용자 입력 텍스트 크기
  fontStyle?: string; // 사용자 입력 텍스트 스타일
  fontWeight?: number; // 사용자 입력 텍스트 굵기
  lineHeight?: string; // 사용자 입력 줄 간격
  hoverColor?: string; // 사용자 입력 호버 색상
  margin?: string; // 사용자 입력 마진
  iconWidth?: string; // 아이콘 너비
  iconHeight?: string; // 아이콘 높이
  iconPosition?: "left" | "right"; // 아이콘 위치
  shadowEnabled?: boolean; // 그림자 활성화 여부
  contentAlignment?: "left" | "right" | "center" | "flex"; // 내용 정렬
  isEditable?: boolean; // 외부에서 레이블을 수정할 수 있는지 여부
  onLabelChange?: (newLabel: string) => void; // 레이블 변경 콜백
  isEditing?: boolean; // 외부에서 편집 모드 제어
  isSelected?: boolean; // 선택된 상태 여부
  selectedColor?: string; // 선택된 상태 배경색
  fnChangeInputText?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  editMode?: boolean;
  handleKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const themeIconCustom = createTheme({
  palette: {
    primary: {
      main: "#003876", // 기본 배경색
    },
  },
});

export const CustomIconButton = ({
  label,
  value,
  editMode,
  iconName,
  onClick,
  iconOnClick,
  width = "200px",
  height = "60px",
  backgroundColor = "#003876",
  backgroundGradient,
  color = "#FFFFFF",
  borderRadius = "10px",
  border,
  fontSize = "12px",
  fontStyle = "normal",
  fontWeight = 600,
  lineHeight = "normal",
  hoverColor = "#0070AF",
  margin = "0 auto",
  iconWidth = "14px",
  iconHeight = "14px",
  iconPosition = "left",
  shadowEnabled = true,
  contentAlignment = "center", // 기본 중앙 정렬
  onLabelChange,
  isEditing = false,
  isSelected = false, // 선택된 상태 여부
  selectedColor = "#0070AF", // 선택된 상태 기본 색상
  fnChangeInputText,
  handleKeyDown,
}: CustomIconButtonProps) => {
  const truncatedLabel =
    label && label.length > 20 ? `${label.slice(0, 20)}...` : label;

  const iconElement = iconName && (
    <div
      className={imag[iconName]}
      style={{
        width: iconWidth,
        height: iconHeight,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 auto",
      }}
      onClick={(e) => {
        e.stopPropagation(); // 부모 버튼의 클릭 이벤트 전파 방지
        if (iconOnClick) {
          iconOnClick(e);
        }
      }}
    />
  );

  return (
    <ThemeProvider theme={themeIconCustom}>
      <Button
        variant="contained"
        size="large"
        onClick={onClick}
        disableRipple={editMode} // 편집 모드일 때 리플 효과 제거
        disableElevation={editMode} // 편집 모드일 때 그림자 효과 제거
        startIcon={iconPosition === "left" ? iconElement : undefined}
        endIcon={iconPosition === "right" ? iconElement : undefined}
        sx={{
          display: "flex",
          justifyContent:
            contentAlignment === "flex" ? "space-between" : contentAlignment,
          alignItems: "center",
          width: width,
          height: height,
          backgroundColor: isSelected
            ? selectedColor
            : !backgroundGradient
            ? backgroundColor
            : undefined,
          backgroundImage: backgroundGradient,
          color: color,
          borderRadius: borderRadius,
          border: border || "none", // 전달된 border 값이 없으면 'none'
          fontSize: fontSize,
          fontStyle: fontStyle || `${heebo.style.fontFamily}`,
          fontWeight: fontWeight,
          lineHeight: lineHeight,
          boxShadow: shadowEnabled
            ? "0px 4px 4px 0px rgba(0, 0, 0, 0.25)"
            : "none",
          transition:
            "background-color 0.3s ease-in-out, background-image 0.3s ease-in-out",
          "&:hover": {
            backgroundColor: !hoverColor.includes("linear-gradient")
              ? hoverColor
              : undefined,
            backgroundImage: hoverColor.includes("linear-gradient")
              ? hoverColor
              : "none",
          },
          margin: margin,
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={value}
            // value={currentLabel}
            onChange={fnChangeInputText}
            // onBlur={handleInputBlur}
            onKeyDown={handleKeyDown} // 엔터 키 처리
            autoFocus
            style={{
              fontSize: fontSize,
              border: "none",
              outline: "none",
              width: "100%",
              backgroundColor: "transparent",
              color: color,
              textAlign: contentAlignment as "left" | "center" | "right",
              boxShadow: "none",
            }}
          />
        ) : (
          <div>{truncatedLabel}</div> // 최대 12글자 표시 후 '...'
        )}
      </Button>
    </ThemeProvider>
  );
};