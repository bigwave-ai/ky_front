'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import * as am4plugins_sunburst from '@amcharts/amcharts4/plugins/sunburst';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : Sunburst 차트 기능 제공 (색상 차이 강조 및 가시성 개선)
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
}

interface AmSunburstChartProps {
  data?: SunburstNode[];
  colorSet?: string[]; // ✅ 색상 배열 추가
  width?: string;
  height?: string;
}

const AmSunburstChart = ({
  data = [],
  colorSet = ['#0056b3'], // ✅ 계층별 색상 대비 강화
  width = '100%',
  height = '500px',
}: AmSunburstChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ Sunburst 차트 생성
    let chart = am4core.create(chartRef.current, am4plugins_sunburst.Sunburst);
    chart.data = data;

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    // ✅ 데이터 필드 매핑
    chart.dataFields.value = 'value';
    chart.dataFields.name = 'name';
    chart.dataFields.children = 'children';

    // ✅ 색상 설정 (계층별 색상 차이를 더욱 강조)
    let colorSetInstance = new am4core.ColorSet();
    colorSetInstance.list = colorSet.map(color => am4core.color(color));
    colorSetInstance.stepOptions = {
      lightness: -0.15, // ✅ 계층별로 색상을 점점 어둡게
      hue: 20, // ✅ 약간의 색조 변화 추가
      saturation: 0.9, // ✅ 채도를 더욱 강조하여 색상 차이를 명확하게 만듦
    };
    chart.colors = colorSetInstance;

    // ✅ 시리즈 템플릿 설정
    const level0SeriesTemplate = chart.seriesTemplates.create('0');
    level0SeriesTemplate.slices.template.fillOpacity = 1; // ✅ 가장 바깥쪽 색상을 더 선명하게
    level0SeriesTemplate.slices.template.stroke = am4core.color("#ffffff"); // ✅ 경계선 추가
    level0SeriesTemplate.slices.template.strokeWidth = 1.5;
    level0SeriesTemplate.hiddenState.properties.scale = 0.5;

    const level1SeriesTemplate = chart.seriesTemplates.create('1');
    level1SeriesTemplate.slices.template.fillOpacity = 0.9;
    level1SeriesTemplate.slices.template.stroke = am4core.color("#ffffff");
    level1SeriesTemplate.slices.template.strokeWidth = 1.5;
    level1SeriesTemplate.hiddenState.properties.scale = 0.5;

    const level2SeriesTemplate = chart.seriesTemplates.create('2');
    level2SeriesTemplate.slices.template.fillOpacity = 0.8;
    level2SeriesTemplate.slices.template.stroke = am4core.color("#ffffff");
    level2SeriesTemplate.slices.template.strokeWidth = 1.5;
    level2SeriesTemplate.hiddenState.properties.scale = 0.5;

    // ✅ 툴팁 설정 (가독성 강화)
    // chart.tooltip.label.fontSize = 14;
    // chart.tooltip.label.fill = am4core.color('#ffffff');
    // chart.tooltip.background.fill = am4core.color("#004B87"); // ✅ 어두운 파란색으로 툴팁 배경 설정
    chart.tooltipText = "{name}: {value}";

    // ✅ 애니메이션 효과 추가
    chart.hiddenState.properties.radius = am4core.percent(0);

    return () => {
      chart.dispose();
    };
  }, [data, colorSet]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmSunburstChart;
