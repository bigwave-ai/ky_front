'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 버블 차트 기능 제공 (축 유지, value 비율 적용, 색상+투명도 자동 조절)
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmBubbleChartProps {
  data?: { categoryX: string; categoryY: string; value: number }[]; // ✅ 데이터
  fontSize?: number; // ✅ 폰트 크기
  width?: string; // ✅ 차트 가로 크기
  height?: string; // ✅ 차트 세로 크기
}

const AmBubbleChart = ({
  data = [],
  fontSize = 14,
  width = '100%',
  height = '300px',
}: AmBubbleChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ 전체 데이터 중 최대 value 값을 구함 (비율 계산을 위해)
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    // ✅ XY 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.XYChart);
    chart.data = data;

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    // ✅ X축 설정 (범주형)
    let xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    xAxis.dataFields.category = 'categoryX';
    xAxis.renderer.grid.template.disabled = false;
    xAxis.renderer.labels.template.fontSize = fontSize;
    xAxis.title.text = 'X 축 (Category)';

    // ✅ Y축 설정 (범주형)
    let yAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    yAxis.dataFields.category = 'categoryY';
    yAxis.renderer.grid.template.disabled = false;
    yAxis.renderer.labels.template.fontSize = fontSize;
    yAxis.title.text = 'Y 축 (Category)';

    // ✅ 버블 시리즈 (XYSeries)
    let series = chart.series.push(new am4charts.XYSeries());
    series.dataFields.value = 'value';
    series.dataFields.categoryX = 'categoryX';
    series.dataFields.categoryY = 'categoryY';

    // ✅ 버블(원형) 추가
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.stroke = am4core.color('#ffffff'); // ✅ 흰색 테두리 추가
    bullet.circle.strokeWidth = 2;
    bullet.circle.tooltipText = "[bold]{categoryX}, {categoryY}[/]\nValue: {value} ({valuePercentage}%)";

    // ✅ 버블 크기를 전체 값 비율에 따라 조정
    bullet.circle.propertyFields.radius = 'bubbleSize';
    bullet.circle.adapter.add("radius", (radius, target: any) => {
      let value = target.dataItem?.dataContext?.value;
      let percentage = (value / maxValue) * 100; // ✅ 전체 값 대비 %
      return Math.max(4, (percentage / 5)); // ✅ 최소 크기 5 유지
    });

    // ✅ 버블 색상을 전체 값 비율(%)에 따라 조정
    bullet.circle.adapter.add("fill", (fill, target: any) => {
      let value = target.dataItem?.dataContext?.value;
      let percentage = (value / maxValue) * 100;
      if (percentage <= 20) return am4core.color("#99ccff"); // 밝은 파란색
      if (percentage <= 40) return am4core.color("#66b3ff");
      if (percentage <= 60) return am4core.color("#3399ff");
      if (percentage <= 80) return am4core.color("#007bff");
      return am4core.color("#0056b3"); // 가장 진한 파란색
    });

    // ✅ 버블 투명도를 전체 값 비율(%)에 따라 조정
    bullet.circle.adapter.add("opacity", (opacity, target : any) => {
      let value = target.dataItem?.dataContext?.value;
      let percentage = (value / maxValue) * 100;
      return Math.max(0.4, percentage / 100); // ✅ 최소 40% 투명도 유지
    });

    // ✅ 애니메이션 효과 추가
    series.hiddenState.properties.opacity = 0;
    series.defaultState.transitionDuration = 1000;

    return () => {
      chart.dispose();
    };
  }, [data, fontSize]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmBubbleChart;
