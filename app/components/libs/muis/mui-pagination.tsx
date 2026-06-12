import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import {
  gridPageCountSelector,
  gridPageSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import { Box, Button } from "@mui/material";

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 페이지 컴포넌트
 * 03. 설명     : 페이지 컴포넌트 제공 (커스텀 스타일)
 * 04. 작성일자  : 2024.07.04
 * 05. 작성자   : 이우창
 */

const MuiPagination = () => {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  const handleFirstPage = () => apiRef.current.setPage(0);
  const handleLastPage = () => apiRef.current.setPage(pageCount - 1);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
        marginTop: "10px",
      }}
    >
      {/* 처음 페이지 버튼 */}
      <Button
        onClick={handleFirstPage}
        disabled={page === 0}
        sx={{
          minWidth: "36px",
          height: "36px",
          borderRadius: "4px", // ✅ 사각형
          border: "1px solid #E0E0E0",
          color: page === 0 ? "#A0A0A0" : "#4200FF",
          backgroundColor: "#F9F9F9",
          "&:hover": {
            backgroundColor: "#EFEFFE",
          },
        }}
      >
        &laquo;
      </Button>

      {/* 기본 페이지네이션 */}
      <Pagination
        sx={{
          "& .MuiPaginationItem-root": {
            borderRadius: "4px", // ✅ 사각형 버튼
            border: "1px solid #E0E0E0",
            width: "36px",
            height: "36px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#312E37",
            backgroundColor: "#FFFFFF",
            "&.Mui-selected": {
              border: "2px solid #0070AF", // ✅ 보라색 테두리 강조
              color: "#0070AF",
              backgroundColor: "#FFFFFF",
            },
            "&:hover": {
              backgroundColor: "#F7F7FB",
            },
          },
        }}
        page={page + 1}
        count={pageCount}
        renderItem={(props) => <PaginationItem {...props} />}
        onChange={(event: React.ChangeEvent<unknown>, value: number) =>
          apiRef.current.setPage(value - 1)
        }
      />

      {/* 마지막 페이지 버튼 */}
      <Button
        onClick={handleLastPage}
        disabled={page >= pageCount - 1}
        sx={{
          minWidth: "36px",
          height: "36px",
          borderRadius: "4px",
          border: "1px solid #E0E0E0",
          color: page >= pageCount - 1 ? "#A0A0A0" : "#0070AF",
          backgroundColor: "#F9F9F9",
          "&:hover": {
            backgroundColor: "#EFEFFE",
          },
        }}
      >
        &raquo;
      </Button>
    </Box>
  );
};

export default MuiPagination;