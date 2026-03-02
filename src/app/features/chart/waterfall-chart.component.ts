import { Component, input, ElementRef, viewChild, effect, OnDestroy } from '@angular/core';
import { PensionResult, DeductionItem } from '../../core/models/pension-result.model';

/**
 * Waterfall chart showing how the gross pension is reduced step-by-step.
 * Uses pure Canvas rendering — no charting library dependency for this component.
 */
@Component({
  selector: 'app-waterfall-chart',
  standalone: true,
  template: `
    <div class="waterfall-container">
      <h3 class="chart-title">
        <span class="icon">📉</span> So schmilzt Ihre Rente
      </h3>
      <p class="chart-subtitle">Vom Brutto zur realen Kaufkraft — Schritt für Schritt</p>
      <div class="canvas-wrapper" #canvasWrapper>
        <canvas #waterfallCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .waterfall-container {
      margin-top: 1.5rem;
    }

    .chart-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1.3rem;
    }

    .chart-subtitle {
      font-size: 0.85rem;
      color: var(--color-text-light);
      margin-bottom: 1rem;
      font-style: italic;
    }

    .canvas-wrapper {
      width: 100%;
      position: relative;
    }

    canvas {
      display: block;
      width: 100%;
      height: 350px;
    }
  `],
})
export class WaterfallChartComponent implements OnDestroy {
  readonly result = input.required<PensionResult>();
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('waterfallCanvas');
  readonly wrapperRef = viewChild.required<ElementRef<HTMLDivElement>>('canvasWrapper');

  private resizeObserver: ResizeObserver | null = null;

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
    canvas.width = rect.width * dpr;
    canvas.height = 350 * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = 350;
    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Data segments
    const segments = [
      { label: 'Brutto', value: result.bruttoMonatlich, color: '#27ae60', isTotal: true },
      ...result.abzuege.map((a: DeductionItem) => ({ label: a.label.replace('Krankenversicherung (KVdR)', 'KVdR'), value: -a.betrag, color: a.farbe, isTotal: false })),
      { label: 'Real', value: result.realeKaufkraftMonatlich, color: '#e94560', isTotal: true },
    ];

    const maxValue = result.bruttoMonatlich * 1.1;
    const barWidth = Math.min(60, chartWidth / segments.length - 12);
    const gap = (chartWidth - barWidth * segments.length) / (segments.length - 1);

    // Scale helper
    const scaleY = (val: number) => chartHeight - (val / maxValue) * chartHeight;

    let runningTotal = result.bruttoMonatlich;

    segments.forEach((seg, i) => {
      const x = padding.left + i * (barWidth + gap);

      if (seg.isTotal) {
        // Full bar from bottom
        const barHeight = (Math.abs(seg.value) / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        // Bar
        ctx.fillStyle = seg.color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // Value label
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(seg.value)} €`, x + barWidth / 2, y - 6);
      } else {
        // Waterfall segment (hanging from running total)
        const topY = padding.top + scaleY(runningTotal);
        const segHeight = (Math.abs(seg.value) / maxValue) * chartHeight;

        // Connector line
        if (i > 0) {
          ctx.strokeStyle = '#dee2e6';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(x - gap + 2, topY);
          ctx.lineTo(x - 2, topY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Deduction bar
        ctx.fillStyle = seg.color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(x, topY, barWidth, segHeight, [0, 0, 4, 4]);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Value label
        ctx.fillStyle = seg.color;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`-${Math.round(Math.abs(seg.value))} €`, x + barWidth / 2, topY + segHeight + 14);

        runningTotal += seg.value; // seg.value is negative
      }

      // X-axis label
      ctx.fillStyle = '#7f8c8d';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      const labelLines = this.wrapText(seg.label, 10);
      labelLines.forEach((line, li) => {
        ctx.fillText(line, x + barWidth / 2, height - padding.bottom + 14 + li * 12);
      });
    });

    // Y-axis
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let v = 0; v <= maxValue; v += 250) {
      const y = padding.top + scaleY(v);
      ctx.beginPath();
      ctx.moveTo(padding.left - 5, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#adb5bd';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${v} €`, padding.left - 10, y + 4);
    }
  }

  private wrapText(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) return [text];
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if ((current + ' ' + word).trim().length > maxChars && current) {
        lines.push(current.trim());
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2); // Max 2 lines
  }
}

