import React from "react";
import { FormControl, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { selectBoxStyle, selectFormControlStyle} from "../../style/styleds/libs/muis/styled-mui-input";

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든 권한 - Select Box
 * 03. 설명     : Select Box 컴포넌트 제공
 * 04. 작성일자  : 2024.11.19
 * 05. 작성자   : 이우창
 */

interface SelectBoxProps {
  value: string;
  options: string[];
  onChange: (event: SelectChangeEvent<string>) => void;
  labelId?: string;
  width?: string;
  height?: string;
}

export const CustomSelectBox = ({
  value,
  options,
  onChange,
  labelId = "custom-select-box-label",
  width = "200px",
  height = "35px",
}: SelectBoxProps) => {
  return (
    <FormControl sx={{ ...selectFormControlStyle, width, height }}>
      <Select
        labelId={labelId}
        value={value}
        onChange={onChange}
        sx={{ ...selectBoxStyle, height }}
      >
        {options.map((option, index) => (
          <MenuItem key={index} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};