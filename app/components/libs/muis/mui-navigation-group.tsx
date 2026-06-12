import GrainIcon from '@mui/icons-material/Grain';
import HomeIcon from '@mui/icons-material/Home';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { Typography } from '@mui/material';
import { muiNavigationMenuCrumbsStyle, muiNavigationTypographyStyle } from '../../style/styleds/libs/muis/styled-mui-navigation';

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 네비게이션
 * 03. 설명     : 네비게이션 기능 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

interface MuiNavigationCrumbsProps {
  naviDatas: Array<string>;
}

export const MuiNavigationCrumbs = ({ naviDatas }: MuiNavigationCrumbsProps) => {
  const dataLength = naviDatas.length;
  const renderMenuCrumbs = (index: number) => {
    let menu: React.ReactNode = null;
    switch (index) {
      case -1:
        menu = <GrainIcon sx={{ ...muiNavigationMenuCrumbsStyle }} />;
        break;
      case 0:
        menu = <HomeIcon sx={{ ...muiNavigationMenuCrumbsStyle }} />;
        break;
      case 1:
        menu = <FormatListBulletedIcon sx={{ ...muiNavigationMenuCrumbsStyle }} />;
        break;
      default:
        menu = <GrainIcon sx={{ ...muiNavigationMenuCrumbsStyle }} />;
        break;
    }
    return menu;
  };
  return (
    <>
      <Breadcrumbs>
        {naviDatas?.map((item, index) => {
          return (
            <Typography key={index} sx={{ ...muiNavigationTypographyStyle }}>
              {renderMenuCrumbs(index)}
              {item}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </>
  );
};
