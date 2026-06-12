import { Theme } from '@mui/material/styles'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Mui
 * 03. 설명     : Mui Grid 스타일 제공 (문서 목록 UI 톤에 맞춤)
 * 04. 작성일자  : 2025.09.03
 * 05. 작성자   : 이우창
 */

export const muiGridStyle = (theme: Theme) => {
  return {
    // 📌 DataGrid 기본
    '&.MuiDataGrid-root': {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E7E7E8',
      borderRadius: '10px',
      fontFamily: 'Pretendard, sans-serif',
    },

    // 📌 헤더 영역
    '& .MuiDataGrid-columnHeaders': {
      minWidth: '100%',
      backgroundColor: '#FFFFFF',
      borderBottom: '2px solid #6EA3FF',
    },
    '& .MuiDataGrid-columnHeader': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitleContainer': {
      justifyContent: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      color: '#000',
      textAlign: 'center',
      fontFamily: 'Heebo',
      fontSize: '14px', // ✅ 18px(1.25배) → 14px(1배)
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: 'normal',
    },

    // 📌 셀 영역
    '& .MuiDataGrid-cell': {
      textAlign: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',

      color: '#585858',
      fontFamily: 'Heebo',
      fontSize: '14px', // ✅ 18px(1.25배) → 14px(1배)
      fontStyle: 'normal',
      fontWeight: 500,
      lineHeight: 'normal',
      letterSpacing: '-0.56px', // ✅ -0.7px → -0.56px (x0.8)

      borderBottom: '1px solid #E7E7E8',
    },

    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },

    // 📌 행 스타일
    '& .MuiDataGrid-row': {
      backgroundColor: '#FBFBFB',
    },

    // 📌 Footer (Pagination 영역)
    '& .MuiDataGrid-footerContainer': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E0E0E0',
      borderRadius: '0 0 10px 10px',
      padding: '10px 0', // ✅ 12px → 10px (x0.8)
    },

    // ✅ “클릭 가능” 행 공통 스타일 (행 + 셀 모두 포인터)
    '& .row-clickable': {
      cursor: 'pointer',
    },
    '& .row-clickable .MuiDataGrid-cell': {
      cursor: 'pointer',
    },
    '& .row-clickable:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },

    // ✅ 체크박스 칼럼은 기본 커서 유지
    '& .row-clickable .MuiDataGrid-cellCheckbox, \
       & .MuiDataGrid-columnHeaderCheckbox': {
      cursor: 'default',
    },

    // ✅ 체크박스 아이콘 색상
    '& .MuiDataGrid-cellCheckbox .MuiCheckbox-root:not(.Mui-checked) .MuiSvgIcon-root, \
       & .MuiDataGrid-columnHeaderCheckbox .MuiCheckbox-root:not(.Mui-checked) .MuiSvgIcon-root': {
      color: '#C5C5C5',
    },
  }
}
