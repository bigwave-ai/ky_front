// 'use client'
import React from 'react'
import { TextInputStyled } from '../../style/styleds/libs/common/styled-common-input'

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 텍스트인풋
 * 03. 설명     : 텍스트인풋 기능 제공
 * 04. 작성일자  : 2025.08.26
 * 05. 작성자   : 이우창
 */

type Props = {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  width?: number | string // ex) 300 or '100%'
  className?: string
}

export default function CommonTextInput({
  value,
  onChange,
  placeholder,
  width = '100%',
  className,
}: Props) {
  return (
    <TextInputStyled
      className={className}
      style={{ width }}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}