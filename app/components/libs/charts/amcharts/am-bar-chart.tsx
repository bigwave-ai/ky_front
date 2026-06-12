'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : bar 차트 기능 제공
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

// 인터페이스 정의 (사용자가 변경 가능한 모든 옵션 추가)
interface AmBarChartProps {
  data?: { category: string; value: number }[]; // 데이터 입력 (기본값: [])
  chartType?: 'horizontal' | 'vertical'; // 차트 방향 선택 가능 (기본값: vertical)
  barColor?: string; // 막대 색상 (기본값: 파란색 계열)
  borderColor?: string; // 막대 테두리 색상 (기본값: 동일한 색상)
  fontColor?: string; // 모든 텍스트 색상 (기본값: 검은색)
  fontSize?: number; // 모든 텍스트 폰트 크기 (기본값: 12)
  width?: string; // ✅ 차트 가로 크기 설정 (기본값 100%)
  height?: string; // ✅ 차트 세로 크기 설정 (기본값 300px)
  showLabels?:boolean;
}

const AmBarChart = ({
  data = [],
  chartType = 'vertical',
  barColor = '#007bff', // 기본 색상 (파란색)
  borderColor = '#0056b3', // 기본 테두리 색상 (어두운 파란색)
  fontColor = '#000000', // 기본 텍스트 색상 (검은색)
  fontSize = 12, // 기본 폰트 크기
  width = '100%',
  height = '300px',
  showLabels = true // 기본값 true
}: AmBarChartProps) => { 
  /******************** 변수 영역 ********************/
  const chartRef = useRef<HTMLDivElement>(null);

  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/

  useEffect(() => {
    if (!chartRef.current) return;

    // amCharts XY 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.XYChart);

    // 데이터 적용 (높은 값부터 정렬)
    chart.data = [...data]
      .sort((a, b) => b.value - a.value) // 높은 값이 먼저 오도록 정렬
      .map(item => ({
        category: item.category,
        value: Math.round(item.value), // 소수점 반올림
      }));

    // amCharts 로고 제거
    chart.logo.disabled = true;

    /* X축, Y축 설정 (차트 방향에 따라 조정) */
    let valueAxis: any, categoryAxis: any;

    if (chartType === 'horizontal') {
      // 가로 막대 차트 (X축 = 값, Y축 = 카테고리)
      valueAxis = chart.xAxes.push(new am4charts.ValueAxis());
      categoryAxis = chart.yAxes.push(new am4charts.CategoryAxis());
    } else {
      // 세로 막대 차트 (X축 = 카테고리, Y축 = 값)
      categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
      valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    }

    // X축 / Y축 스타일 적용
    valueAxis.renderer.labels.template.fill = am4core.color(fontColor);
    valueAxis.renderer.labels.template.fontSize = fontSize;

    categoryAxis.dataFields.category = "category";
    categoryAxis.renderer.grid.template.location = 0;
    categoryAxis.renderer.minGridDistance = 10;
    categoryAxis.renderer.labels.template.fill = am4core.color(fontColor);
    categoryAxis.renderer.labels.template.fontSize = fontSize;

    /* 시리즈(막대 차트) 설정 */
    let series = chart.series.push(new am4charts.ColumnSeries());

    if (chartType === 'horizontal') {
      series.dataFields.valueX = "value"; // X축에 값 설정 (가로 막대 차트)
      series.dataFields.categoryY = "category"; // Y축에 카테고리 설정
    } else {
      series.dataFields.valueY = "value"; // Y축에 값 설정 (세로 막대 차트)
      series.dataFields.categoryX = "category"; // X축에 카테고리 설정
    }

    series.columns.template.tooltipText = "{category}: [bold]{value}[/]"; // 툴팁 표시
    series.columns.template.fill = am4core.color(barColor); // 사용자 지정 색상 적용
    series.columns.template.stroke = am4core.color(borderColor); // 막대 테두리 색상 설정

    /* 값 표시 (라벨) 추가 */
    if (showLabels) {
      let labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.text = '{value.formatNumber("#,###")}'; // ✅ 천 단위 구분자 적용
      labelBullet.label.fill = am4core.color(fontColor); // ✅ 라벨 색상
      labelBullet.label.fontSize = fontSize; // ✅ 라벨 폰트 크기

      if (chartType === 'horizontal') {
        labelBullet.locationX = 0; // 가로 차트에서 막대 끝에 값 표시
        labelBullet.label.dx = 10; // 위치 조정
      } else {
        labelBullet.locationY = 0; // 세로 차트에서 막대 위에 값 표시
        labelBullet.label.dy = -10; // 위치 조정
      }
    }

    // 차트가 언마운트되면 제거
    return () => {
      chart.dispose();
    };
  }, [data, chartType, barColor, borderColor, fontColor, fontSize,showLabels]);

  return <div ref={chartRef} style={{ width: width, height: height }} />;
};

export default AmBarChart;
