import { styled } from '@mui/material/styles';
import { Switch } from '@mui/material';

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 토글 스위치 스타일
 * 03. 설명     : 토글 스위치에 대한 스타일 정의
 * 04. 작성일자  : 2024.10.26
 * 05. 작성자   : 이우창
 */


export const AntSwitch = styled(Switch)(({ theme }) => ({
  width: 75,
  height: 42,
  padding: 0,
  display: 'flex',
  '&:active': {
    '& .MuiSwitch-thumb': {
      width: 36,
    },
    '& .MuiSwitch-switchBase.Mui-checked': {
      transform: 'translateX(33px)',
    },
  },
  '& .MuiSwitch-switchBase': {
    padding: 3,
    '&.Mui-checked': {
      transform: 'translateX(33px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: '#1890ff', // 모드에 따라 색상 변경
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxShadow: '0 3px 6px 0 rgb(0 35 11 / 20%)',
    width: 36,
    height: 36,
    borderRadius: 18,
    transition: theme.transitions.create(['width'], {
      duration: 200,
    }),
  },
  '& .MuiSwitch-track': {
    borderRadius: 42 / 2,
    opacity: 1,
    backgroundColor: 'rgba(0,0,0,.25)',
    boxSizing: 'border-box',
  },
}));