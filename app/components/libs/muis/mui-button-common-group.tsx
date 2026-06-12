'use client';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import HelpIcon from '@mui/icons-material/Help';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import OutBoxIcon from '@mui/icons-material/Outbox';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { muiButtonCommonStyle,muiButtonAddStyle,muiButtonSearchStyle,muiButtonDeleteStyle,muiButtonCustom,  } from '../../style/styleds/libs/muis/styled-mui-button-common';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import React from 'react';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 버튼 컴포넌트
 * 03. 설명     : 버튼 컴포넌트 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

const theme = createTheme({
  palette: {
    primary: {
      main: '#eeeeee',
    },
  },
});

interface MuiButtonCommonProps {
  children: string;
  endIcon: React.ReactNode;
  fnClickBtn?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const MuiButtonCommon = ({ children, endIcon, fnClickBtn }: MuiButtonCommonProps) => {
  return (
    <ThemeProvider theme={theme}>
      <Button color="primary" size="small" variant="contained" endIcon={endIcon} onClick={fnClickBtn} sx={{ ...muiButtonCommonStyle }}>
        {children}
      </Button>
    </ThemeProvider>
  );
};

interface MuiButtonCommonUnitProps {
  fnClickBtn?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

//목록 버튼
export const MuiListButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<FormatListBulletedIcon sx={{ color: '#004363' }} />} fnClickBtn={fnClickBtn}>
      목록
    </MuiButtonCommon>
  );
};

//조회 버튼
export const MuiSearchButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<SearchIcon sx={{ color: '#7f5ecc' }} />} fnClickBtn={fnClickBtn}>
      조회
    </MuiButtonCommon>
  );
};

//추가 버튼
export const MuiAddButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<AddCircleIcon sx={{ color: '#2196b3' }} />} fnClickBtn={fnClickBtn}>
      추가
    </MuiButtonCommon>
  );
};

//작성 버튼
export const MuiInputButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<TextFieldsIcon sx={{ color: '#02723e' }} />} fnClickBtn={fnClickBtn}>
      작성
    </MuiButtonCommon>
  );
};

//편집 버튼
export const MuiEditButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<EditIcon sx={{ color: '#f9a038' }} />} fnClickBtn={fnClickBtn}>
      편집
    </MuiButtonCommon>
  );
};

//저장 버튼
export const MuiSaveButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<SaveIcon sx={{ color: '#50c959' }} />} fnClickBtn={fnClickBtn}>
      저장
    </MuiButtonCommon>
  );
};

//제출 버튼
export const MuiSubmitButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<OutBoxIcon sx={{ color: '#02723e' }} />} fnClickBtn={fnClickBtn}>
      제출
    </MuiButtonCommon>
  );
};

//삭제 버튼
export const MuiDeleteButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<DeleteIcon sx={{ color: '#ff5c5d' }} />} fnClickBtn={fnClickBtn}>
      삭제
    </MuiButtonCommon>
  );
};

//출력 버튼
export const MuiPrintButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<PrintIcon sx={{ color: '#28a1e0' }} />} fnClickBtn={fnClickBtn}>
      출력
    </MuiButtonCommon>
  );
};

//도움말 버튼
export const MuiHelpButton = ({ fnClickBtn }: MuiButtonCommonUnitProps) => {
  return (
    <MuiButtonCommon endIcon={<HelpIcon sx={{ color: '#aeaeae' }} />} fnClickBtn={fnClickBtn}>
      도움말
    </MuiButtonCommon>
  );
};

interface Props {
  label: string; // ✅ 버튼에 표시할 텍스트
  onClick?: () => void;
}

/* 추가 버튼 */
export const MuiButtonAdd = ({ label, onClick }: Props) => {
  return (
    <Button sx={muiButtonAddStyle} onClick={onClick}>
      {label}
    </Button>
  );
};

/* 조회 버튼 */
export const MuiButtonSearch = ({ label, onClick }: Props) => {
  return (
    <Button sx={muiButtonSearchStyle} onClick={onClick}>
      {label}
    </Button>
  );
};


/* 삭제 버튼 */
export const MuiButtonDelete = ({ label, onClick }: Props) => {
  return (
    <Button sx={muiButtonDeleteStyle} onClick={onClick}>
      {label}
    </Button>
  );
};


//커스텀 버튼
interface CustomButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  width?: string;
  height?: string;
  backgroundColor?: string;
  hoverColor?: string;
  color?: string; // 글씨 색상
  fontSize?: string; // 폰트 크기
}

const themeCustom = createTheme({
  palette: {
    primary: {
      main: '#003876',  // 기본 배경색을 파란색으로 지정
    },
  },
});

export const CustomButton = ({
  label,
  icon,
  onClick,
  width,
  height,
  backgroundColor,
  hoverColor,
  color = '#FFFFFF', // 기본 글씨 색상은 흰색
  fontSize = '14px', // 기본 폰트 크기
}: CustomButtonProps) => {
  return (
    <ThemeProvider theme={themeCustom}>
      <Button
        variant="contained"
        size="large"
        onClick={onClick}
        endIcon={icon}
        sx={{
          ...muiButtonCustom, // 공통 스타일 적용
          width: width, // 개별 버튼의 너비
          height: height, // 개별 버튼의 높이
          backgroundColor: backgroundColor, // 개별 버튼의 배경색
          color: color, // 사용자 입력 글씨 색상
          fontSize: fontSize, // 사용자 입력 폰트 크기
          // fontFamily:`${heebo.style.fontFamily}`,
          fontFamily:'Heebo', // 폰트 적용 부분
          fontWeight:500,
          '&:hover': {
            backgroundColor: hoverColor, // 개별 버튼의 hover 색상
          },
        }}
      >
        {label}
      </Button>
    </ThemeProvider>
  );
};
