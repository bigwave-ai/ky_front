'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import { useTranslation } from '@/app/services/i18n/LanguageProvider';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 산점도(Scatter Plot) 차트 기능 제공
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmScatterChartProps {
  data?: { xValue: number; yValue: number; size?: number }[]; // ✅ 데이터 (x, y, 크기)
  pointColor?: string; // ✅ 점 색상
  fontSize?: number; // ✅ 폰트 크기
  width?: string; // ✅ 차트 가로 크기
  height?: string; // ✅ 차트 세로 크기
}

const AmScatterChart = ({
  data = [],
  pointColor = '#007bff',
  fontSize = 14,
  width = '100%',
  height = '300px',
}: AmScatterChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const { t, lang } = useTranslation();

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ XY 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.XYChart);
    chart.data = data;

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    // ✅ X축 설정
    let xAxis = chart.xAxes.push(new am4charts.ValueAxis());
    xAxis.title.text = t("X 값");
    xAxis.renderer.labels.template.fontSize = fontSize;

    // ✅ Y축 설정
    let yAxis = chart.yAxes.push(new am4charts.ValueAxis());
    yAxis.title.text = t("Y 값");
    yAxis.renderer.labels.template.fontSize = fontSize;

    // ✅ 산점도 시리즈 설정
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueX = "xValue";
    series.dataFields.valueY = "yValue";
    series.strokeOpacity = 0; // 선 없애기 (단순 점만 표시)

    // ✅ 점 추가 (산점도)
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.fill = am4core.color(pointColor);
    bullet.circle.stroke = am4core.color('#ffffff');
    bullet.circle.strokeWidth = 2;

    // ✅ 크기 조정 (size 값이 있으면 반영)
    bullet.circle.propertyFields.radius = "size";
    bullet.circle.adapter.add("radius", (radius: any, target) => {
      return Math.max(3, radius * 0.5); // 최소 크기 3
    });

    // ✅ 툴팁 설정
    bullet.tooltipText = "[bold]X: {xValue}, Y: {yValue}[/]";

    // ✅ 애니메이션 효과 추가
    series.hiddenState.properties.opacity = 0;
    series.defaultState.transitionDuration = 1000;

    return () => {
      chart.dispose();
    };
  }, [data, pointColor, fontSize, lang]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmScatterChart;
