// app/components/libs/muis/mui-date-picker.tsx
'use client'

import React from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import type { SxProps, Theme } from '@mui/material/styles'
import { getDatePickerSx } from '../../style/styleds/libs/muis/styled-mui-date-picker'
import type { Dayjs } from 'dayjs'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - date picker 컴포넌트
 * 03. 설명     : date picker 컴포넌트 제공
 * 04. 작성일자  : 2025.08.26
 * 05. 작성자   : 이우창
 */

interface Props {
  value: Dayjs | null
  onChange: (v: Dayjs | null) => void
  width?: number | string // ex) 150, '180px', '100%'
  sx?: SxProps<Theme>
  className?: string
  minDate?: Dayjs
  maxDate?: Dayjs
}

export default function CommonDatePicker({
  value,
  onChange,
  width = 150,
  sx,
  className,
  minDate,
  maxDate,
}: Props) {
  const mergedSx = Array.isArray(sx) ? [getDatePickerSx(width), ...sx] : [getDatePickerSx(width), sx]

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        className={className}
        value={value}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        slotProps={{
          textField: {
            size: 'small',
            sx: mergedSx,
          },
        }}
      />
    </LocalizationProvider>
  )
}
