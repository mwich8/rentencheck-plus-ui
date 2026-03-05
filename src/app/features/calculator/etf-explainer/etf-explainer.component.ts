import { Component, input, computed, signal, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionResult } from '@core/models/pension-result.model';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { environment } from '@env/environment';
import type { EChartsOption } from 'echarts';

/**
 * ETF Explainer — educational accordion section that explains ETFs
 * in plain German, shows personalized compound growth, and provides
 * a tasteful affiliate broker CTA.
 * Only shown when the user has a pension gap.
 */
@Component({
  selector: 'app-etf-explainer',
  standalone: true,
  imports: [NgxEchartsDirective, EuroPipe],
  templateUrl: './etf-explainer.component.html',
  styleUrls: ['./etf-explainer.component.scss'],
})
export class EtfExplainerComponent {
  private readonly savingsService = inject(SavingsCalculatorService);
  private readonly analytics = inject(AnalyticsService);

  readonly result = input.required<PensionResult>();
  readonly affiliateUrl = environment.affiliate.brokerUrl;

  readonly activePanel = signal<number | null>(null);
  readonly sectionExpanded = signal(false);

  /** Required monthly ETF savings to close the gap */
  readonly etfMonthly = computed(() => {
    const res = this.result();
    if (res.rentenluecke <= 0 || res.jahresBisRente <= 0) return 0;
    return Math.round(
      this.savingsService.calculateRequiredMonthlySavings(res.rentenluecke, 0.07, res.jahresBisRente, 25)
    );
  });

  /** Full projection for the ETF strategy */
  readonly etfProjection = computed(() => {
    const monthly = this.etfMonthly();
    const years = this.result().jahresBisRente;
    if (monthly <= 0 || years <= 0) {
      return { endkapital: 0, eigenanteil: 0, renditeErtrag: 0, monatlicheAuszahlung: 0 };
    }
    return this.savingsService.calculateFutureValue(monthly, 0.07, years, 25);
  });

  /** Percentage of end capital that came from returns (not contributions) */
  readonly renditeAnteil = computed(() => {
    const proj = this.etfProjection();
    if (proj.endkapital <= 0) return 0;
    return Math.round((proj.renditeErtrag / proj.endkapital) * 100);
  });

