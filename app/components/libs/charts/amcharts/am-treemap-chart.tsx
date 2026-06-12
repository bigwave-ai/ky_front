'use client';

import { useLayoutEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : 트리맵 차트 기능 제공
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */

interface AmTreeMapChartProps {
  data?: { name: string; value: number }[]; // ✅ 트리맵 데이터
  colorSet?: string[]; // ✅ 색상 배열
  fontSize?: number; // ✅ 텍스트 폰트 크기 (기본값: 12)
  width?: string; // ✅ 차트 가로 크기
  height?: string; // ✅ 차트 세로 크기
}

const AmTreeMapChart = ({
  data = [],
  colorSet = ['#007bff', '#0056b3', '#66b3ff', '#3399ff', '#99ccff'],
  fontSize = 12,
  width = '100%',
  height = '300px',
}: AmTreeMapChartProps) => {
  /******************** 변수 영역 ********************/
  const chartRef = useRef<HTMLDivElement>(null);

  /******************** 수행 영역 ********************/
  useLayoutEffect(() => {
    if (!chartRef.current) return;

    // ✅ 트리맵 차트 생성
    let chart = am4core.create(chartRef.current, am4charts.TreeMap);
    chart.data = data.map((item, index) => ({
      name: item.name,
      value: item.value,
      color: colorSet[index % colorSet.length], // ✅ 지정된 색상 사용
    }));

    // ✅ amCharts 로고 제거
    chart.logo.disabled = true;

    //name과 value 지정
    chart.dataFields.value = 'value';
    chart.dataFields.name = 'name';
    chart.dataFields.children = 'children';
    chart.dataFields.color = 'color';
    chart.strokeWidth = 1;

    // ✅ 트리맵 시리즈 추가
    // let series = chart.series.push(new am4charts.TreeMapSeries());
    
    // // ✅ 라벨 설정 (기본적으로 가운데 정렬)
    // let label_bullet = series.bullets.push(new am4charts.LabelBullet());
    // label_bullet.locationY = 0.5;
    // label_bullet.locationX = 0.5;
    // label_bullet.label.text = "{name}";
    // label_bullet.label.fill = am4core.color("#fff");

    // ✅ 차트가 언마운트되면 제거
    return () => {
      chart.dispose();
    };
  }, [data, colorSet, fontSize]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default AmTreeMapChart;
