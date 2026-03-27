'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 레이더 차트 기능 제공 (Y축 그리드 투명도 적용)
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmRadarChartProps {
  data?: { category: string; value: number }[]; // ✅ 레이더 차트 데이터
  color?: string; // ✅ 차트 색상
  fontSize?: number; // ✅ 텍스트 폰트 크기 (기본값: 14)
  width?: string; // ✅ 차트 가로 크기
  height?: string; // ✅ 차트 세로 크기
  showLabels?: boolean; // ✅ 라벨 표시 여부 (기본값: true)
}

const AmRadarChart = ({
  data = [],
  color = '#007bff',
  fontSize = 14,
  width = '100%',
  height = '300px',
  showLabels = true,
}: AmRadarChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ 레이더 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.RadarChart);
    chart.data = data;

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    // ✅ X축 (카테고리 축) 설정 → Circular 축 사용!
    let categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis<am4charts.AxisRendererCircular>());
    categoryAxis.dataFields.category = 'category';
    categoryAxis.renderer.labels.template.fill = am4core.color("#000");
    categoryAxis.renderer.labels.template.fontSize = fontSize;
    categoryAxis.renderer.grid.template.strokeOpacity = 0.1; // ✅ 그리드 스타일 변경
    categoryAxis.renderer.minGridDistance = 20; // ✅ 간격 조절

    // ✅ Y축 (값 축) 설정 → Radial 축 사용!
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis<am4charts.AxisRendererRadial>());
    valueAxis.renderer.labels.template.fill = am4core.color("#666"); // ✅ Y축 값 회색으로 변경
    valueAxis.renderer.labels.template.opacity = 0.7; // ✅ Y축 값 투명도 적용
    valueAxis.renderer.labels.template.fontSize = fontSize;
    valueAxis.renderer.grid.template.strokeOpacity = 0.3; // ✅ Y축 그리드 투명도 적용
    valueAxis.renderer.grid.template.stroke = am4core.color("#999"); // ✅ Y축 그리드 색상 회색
    valueAxis.min = 0; // ✅ 최소값 0으로 설정

    // ✅ 레이더 시리즈 추가
    let series = chart.series.push(new am4charts.RadarSeries());
    series.dataFields.valueY = 'value';
    series.dataFields.categoryX = 'category';
    series.stroke = am4core.color(color);
    series.fill = am4core.color(color);
    series.fillOpacity = 0.4; // ✅ 투명도 설정
    series.strokeWidth = 2;

    // ✅ 마커 추가
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.fill = am4core.color(color);
    bullet.circle.strokeWidth = 2;
    
    // ✅ 값 라벨 추가
    if (showLabels) {
      let labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.text = '{value}';
      labelBullet.label.fontSize = fontSize;
      labelBullet.label.fill = am4core.color('#000');
      labelBullet.locationY = 0.25;
    }

    return () => {
      chart.dispose();
    };
  }, [data, color, fontSize, showLabels]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmRadarChart;
