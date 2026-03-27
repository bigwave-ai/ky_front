import { Checkbox, FormControlLabel, Select, SelectChangeEvent, TextField, RadioGroup, Radio, Box,
  FormControl, MenuItem
} from '@mui/material';
import { muiCalendarStyle, muiSelectStyle, muiTextFieldStyle, muiformControlLabelStyle,selectFormControlStyle,selectBoxStyle,muiLoginInputRootBase  } from '../../style/styleds/libs/muis/styled-mui-input';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import { CalendarMonthTwoTone, Check, CheckBox } from '@mui/icons-material';

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 입력 컴포넌트
 * 03. 설명     : 입력 컴포넌트 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

//텍스트 필드
interface MuiInputTextFieldProps {
  name: string;
  value: string;
  placeholder?: string;
  width: string;
  height: string;
  textAlign: any;
  fnChangeInputText?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const MuiInputText = ({ name, value, placeholder, width, height, textAlign, fnChangeInputText }: MuiInputTextFieldProps) => {
  return (
    <TextField
      variant="outlined"
      size="small"
      name={name}
      value={value}
      placeholder={placeholder}
      sx={{ width: width, height: height }}
      inputProps={{ style: { textAlign: textAlign, ...muiTextFieldStyle } }}
      onChange={(e) => {
        if (typeof fnChangeInputText == 'function') {
          fnChangeInputText(e);
        }
      }}
    />
  );
};


//텍스트 필드
interface MuiInputTextFieldProps2 {
  name?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  width: string;
  height: string;
  textAlign: any;
  backgroundColor?: string; // box 내부 색상
  borderColor?: string; // border 색상
  readOnly?: boolean;
  disabled?: boolean;
  fnChangeInputText?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

export const MuiInputText2 = ({
  name,
  type,
  value,
  placeholder,
  width,
  height,
  textAlign,
  backgroundColor = "#FAFDFF",
  borderColor = "#B3E1FF",
  readOnly = false,
  disabled = false,
  fnChangeInputText,
}: MuiInputTextFieldProps2) => {
  // ✅ 핵심: undefined 방지(항상 controlled 유지)
  const safeValue = value ?? "";

  return (
    <TextField
      variant="outlined"
      size="small"
      autoComplete="off"
      name={name}
      type={type}
      value={safeValue} // ✅ 여기!
      placeholder={placeholder}
      onChange={(e) => fnChangeInputText && fnChangeInputText(e)}
      disabled={disabled}
      sx={{
        width,
        ...muiTextFieldStyle,
        "& .MuiOutlinedInput-root": {
          ...muiLoginInputRootBase,
          backgroundColor,
          height,
          "& fieldset": {
            borderColor,
            borderWidth: "1.5px",
          },
        },
      }}
      inputProps={{ style: { textAlign }, readOnly }}
    />
  );
};

//텍스트 영역
interface MuiInputTextAreaProps {
  name: string;
  value: string;
  placeholder: string;
  width: string;
  height: string;
  textAlign: any;
  fnChangeTextArea?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

//셀렉트 박스
interface MuiSelectProps {
  name: string;
  value: string;
  width?: string;
  children: React.ReactNode;
  fnChangeSelect?: (e: SelectChangeEvent<string>) => void;
}

export const MuiSelect = ({ name, value, width, children, fnChangeSelect }: MuiSelectProps) => {
  return (
    <Select
      name={name}
      value={value}
      sx={{ width: width, ...muiSelectStyle }}
      onChange={(e) => {
        if (typeof fnChangeSelect === 'function') {
          fnChangeSelect(e);
        }
      }}
    >
      {children}
    </Select>
  );
};

//커스텀 셀렉트 박스
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

//달력
interface MuiCalendarProps {
  name: string;
  value: string;
  fnChangeCalendar?: (e: dayjs.Dayjs, name: string) => void;
}

export const MuiCalendar = ({ name, value, fnChangeCalendar }: MuiCalendarProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={'ko'}>
      <DatePicker
        format="YYYY-MM-DD"
        value={dayjs(value)}
        sx={{ ...muiCalendarStyle }}
        components={{ OpenPickerIcon: CalendarMonthTwoTone }}
        onChange={(e) => {
          if (typeof fnChangeCalendar == 'function') {
            fnChangeCalendar(e!, name);
          }
        }}
      ></DatePicker>
    </LocalizationProvider>
  );
};

//체크 박스
interface MuiCheckboxProps {
  name: string;
  label: string;
  value?: string;
  isChecked?: boolean;
  defaultChecked?: boolean;
  fnChangeCheckBox?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  width?: string; // ✅ 체크박스 컨테이너의 너비 추가
  height?: string; // ✅ 체크박스 컨테이너의 높이 추가
  align?: 'left' | 'center' | 'right'; // ✅ 정렬 추가
}

export const MuiCheckBox = ({ name, label, value, isChecked, defaultChecked, fnChangeCheckBox,
  width = 'auto', // 기본값 설정
  height = 'auto', // 기본값 설정
  align = 'left', // 기본값 설정  
 }: MuiCheckboxProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        width: width,
        height: height,
      }}
    >
      <FormControlLabel
        label={label}
        sx={{ ...muiformControlLabelStyle }}
        control={
          <Checkbox
            size="small"
            name={name}
            value={value}
            checked={isChecked}
            defaultChecked={defaultChecked}
            onChange={(e) => {
              if (typeof fnChangeCheckBox === 'function') {
                fnChangeCheckBox(e);
              }
            }}
          />
        }
      />
    </Box>
  );
};

//라디오 버튼
interface MuiRadioGroupProps {
  name: string;
  isRow: boolean;
  children: React.ReactNode;
  fnChangeRadio?: (e: React.ChangeEvent<HTMLElement>, name: string) => void;
}

export const MuiRadioGroup = ({ name, isRow, children, fnChangeRadio }: MuiRadioGroupProps) => {
  return (
    <RadioGroup
      row={isRow}
      onChange={(e) => {
        if (typeof fnChangeRadio === 'function') {
          fnChangeRadio(e, name);
        }
      }}
    >
      {children}
    </RadioGroup>
  );
};

interface MuiRadioProps {
  label: string;
  value: string;
}

export const MuiRadio = ({ label, value }: MuiRadioProps) => {
  return <FormControlLabel label={label} sx={{ ...muiformControlLabelStyle }} control={<Radio size="small" value={value}></Radio>}></FormControlLabel>;
};
