import React from 'react';
import { Stack } from '@mui/material';
import { AntSwitch } from '../../style/styleds/libs/muis/styled-mui-toggle'; // 스타일 불러오기

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 토글 스위치 컴포넌트
 * 03. 설명     : 토글 스위치 컴포넌트 제공
 * 04. 작성일자  : 2024.10.26
 * 05. 작성자   : 이우창
 */

interface PermissionSwitchProps {
  enabled: boolean;
  onChange: (checked: boolean) => void;
}

export const PermissionSwitch: React.FC<PermissionSwitchProps> = ({
  enabled,
  onChange,
}) => {
  return (
    <Stack direction="row" spacing={2} alignItems="center">  {/* 간격을 약간 더 줌 */}
      <AntSwitch
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        inputProps={{ 'aria-label': 'ant design' }}
      />
    </Stack>
  );
};