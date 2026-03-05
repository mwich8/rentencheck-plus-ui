import { Component, input, computed, signal, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionResult } from '@core/models/pension-result.model';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';
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

  readonly result = input.required<PensionResult>();

  readonly activePanel = signal<number | null>(0);

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

  /** Year-by-year growth data for the chart */
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
            <div style="color:#27ae60">● ETF (7%): ${euroFormatter.format(etfValues[y])}</div>
            <div style="color:#f39c12">● Sparkonto (1,5%): ${euroFormatter.format(savingsValues[y])}</div>
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
          formatter: (v: number) => v >= 1000 ? `${Math.round(v / 1000)}k €` : `${v} €`,
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

  togglePanel(index: number): void {
    this.activePanel.update(current => current === index ? null : index);
  }

  onAffiliateClick(): void {
    // Track affiliate link click for analytics
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'affiliate_click', {
          event_category: 'monetization',
          event_label: 'broker_depot',
        });
      }
    } catch { /* ignore tracking errors */ }
  }
}



