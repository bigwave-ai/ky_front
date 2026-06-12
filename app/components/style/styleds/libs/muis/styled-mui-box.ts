/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Mui
 * 03. 설명     : Mui Box 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

export const muiBoxStyle = () => {
  return {
    width: '100%',
    height: '600px', // ✅ 헤더(62) + row(62*10) + footer(56)
    '& .grid_cell_underline': {
      textDecoration: 'underline',
      cursor: 'pointer',
    },
  };
};

// 24.10.02. hyeonu : row 5개 출력되는 경우를 고려하여 height 변경
export const muiBoxStyle2 = () => {
  return {
    width: "100%",
    height: "613px", // ✅ 동일하게 10행 기준으로 고정
    // marginTop: "10px",
  };
};