import { Component, input, ElementRef, viewChild, effect, OnDestroy, computed } from '@angular/core';
import { PensionResult, DeductionItem } from '../../core/models/pension-result.model';

/**
 * Waterfall chart showing how the gross pension is reduced step-by-step.
 * Uses pure Canvas rendering — no charting library dependency for this component.
 */
@Component({
  selector: 'app-waterfall-chart',
  standalone: true,
  templateUrl: './waterfall-chart.component.html',
  styleUrls: ['./waterfall-chart.component.scss'],
})
export class WaterfallChartComponent implements OnDestroy {
  readonly result = input.required<PensionResult>();
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('waterfallCanvas');
  readonly wrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('canvasWrapper');

  private resizeObserver: ResizeObserver | null = null;

  /** Short labels for x-axis, full labels for legend */
  private readonly labelMap: Record<string, string> = {
    'Brutto': 'Brutto',
    'Einkommensteuer': 'ESt',
    'Solidaritätszuschlag': 'Soli',
    'Krankenversicherung (KVdR)': 'KVdR',
    'KVdR': 'KVdR',
    'Pflegeversicherung': 'Pflege',
    'Inflationsverlust': 'Inflation',
    'Real': 'Real',
  };

  readonly legendItems = computed(() => {
    const result = this.result();
    if (!result) return [];
    const brutto = result.bruttoMonatlich;
    const items: { label: string; color: string; detail?: string }[] = [
      { label: 'Bruttorente', color: '#27ae60', detail: `${Math.round(brutto).toLocaleString('de-DE')} €` },
    ];
    for (const a of result.abzuege) {
      if (a.betrag > 0) {
        const pct = brutto > 0 ? ((a.betrag / brutto) * 100).toFixed(1) : '0.0';
        items.push({
          label: a.label.replace('Krankenversicherung (KVdR)', 'Krankenversicherung'),
          color: a.farbe,
          detail: `${pct}%`,
        });
      }
    }
    const realPct = brutto > 0 ? ((result.realeKaufkraftMonatlich / brutto) * 100).toFixed(0) : '0';
    items.push({
      label: 'Reale Kaufkraft',
      color: '#e94560',
      detail: `${realPct}% vom Brutto`,
    });
    return items;
  });

