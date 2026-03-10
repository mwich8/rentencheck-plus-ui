import { Component, input, computed } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { PensionResult } from '@core/models/pension-result.model';
import type { EChartsOption } from 'echarts';

/**
 * Projection chart showing nominal vs. real pension purchasing power over 30 years.
 * Uses ECharts area/line chart with a danger-colored gap between curves.
 */
@Component({
  selector: 'app-projection-chart',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './projection-chart.component.html',
  styleUrls: ['./projection-chart.component.scss'],
})
export class ProjectionChartComponent {
  readonly result = input.required<PensionResult>();

  readonly chartOptions = computed<EChartsOption>(() => {
    const data = this.result().inflationsVerlauf;
    if (!data || data.length === 0) return {};

    const years = data.map(d => `${d.jahr}`);
    const nominal = data.map(d => d.nominalMonatlich);
    const real = data.map(d => d.realMonatlich);

    const euroFormatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderColor: '#0f3460',
        borderWidth: 1,
        textStyle: {
          color: '#f8f9fa',
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length < 2) return '';
          const yearIndex = params[0].dataIndex;
          const d = data[yearIndex];
          const verlust = d.nominalMonatlich - d.realMonatlich;
          const verlustProzent = d.nominalMonatlich > 0
            ? ((verlust / d.nominalMonatlich) * 100).toFixed(1)
            : '0.0';
          return `
            <div style="font-weight:700;margin-bottom:8px">Jahr ${d.jahr} (Alter ${d.alter})</div>
            <div style="color:#27ae60">● Nominal: ${euroFormatter.format(d.nominalMonatlich)}</div>
            <div style="color:#e94560">● Real: ${euroFormatter.format(d.realMonatlich)}</div>
            <div style="color:#f39c12;margin-top:6px;font-weight:600">
              Kaufkraftverlust: ${euroFormatter.format(verlust)} (${verlustProzent}%)
            </div>
          `;
        },
      },
      legend: {
        data: ['Nominale Rente', 'Reale Kaufkraft'],
        top: 0,
        textStyle: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#7f8c8d',
        },
      },
      grid: {
        left: 65,
        right: 20,
        top: 40,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#7f8c8d',
          interval: 4,
          rotate: 0,
        },
        axisLine: { lineStyle: { color: '#e9ecef' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#7f8c8d',
          formatter: (value: number) => euroFormatter.format(value),
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
        min: (value: { min: number }) => Math.max(0, Math.floor(value.min / 100) * 100 - 100),
      },
      series: [
        {
          name: 'Nominale Rente',
          type: 'line',
          data: nominal,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 2.5,
            color: '#27ae60',
            type: 'dashed',
          },
          itemStyle: { color: '#27ae60' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(39, 174, 96, 0.08)' },
                { offset: 1, color: 'rgba(39, 174, 96, 0.01)' },
              ],
            },
          },
        },
        {
          name: 'Reale Kaufkraft',
          type: 'line',
          data: real,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            width: 3,
            color: '#e94560',
          },
          itemStyle: { color: '#e94560' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(233, 69, 96, 0.25)' },
                { offset: 1, color: 'rgba(233, 69, 96, 0.02)' },
              ],
            },
          },
        },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut',
    };
  });
}
