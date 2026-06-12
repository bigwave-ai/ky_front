// app/components/style/styleds/libs/muis/styled-mui-date-picker.ts
import type { SxProps, Theme } from '@mui/material/styles'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Common
 * 03. 설명     : 공용 데이트피커 스타일(MUI sx)
 * 04. 작성일자  : 2025.08.25
 * 05. 작성자   : 이우창
 */

export const getDatePickerSx = (width: number | string = 150): SxProps<Theme> => ({
  width,

  // 🔹 전체 입력 박스 (텍스트 인풋이랑 톤 맞추기) - ✅ 1.25배 → 1.00배 원복
  '& .MuiInputBase-root': {
    height: 32, // 35 / 1.25 = 28
    borderRadius: '6px', // 7 / 1.25 = 5.6 → 실사용 6px
    backgroundColor: '#FFFFFF',
    paddingRight: '8px', // 10 / 1.25 = 8

    transition:
      'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, transform 0.12s ease',
  },

  // 🔹 기본 아웃라인
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#D3D3D3',
  },

  // 🔹 hover
  '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#B3C5FF',
  },
  '& .MuiInputBase-root:hover': {
    boxShadow: '0 3px 10px rgba(59, 111, 220, 0.16)',
    transform: 'translateY(-1px)',
  },

  // 🔹 focus
  '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#3B6FDC',
  },
  '& .MuiInputBase-root.Mui-focused': {
    background: 'linear-gradient(135deg, #FFFFFF, #F5F7FF)',
    boxShadow: '0 0 0 2px rgba(59, 111, 220, 0.25)',
    transform: 'translateY(-1px)',
  },

  // 🔹 입력 텍스트 / placeholder - ✅ 1.25배 → 1.00배 원복
  '& .MuiInputBase-input': {
    fontFamily: 'Pretendard',
    fontSize: '12px', // 15 / 1.25 = 12
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: 'normal',
  },
})
