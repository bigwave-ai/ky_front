'use client'

import React from 'react'
import {
  GridColDef,
  GridRowSelectionModel,
  DataGrid,
  koKR,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridColumnVisibilityModel,
  type GridRowParams,
  type MuiEvent,
} from '@mui/x-data-grid'
import { Box } from '@mui/material'

import { muiGridStyle } from '../../style/styleds/libs/muis/styled-mui-grid'
import { EnumGridStyleProps } from '@/app/models/enums/enum-grid-group'
import { muiBoxStyle, muiBoxStyle2 } from '../../style/styleds/libs/muis/styled-mui-box'
import MuiPagination from './mui-pagination'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 데이터 그리드 컴포넌트
 * 03. 설명     : 데이터 그리드 컴포넌트 제공
 * 04. 작성일자  : 2024.11.18
 * 05. 작성자   : 이우창
 */

interface CustomDataGridProps {
  rows: any
  columns: GridColDef<any>[]
  isPagination: boolean
  isCheckboxSelection: boolean
  rowSelectionModel?: GridRowSelectionModel
  rowId?: string
  rowHeight?: number
  pageSize?: number
  extraHeader?: React.ReactNode
  columnVisibilityModel?: GridColumnVisibilityModel | undefined
  handleChangeGridCellCheckbox?: (rowSelectionModel: GridRowSelectionModel) => void
  onRowClick?: (params: GridRowParams<any>, event: MuiEvent<React.MouseEvent>) => void
  customBoxStyle?: object
  disableRowSelectionOnClick?: boolean
  getRowClassName?: (params: any) => string
  cursorPointer?: boolean
}

// ✅ 그리드 내 툴바 제공
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport csvOptions={{ utf8WithBom: true }} />
      <GridToolbarQuickFilter style={{ marginLeft: 'auto' }} />
    </GridToolbarContainer>
  )
}

// ✅ 체크박스/선택 칼럼/아이콘 클릭 여부를 DOM 기준으로 튼튼하게 판별
function isClickOnCheckboxArea(event: any) {
  const el = (event?.target as HTMLElement) || null
  if (!el) return false

  if (el.closest('.MuiDataGrid-cellCheckbox')) return true
  if (el.closest('.MuiDataGrid-columnHeaderCheckbox')) return true
  if (el.closest('.MuiCheckbox-root')) return true
  if (el.closest('input[type="checkbox"]')) return true
  if (el.getAttribute('role') === 'checkbox') return true
  if (el.closest('[role="checkbox"]')) return true

  return false
}

export const CustomDataGrid = ({
  rows,
  columns,
  isPagination,
  isCheckboxSelection,
  rowSelectionModel,
  rowHeight,
  rowId,
  pageSize = 15,
  extraHeader,
  columnVisibilityModel,
  handleChangeGridCellCheckbox,
  onRowClick,
  customBoxStyle,
  disableRowSelectionOnClick = false,
  getRowClassName,
  cursorPointer = false,
}: CustomDataGridProps) => {
  return (
    <Box sx={customBoxStyle || (!pageSize ? muiBoxStyle : muiBoxStyle2)}>
      {extraHeader}

    <DataGrid
      sx={muiGridStyle}
      localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
      columnHeaderHeight={EnumGridStyleProps.COLUMN_HEADER_HEIGHT}
      rowHeight={rowHeight ?? EnumGridStyleProps.ROW_HEIGHT}
      slots={{
        pagination: MuiPagination,
      }}
      pagination={isPagination || undefined}
      checkboxSelection={isCheckboxSelection || undefined}
      rowSelectionModel={rowSelectionModel}
      disableRowSelectionOnClick={disableRowSelectionOnClick}
      initialState={{
        pagination: {
          paginationModel: { pageSize },
        },
      }}
      rows={rows || []}
      getRowId={rowId ? (row) => row[rowId] : (row) => row["id"]}
      columns={columns}
      disableColumnMenu
      columnVisibilityModel={columnVisibilityModel}
      hideFooterSelectedRowCount
      onRowSelectionModelChange={handleChangeGridCellCheckbox}
      onRowClick={(params, event) => {
        if (isClickOnCheckboxArea(event)) return
        onRowClick?.(params, event)
      }}
      getRowClassName={(params) => {
        const base = getRowClassName ? getRowClassName(params) : ""
        const clickable = cursorPointer ? "row-clickable" : ""
        return [base, clickable].filter(Boolean).join(" ")
      }}
    />
    </Box>
  )
}