  constructor() {
    effect(() => {
      const result = this.result();
      const canvas = this.canvasRef();
      if (canvas && result) {
        this.drawChart(canvas.nativeElement, result);
        this.setupResizeObserver(result);
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private setupResizeObserver(result: PensionResult): void {
    this.resizeObserver?.disconnect();
    const wrapper = this.wrapperRef()?.nativeElement;
    if (!wrapper) return;

    this.resizeObserver = new ResizeObserver(() => {
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas) {
        this.drawChart(canvas, result);
      }
    });
    this.resizeObserver.observe(wrapper);
  }

  private drawChart(canvas: HTMLCanvasElement, result: PensionResult): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const canvasHeight = 320;
    canvas.width = rect.width * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = canvasHeight;
    const padding = { top: 20, right: 20, bottom: 40, left: 55 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Data segments
    const segments = [
      { label: 'Brutto', value: result.bruttoMonatlich, color: '#27ae60', isTotal: true },
      ...result.abzuege.map((a: DeductionItem) => ({
        label: a.label,
        value: -a.betrag,
        color: a.farbe,
        isTotal: false,
      })),
      { label: 'Real', value: result.realeKaufkraftMonatlich, color: '#e94560', isTotal: true },
    ];

    const maxValue = result.bruttoMonatlich * 1.1;
    const barWidth = Math.min(56, chartWidth / segments.length - 14);
    const totalBarsWidth = barWidth * segments.length;
    const gap = segments.length > 1 ? (chartWidth - totalBarsWidth) / (segments.length - 1) : 0;

    // Scale helper
    const scaleY = (val: number) => chartHeight - (val / maxValue) * chartHeight;

    // --- Y-axis gridlines (fewer, cleaner) ---
    const niceStep = this.niceGridStep(maxValue);

    // Pass 1: Draw gridlines
    for (let v = 0; v <= maxValue; v += niceStep) {
      const y = padding.top + scaleY(v);
      ctx.strokeStyle = '#edf2f7';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // --- Draw bars ---
    let runningTotal = result.bruttoMonatlich;

    segments.forEach((seg, i) => {
      const x = padding.left + i * (barWidth + gap);
      const shortLabel = this.labelMap[seg.label] || seg.label.substring(0, 6);

      if (seg.isTotal) {
        // Full bar from bottom
        const barHeight = (Math.abs(seg.value) / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        // Bar with rounded top corners
        ctx.fillStyle = seg.color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // Value label above bar
        ctx.fillStyle = '#2d3748';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(seg.value).toLocaleString('de-DE')} €`, x + barWidth / 2, y - 7);
      } else {
        // Waterfall segment (hanging from running total)
        const topY = padding.top + scaleY(runningTotal);
        const segHeight = (Math.abs(seg.value) / maxValue) * chartHeight;

        // Connector line from previous bar
        if (i > 0) {
          ctx.strokeStyle = '#cbd5e0';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(x - gap + 2, topY);
          ctx.lineTo(x - 2, topY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Deduction bar
        ctx.fillStyle = seg.color;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.roundRect(x, topY, barWidth, segHeight, [0, 0, 4, 4]);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Value label — only if bar is large enough to be meaningful (> 5px)
        if (segHeight > 5) {
          const valueLabelText = `-${Math.round(Math.abs(seg.value)).toLocaleString('de-DE')} €`;
          ctx.font = 'bold 10px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';

          const belowBarY = topY + segHeight + 14;
          const xAxisLabelY = height - padding.bottom;

          if (belowBarY < xAxisLabelY - 4) {
            // Draw below the bar
            ctx.fillStyle = seg.color;
            ctx.fillText(valueLabelText, x + barWidth / 2, belowBarY);
          } else if (segHeight > 22) {
            // Bar is tall enough — draw inside the bar
            ctx.fillStyle = 'white';
            ctx.fillText(valueLabelText, x + barWidth / 2, topY + segHeight / 2 + 4);
          }
          // else: bar too small and no room below → skip label to avoid clutter
        }

        runningTotal += seg.value;
      }

      // X-axis short label
      ctx.fillStyle = '#718096';
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shortLabel, x + barWidth / 2, height - padding.bottom + 16);
    });

    // --- Baseline axis line at y = 0 ---
    const baselineY = padding.top + chartHeight;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(padding.left, baselineY);
    ctx.lineTo(width - padding.right, baselineY);
    ctx.stroke();

    // --- Y-axis labels (drawn last so they sit on top of everything) ---
    ctx.textAlign = 'right';
    ctx.font = '10px Inter, system-ui, sans-serif';
    for (let v = 0; v <= maxValue; v += niceStep) {
      const y = padding.top + scaleY(v);
      const labelText = this.formatAxisValue(v);
      const textMetrics = ctx.measureText(labelText);
      const textW = textMetrics.width;
      const textH = 10; // approximate font size

      // White background behind label for readability
      ctx.fillStyle = 'white';
      ctx.fillRect(padding.left - 8 - textW - 2, y - textH / 2 - 1, textW + 4, textH + 2);

      // Label text
      ctx.fillStyle = '#a0aec0';
      ctx.fillText(labelText, padding.left - 8, y + 3.5);
    }
  }

  /** Calculate a nice round step for gridlines — aim for 3-5 lines */
  private niceGridStep(maxValue: number): number {
    const rough = maxValue / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const normalized = rough / mag;
    let nice: number;
    if (normalized <= 1.5) nice = 1;
    else if (normalized <= 3.5) nice = 2.5;
    else if (normalized <= 7.5) nice = 5;
    else nice = 10;
    return nice * mag;
  }

  /** Format axis values: 1000 → "1.000 €", 500 → "500 €" */
  private formatAxisValue(value: number): string {
    return `${Math.round(value).toLocaleString('de-DE')} €`;
  }
}

