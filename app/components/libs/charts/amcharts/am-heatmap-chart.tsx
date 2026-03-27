'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 히트맵(Heatmap) 차트 기능 제공 (라벨 색상 자동 조정)
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmHeatmapChartProps {
  data?: { categoryX: string; categoryY: string; value: number }[]; // ✅ 데이터
  colorRange?: string[]; // ✅ 색상 범위 (파란색 계열)
  fontSize?: number; // ✅ 폰트 크기
  width?: string; // ✅ 차트 가로 크기
  height?: string; // ✅ 차트 세로 크기
}

const AmHeatmapChart = ({
  data = [],
  colorRange = ['#e3f2fd', '#90caf9', '#42a5f5', '#1976d2', '#0d47a1'], // ✅ 파란색 계열
  fontSize = 14,
  width = '100%',
  height = '300px',
}: AmHeatmapChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ XY 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.XYChart);
    chart.data = data;

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    // ✅ X축 설정 (범주형)
    let xAxis = chart.xAxes.push(new am4charts.CategoryAxis());
    xAxis.dataFields.category = 'categoryX';
    xAxis.renderer.labels.template.fontSize = fontSize;
    xAxis.title.text = 'X 값';
    xAxis.renderer.grid.template.disabled = true; // ✅ X축 그리드 제거
    xAxis.renderer.minGridDistance = 0;

    // ✅ Y축 설정 (범주형)
    let yAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    yAxis.dataFields.category = 'categoryY';
    yAxis.renderer.labels.template.fontSize = fontSize;
    yAxis.title.text = 'Y 값';
    yAxis.renderer.grid.template.disabled = true; // ✅ Y축 그리드 제거
    yAxis.renderer.minGridDistance = 0;

    // ✅ 히트맵 시리즈 설정
    let series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.value = 'value';
    series.dataFields.categoryX = 'categoryX';
    series.dataFields.categoryY = 'categoryY';
    series.sequencedInterpolation = true;

    // ✅ 박스 간 간격 제거 (완전 밀착)
    series.columns.template.width = am4core.percent(100);
    series.columns.template.height = am4core.percent(100);
    series.columns.template.strokeWidth = 0;

    // ✅ 히트맵 색상 설정 (데이터 값에 따른 색상 변화)
    series.columns.template.adapter.add("fill", (fill, target: any) => {
      let minValue = Math.min(...data.map(d => d.value));
      let maxValue = Math.max(...data.map(d => d.value));
      let index = Math.floor(((target.dataItem?.value || 0) - minValue) / (maxValue - minValue) * (colorRange.length - 1));
      return am4core.color(colorRange[index]);
    });

    // ✅ 툴팁 설정
    series.columns.template.tooltipText = "[bold]{categoryX}, {categoryY}[/]\nValue: {value}";

    // ✅ 박스 내부에 라벨 추가 (값 표시)
    let labelBullet = series.bullets.push(new am4charts.LabelBullet());
    labelBullet.label.text = "{value}";
    labelBullet.label.fontSize = fontSize;
    labelBullet.label.horizontalCenter = "middle";
    labelBullet.label.verticalCenter = "middle";

    // ✅ 라벨 색상 자동 조정 (밝기 기반)
    labelBullet.label.adapter.add("fill", (fill, target : any) => {
      let cellColor = target.dataItem?.column?.fill;
      if (cellColor) {
        let rgb :any = am4core.color(cellColor.toString()).rgb;
        let brightness = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
        return brightness > 0.7 ? am4core.color("#000000") : am4core.color("#FFFFFF"); // ✅ 밝으면 검은색, 어두우면 흰색
      }
      return am4core.color("#FFFFFF"); // 기본값
    });

    // ✅ 애니메이션 효과 추가
    series.hiddenState.properties.opacity = 0;
    series.defaultState.transitionDuration = 1000;

    return () => {
      chart.dispose();
    };
  }, [data, colorRange, fontSize]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmHeatmapChart;
