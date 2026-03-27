'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 파이 차트 기능 제공
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmPieChartProps {
  data?: { category: string; value: number }[]; // ✅ 파이 차트 데이터
  colorSet?: string[]; // ✅ 색상 배열 (기본값: 파란색 계열)
  fontSize?: number; // ✅ 텍스트 폰트 크기 (기본값: 14)
  width?: string; // ✅ 차트 가로 크기
  height?: string; // ✅ 차트 세로 크기
  showLabels?: boolean; // ✅ 라벨 표시 여부 (기본값: true)
  strokeColor?: string; // ✅ 파이 조각 테두리 색상 (기본값: 흰색)
  strokeWidth?: number; // ✅ 파이 조각 테두리 두께 (기본값: 2)
  strokeOpacity?: number; // ✅ 테두리 투명도 (기본값: 1)
}

const AmPieChart = ({
  data = [],
  colorSet = ['#007bff', '#3399ff', '#66b3ff', '#99ccff', '#0056b3'],
  fontSize = 14,
  width = '100%',
  height = '300px',
  showLabels = true, // ✅ 기본값: 라벨 표시
  strokeColor = '#ffffff', // ✅ 기본 테두리 색상 (흰색)
  strokeWidth = 0.5, // ✅ 기본 테두리 두께
  strokeOpacity = 1, // ✅ 기본 테두리 투명도 (0~1)
}: AmPieChartProps) => {
  /******************** 변수 영역 ********************/
  const chartRef = useRef<HTMLDivElement>(null);

  /******************** 수행 영역 ********************/
  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ 파이 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.PieChart);
    chart.data = data;

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    // ✅ 데이터 필드 매핑
    let pieSeries = chart.series.push(new am4charts.PieSeries());
    pieSeries.dataFields.value = 'value';
    pieSeries.dataFields.category = 'category';

    // ✅ 색상 설정
    pieSeries.slices.template.propertyFields.fill = 'color';

    // ✅ 기본 색상 배열 적용
    chart.events.on('ready', function () {
      pieSeries.slices.each((slice, index) => {
        slice.fill = am4core.color(colorSet[index % colorSet.length]);
      });
    });

    // ✅ 🟡 **테두리(Stroke) 설정**
    pieSeries.slices.template.stroke = am4core.color(strokeColor); // ✅ 테두리 색상
    pieSeries.slices.template.strokeWidth = strokeWidth; // ✅ 테두리 두께
    pieSeries.slices.template.strokeOpacity = strokeOpacity; // ✅ 테두리 투명도

    // ✅ 툴팁 설정
    pieSeries.slices.template.tooltipText = '{category}: {value}';

    // ✅ 애니메이션 효과 추가
    pieSeries.hiddenState.properties.opacity = 0; // ✅ 초기 투명도 설정
    pieSeries.hiddenState.properties.endAngle = -90; // ✅ 초기 애니메이션 효과

    // ✅ 라벨 표시 설정
    if (showLabels) {
      pieSeries.labels.template.text = '{category}: {value}';
      pieSeries.labels.template.fontSize = fontSize;
      pieSeries.labels.template.fill = am4core.color('#000000'); // ✅ 검은색 라벨
      pieSeries.labels.template.wrap = true; // ✅ 자동 줄바꿈
      pieSeries.labels.template.maxWidth = 100; // ✅ 최대 라벨 크기 설정
    } else {
      pieSeries.labels.template.disabled = true;
    }

    // ✅ 차트가 언마운트되면 제거
    return () => {
      chart.dispose();
    };
  }, [data, colorSet, fontSize, showLabels, strokeColor, strokeWidth, strokeOpacity]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmPieChart;
