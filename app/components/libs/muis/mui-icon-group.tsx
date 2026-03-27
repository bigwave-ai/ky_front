import {
  HomeRounded,
  RadioButtonCheckedRounded,
  SearchRounded,
  AddCircleRounded,
  DeleteRounded,
  EditRounded,
  SaveRounded,
  PrintRounded,
  HelpRounded,
  ArrowForwardRounded,
  ArrowBackRounded,
  NotificationsRounded,
  SettingsRounded,
  FavoriteRounded,
  CheckCircleRounded
} from '@mui/icons-material';
import { muiRadioIconStyle } from '../../style/styleds/libs/muis/styled-mui-icon';

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 아이콘
 * 03. 설명     : 아이콘 제공
 * 04. 작성일자  : 2025.02.20
 * 05. 작성자   : 이우창
 */

// ✅ 홈 아이콘
export const MuiHomeIcon = () => {
  return <HomeRounded />;
};

// ✅ 라디오 아이콘
export const MuiRadioIcon = () => {
  return <RadioButtonCheckedRounded sx={{ ...muiRadioIconStyle }} />;
};

// ✅ 검색 아이콘
export const MuiSearchIcon = () => {
  return <SearchRounded />;
};

// ✅ 추가 아이콘
export const MuiAddIcon = () => {
  return <AddCircleRounded />;
};

// ✅ 삭제 아이콘
export const MuiDeleteIcon = () => {
  return <DeleteRounded />;
};

// ✅ 편집 아이콘
export const MuiEditIcon = () => {
  return <EditRounded />;
};

// ✅ 저장 아이콘
export const MuiSaveIcon = () => {
  return <SaveRounded />;
};

// ✅ 출력 아이콘
export const MuiPrintIcon = () => {
  return <PrintRounded />;
};

// ✅ 도움말 아이콘
export const MuiHelpIcon = () => {
  return <HelpRounded />;
};

// ✅ 다음 화살표 아이콘
export const MuiArrowForwardIcon = () => {
  return <ArrowForwardRounded />;
};

// ✅ 이전 화살표 아이콘
export const MuiArrowBackIcon = () => {
  return <ArrowBackRounded />;
};

// ✅ 알림 아이콘
export const MuiNotificationsIcon = () => {
  return <NotificationsRounded />;
};

// ✅ 설정 아이콘
export const MuiSettingsIcon = () => {
  return <SettingsRounded />;
};

// ✅ 좋아요 아이콘
export const MuiFavoriteIcon = () => {
  return <FavoriteRounded />;
};

// ✅ 체크 아이콘
export const MuiCheckCircleIcon = () => {
  return <CheckCircleRounded />;
};