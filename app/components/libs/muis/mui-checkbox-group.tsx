import React from "react";
import { FormGroup, FormControlLabel, Checkbox, Typography } from "@mui/material";
import { muiCheckboxStyle, muiLabelStyle,checkboxSx,checkboxLabelSx} from "../../style/styleds/libs/muis/styled-mui-checkbox-group";

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든 권한 - Checkbox 그룹
 * 03. 설명     : 재사용 가능한 Checkbox 그룹 컴포넌트 제공
 * 04. 작성일자  : 2024.11.19
 * 05. 작성자   : 이우창
 */

interface CustomCheckboxGroupProps {
  items: string[]; // 체크박스 항목
  selectedItems: string[]; // 선택된 항목
  onChange: (type: string) => void; // 체크박스 상태 변경 함수
  width?: string; // ✅ 사용자 지정 width (기본값: auto)
  height?: string; // ✅ 사용자 지정 height (기본값: auto)
  align?: "left" | "center" | "right"; // ✅ 체크박스 정렬 (기본값: left)  
}

export const CustomCheckboxGroup = ({
  items,
  selectedItems,
  onChange,
  width = "auto", // 기본값 auto
  height = "auto", // 기본값 auto
  align = "left", // 기본값 왼쪽 정렬  
}: CustomCheckboxGroupProps) => {
  // ✅ 정렬 방식 설정
  const justifyContent = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <FormGroup row
    sx={{
      width, // ✅ 사용자가 입력한 width 적용
      height, // ✅ 사용자가 입력한 height 적용
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent, // ✅ 정렬 방식 적용
    }}
    >
      {items.map((item) => (
        <FormControlLabel
          key={item}
          control={
            <Checkbox
              checked={selectedItems.includes(item)}
              onChange={() => onChange(item)}
              sx={muiCheckboxStyle}
            />
          }
          label={
            <Typography sx={muiLabelStyle}>{item}</Typography>
          }
        />
      ))}
    </FormGroup>
  );
};


interface Props {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

export default function CommonCheckbox({ label, checked, onChange, className }: Props) {
  return (
    <FormControlLabel
      className={className}
      control={
        <Checkbox
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          sx={checkboxSx}
        />
      }
      label={label}
      sx={checkboxLabelSx}
    />
  )
}