  /** Year-by-year growth data for the personalized chart */
  readonly chartOptions = computed<EChartsOption>(() => {
    const monthly = this.etfMonthly();
    const years = this.result().jahresBisRente;
    if (monthly <= 0 || years <= 0) return {};

    const labels: string[] = [];
    const etfValues: number[] = [];
    const savingsValues: number[] = [];
    const eigenanteilValues: number[] = [];

    for (let y = 0; y <= years; y++) {
      labels.push(`${y}`);
      if (y === 0) {
        etfValues.push(0);
        savingsValues.push(0);
        eigenanteilValues.push(0);
      } else {
        const etf = this.savingsService.calculateFutureValue(monthly, 0.07, y, 25);
        const savings = this.savingsService.calculateFutureValue(monthly, 0.015, y, 25);
        etfValues.push(Math.round(etf.endkapital));
        savingsValues.push(Math.round(savings.endkapital));
        eigenanteilValues.push(monthly * y * 12);
      }
    }

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
        textStyle: { color: '#f8f9fa', fontFamily: 'Inter, sans-serif', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length < 2) return '';
          const y = params[0].dataIndex;
          return `
            <div style="font-weight:700;margin-bottom:6px">Jahr ${y}</div>
            <div style="color:#27ae60">\u25cf ETF (7%): ${euroFormatter.format(etfValues[y])}</div>
            <div style="color:#f39c12">\u25cf Sparkonto (1,5%): ${euroFormatter.format(savingsValues[y])}</div>
            <div style="color:#94a3b8;margin-top:4px">Eingezahlt: ${euroFormatter.format(eigenanteilValues[y])}</div>
            <div style="color:#27ae60;font-weight:600;margin-top:4px">
              Rendite-Vorteil ETF: ${euroFormatter.format(etfValues[y] - savingsValues[y])}
            </div>
          `;
        },
      },
      legend: {
        data: ['ETF-Sparplan (7% p.a.)', 'Sparkonto (1,5% p.a.)', 'Eingezahlt'],
        top: 0,
        textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#7f8c8d' },
      },
      grid: { left: 60, right: 20, top: 40, bottom: 35 },
      xAxis: {
        type: 'category',
        data: labels,
        name: 'Jahre',
        nameLocation: 'middle',
        nameGap: 22,
        nameTextStyle: { fontSize: 11, color: '#7f8c8d', fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#7f8c8d',
          interval: Math.max(0, Math.floor(years / 6)),
        },
        axisLine: { lineStyle: { color: '#e9ecef' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#7f8c8d',
          formatter: (v: number) => v >= 1000 ? `${Math.round(v / 1000)}k \u20ac` : `${v} \u20ac`,
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'ETF-Sparplan (7% p.a.)',
          type: 'line',
          data: etfValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: '#27ae60' },
          itemStyle: { color: '#27ae60' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(39, 174, 96, 0.2)' },
                { offset: 1, color: 'rgba(39, 174, 96, 0.02)' },
              ],
            },
          },
        },
        {
          name: 'Sparkonto (1,5% p.a.)',
          type: 'line',
          data: savingsValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#f39c12', type: 'dashed' },
          itemStyle: { color: '#f39c12' },
        },
        {
          name: 'Eingezahlt',
          type: 'line',
          data: eigenanteilValues,
          smooth: false,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#94a3b8', type: 'dotted' },
          itemStyle: { color: '#94a3b8' },
        },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut',
    };
  });

  /**
   * MSCI World historic performance chart (1975-2025).
   * Data: MSCI World Net Total Return Index, year-end values normalized to 100 in 1975.
   */
  readonly msciHistoryChartOptions = computed<EChartsOption>(() => {
    // Labels — 'Q1 20' is the Corona crash low (March 2020)
    const labels = [
      '1975', '1976', '1977', '1978', '1979', '1980',
      '1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990',
      '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000',
      '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010',
      '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019',
      'Q1 20', '2020',
      '2021', '2022', '2023', '2024', '2025',
    ];
    // Values — 'Q1 20' = Corona crash low (~34% drop from Feb 2020 peak)
    const values = [
      100, 115, 117, 141, 152, 178,
      172, 183, 209, 215, 281, 395, 414, 490, 557, 471,
      547, 524, 643, 678, 818, 924, 1094, 1363, 1684, 1488,
      1261, 997, 1312, 1503, 1627, 1951, 1996, 1159, 1501, 1677,
      1580, 1828, 2303, 2418, 2357, 2549, 3103, 2862, 3633,
      2398, 4222,
      5122, 4178, 5176, 5850, 6200,
    ];

    // Crisis data-point indices (for markPoint coord references)
    // '2002' = index 27, '2008' = index 33, 'Q1 20' = index 45, '2022' = index 48
    const crisisPoints: Array<{ idx: number; label: string }> = [
      { idx: 27, label: 'Dotcom' },
      { idx: 33, label: 'Finanzkrise' },
      { idx: 45, label: 'Corona' },
      { idx: 48, label: 'Zinswende' },
    ];

    const euroFormatter = new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderColor: '#0f3460',
        borderWidth: 1,
        textStyle: { color: '#f8f9fa', fontFamily: 'Inter, sans-serif', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const idx = params[0].dataIndex;
          const label = labels[idx];
          const val = values[idx];
          const pct = ((val / 100 - 1) * 100).toFixed(0);
          return '<div style="font-weight:700;margin-bottom:4px">' + label + '</div>'
            + '<div>Wert: ' + euroFormatter.format(val) + '</div>'
            + '<div style="color:' + (val >= 100 ? '#27ae60' : '#e74c3c') + '">'
            + (val >= 100 ? '+' : '') + pct + '% seit 1975</div>'
            + '<div style="color:#94a3b8;font-size:11px;margin-top:3px">Aus 100 \u20ac wurden '
            + euroFormatter.format(val) + '</div>';
        },
      },
      grid: { left: 55, right: 20, top: 30, bottom: 55 },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: {
          fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#7f8c8d',
          interval: (index: number) => {
            const l = labels[index];
            if (l === 'Q1 20') return false; // hide 'Q1 20' from axis
            const n = parseInt(l, 10);
            return !isNaN(n) && n % 5 === 0;
          },
          rotate: 45,
        },
        axisLine: { lineStyle: { color: '#e9ecef' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#7f8c8d',
          formatter: (v: number) => v.toLocaleString('de-DE') + ' \u20ac',
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'line',
          // Use [label, value] tuples so markPoint coord references work reliably
          data: labels.map((l, i) => [l, values[i]]),
          smooth: false,
          symbol: 'none',
          lineStyle: { width: 2.5, color: '#0f3460' },
          itemStyle: { color: '#0f3460' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(15, 52, 96, 0.15)' },
                { offset: 1, color: 'rgba(15, 52, 96, 0.01)' },
              ],
            },
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#e74c3c', borderColor: '#fff', borderWidth: 1.5 },
            label: {
              show: true,
              fontSize: 9,
              fontWeight: 'bold' as const,
              color: '#e74c3c',
              fontFamily: 'Inter, sans-serif',
              position: 'bottom',
              distance: 12,
              formatter: (p: any) => p.name,
            },
            data: crisisPoints.map(cp => ({
              name: cp.label,
              coord: [labels[cp.idx], values[cp.idx]],
            })),
          },
        },
      ],
      animationDuration: 1200,
      animationEasing: 'cubicOut',
    };
  });

  toggleSection(): void {
    this.sectionExpanded.update(v => !v);
  }

  togglePanel(index: number): void {
    this.activePanel.update(current => current === index ? null : index);
  }

  onAffiliateClick(): void {
    this.analytics.trackAffiliateClick('etf_explainer');
  }
}



