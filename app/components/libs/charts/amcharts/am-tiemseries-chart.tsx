'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 시계열 차트 기능 제공
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmTimeSeriesChartProps {
  data?: { date: string; value: number }[]; // 시계열 데이터 (기본값: [])
  lineColor?: string; // 선 색상 (기본값: 파란색 계열)
  fontSize?: number; // 폰트 크기 (기본값: 12)
  showLabels?: boolean; // ✅ 차트에 항상 라벨 표시 여부 (기본값: true)
  width?: string; // ✅ 차트 가로 크기 설정 (기본값 100%)
  height?: string; // ✅ 차트 세로 크기 설정 (기본값 300px)  
}

const AmTimeSeriesChart = ({
  data = [],
  lineColor = '#007bff',
  fontSize = 12,
  showLabels = true, // ✅ 기본값 true로 설정
  width = '100%',
  height = '300px',  
}: AmTimeSeriesChartProps) => {

  /******************** 변수 영역 ********************/
  const chartRef = useRef<HTMLDivElement>(null);

  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/

  useEffect(() => {
    if (!chartRef.current) return;

    // ✅ amCharts 시계열 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.XYChart);

    // ✅ 데이터 설정
    chart.data = data.map(item => ({
      date: new Date(item.date), // ✅ Date 객체 변환 (중요)
      value: item.value,
    }));

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    /* X축 (시간 축) 설정 */
    let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.grid.template.location = 0;
    dateAxis.renderer.labels.template.fill = am4core.color("#000000");
    dateAxis.renderer.labels.template.fontSize = fontSize;
    dateAxis.tooltipDateFormat = "yyyy-MM-dd HH:mm";

    /* Y축 (값 축) 설정 */
    let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fill = am4core.color("#000000");
    valueAxis.renderer.labels.template.fontSize = fontSize;

    /* 시리즈 (라인 차트) 설정 */
    let series = chart.series.push(new am4charts.LineSeries());
    series.dataFields.valueY = "value";
    series.dataFields.dateX = "date";
    series.strokeWidth = 2;
    series.stroke = am4core.color(lineColor);
    series.tooltipText = "{date.formatDate('yyyy-MM-dd HH:mm')}: [bold]{valueY}[/]"; // ✅ 툴팁 형식 개선
    series.name = "데이터 값"; // ✅ 범례 표시 이름 추가

    // ✅ 마커(데이터 점) 추가
    let bullet = series.bullets.push(new am4charts.CircleBullet());
    bullet.circle.stroke = am4core.color(lineColor);
    bullet.circle.fill = am4core.color("#ffffff");
    bullet.circle.strokeWidth = 2;

    /* 차트 커서 추가 (툴팁 개선) */
    chart.cursor = new am4charts.XYCursor();
    chart.cursor.lineY.opacity = 0;
    chart.cursor.lineX.strokeOpacity = 0.5;
    chart.cursor.behavior = "none"; // ✅ 툴팁이 고정되도록 설정

    /* 범례 추가 */
    chart.legend = new am4charts.Legend();
    chart.legend.labels.template.fill = am4core.color("#000000");
    chart.legend.labels.template.fontSize = fontSize;

    /* 항상 데이터 값 표시 (옵션) */
    if (showLabels) {
      let labelBullet = series.bullets.push(new am4charts.LabelBullet());
      labelBullet.label.text = "{valueY}";
      labelBullet.label.fontSize = fontSize;
      labelBullet.label.fill = am4core.color("#000000");
      labelBullet.locationY = 0;
      labelBullet.dy = -15; // ✅ 값이 위에 표시되도록 조정
    }

    // ✅ 차트가 언마운트되면 제거
    return () => {
      chart.dispose();
    };
  }, [data, lineColor, fontSize, showLabels]);

  return <div ref={chartRef} style={{ width: width, height: height }} />;
};

export default AmTimeSeriesChart;
