'use client';

import { useEffect, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 차트
 * 03. 설명     : bar 다이얼 차트 기능 제공
 * 04. 작성일자  : 2025.02.06
 * 05. 작성자   : 이우창
 */


interface AmDialChartProps {
  currentStage?: number; // 현재 다이얼 위치 (기본값: 1)
  minStage?: number; // 최소 단계 (기본값: 1)
  maxStage?: number; // 최대 단계 (기본값: 5)
  dialColor?: string; // 다이얼 색상 (기본값: #007bff)
  dialBorderColor?: string; // 다이얼 테두리 색상 (기본값: #0056b3)
  labelColor?: string; // 라벨 텍스트 색상 (기본값: #f8f8f8)
  fontSize?: number; // 라벨 폰트 크기 (기본값: 20)
  rangeColors?: string[]; // 색상 범위 (기본값: 파란색 계열)
  width?: string; // ✅ 차트 가로 크기 설정 (기본값 100%)
  height?: string; // ✅ 차트 세로 크기 설정 (기본값 300px)  
}

const AmDialChart = ({
  currentStage = 1,
  minStage = 1,
  maxStage = 5,
  dialColor = '#007bff',
  dialBorderColor = '#0056b3',
  labelColor = '#f8f8f8',
  fontSize = 20,
  rangeColors = ['#99ccff', '#66b3ff', '#3399ff', '#007bff', '#0056b3'],
  width = '100%',
  height = '300px',  
}: AmDialChartProps) => {
  /******************** 변수 영역 ********************/
  const chartRef = useRef<HTMLDivElement>(null);

  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/

  useEffect(() => {
    if (!chartRef.current) return;

    // 차트 인스턴스 생성
    let chart = am4core.create(chartRef.current, am4charts.GaugeChart);
    chart.innerRadius = am4core.percent(70);

    // amCharts 로고 제거
    chart.logo.disabled = true;

    // 다이얼 축 생성
    let axis = chart.xAxes.push(new am4charts.ValueAxis<am4charts.AxisRendererCircular>());
    axis.min = minStage;
    axis.max = maxStage;
    axis.strictMinMax = true;
    axis.renderer.inside = true;
    axis.renderer.radius = am4core.percent(80);
    axis.renderer.line.strokeOpacity = 0;
    axis.renderer.ticks.template.disabled = true;
    axis.renderer.grid.template.disabled = true;
    axis.renderer.labels.template.disabled = true;

    // 각 단계의 라벨 표시 (안쪽으로 조정)
    for (let i = minStage; i <= maxStage; i++) {
      let axisRange = axis.axisRanges.create();
      axisRange.value = i + 0.5;
      axisRange.label.text = i.toString();
      axisRange.label.fill = am4core.color(labelColor); // 사용자 지정 색상 적용
      axisRange.label.inside = true;
      axisRange.label.horizontalCenter = 'middle';
      axisRange.label.verticalCenter = 'middle';
      axisRange.label.fontSize = fontSize; // 사용자 지정 폰트 크기 적용

      // 라벨을 더 안쪽으로 조정
      (axisRange.label as any).radius = am4core.percent(-10);
      axisRange.label.dy = -5;
    }

    // 각 단계의 색상 범위 설정
    rangeColors.forEach((color, index) => {
      let range = axis.axisRanges.create();
      range.value = minStage + index;
      range.endValue = minStage + index + 1;
      range.axisFill.fillOpacity = 1;
      range.axisFill.fill = am4core.color(color);
      range.axisFill.zIndex = -1;
    });

    // 다이얼 핸들 설정
    let hand = chart.hands.push(new am4charts.ClockHand());
    hand.value = currentStage + 0.5;
    hand.pin.fill = am4core.color(dialColor); // ✅ 사용자 지정 다이얼 색상 적용
    hand.fill = am4core.color(dialColor);
    hand.stroke = am4core.color(dialBorderColor); // ✅ 사용자 지정 다이얼 테두리 색상 적용
    hand.radius = am4core.percent(80);
    hand.startWidth = 10;
        
    // 차트가 언마운트되면 제거
    return () => {
      chart.dispose();
    };
  }, [currentStage, minStage, maxStage, dialColor, dialBorderColor, labelColor, fontSize, rangeColors]);

  return <div ref={chartRef} style={{ width: width, height: height }} />;
};

export default AmDialChart;
