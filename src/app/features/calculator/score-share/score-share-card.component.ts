import { Component, input, computed, inject, signal } from '@angular/core';
import { PensionResult } from '@core/models/pension-result.model';
import { RentenScoreService, RentenScore } from '@core/services/renten-score.service';
import { ShareService } from '@core/services/share.service';
import { AnalyticsService } from '@core/services/analytics.service';

/**
 * Shareable Renten-Score card that generates a 1200×630 OG-image-style
 * PNG using Canvas 2D API (zero external dependencies).
 * Supports Web Share API with clipboard and download fallbacks.
 */
@Component({
  selector: 'app-score-share-card',
  standalone: true,
  templateUrl: './score-share-card.component.html',
  styleUrls: ['./score-share-card.component.scss'],
})
export class ScoreShareCardComponent {
  private readonly scoreService = inject(RentenScoreService);
  private readonly shareService = inject(ShareService);
  private readonly analytics = inject(AnalyticsService);

  readonly result = input.required<PensionResult>();
  readonly gewuenschteRente = input.required<number>();

  readonly scoreData = computed<RentenScore>(() =>
    this.scoreService.computeScore(this.result(), this.gewuenschteRente())
  );

  readonly sharing = signal(false);
  readonly shareMessage = signal<string | null>(null);

  async share(): Promise<void> {
    this.sharing.set(true);
    this.shareMessage.set(null);

    try {
      const blob = await this.renderCard();
      const sc = this.scoreData();
      const title = `Mein Renten-Score: ${sc.score}/100 (Note ${sc.grade})`;
      const text = `Mein Renten-Score: ${sc.score} von 100 — Note ${sc.grade} (${sc.label}). Besser als ${sc.percentile}% der Deutschen. Teste deinen Score:`;

      const method = await this.shareService.shareImage(blob, title, text);

      if (method === 'clipboard') {
        this.shareMessage.set('📋 In die Zwischenablage kopiert!');
      } else if (method === 'download') {
        this.shareMessage.set('💾 Bild heruntergeladen!');
      }

      this.analytics.trackEvent('score_share', { method, score: sc.score });
    } catch (err) {
      console.error('[ScoreShare] Share failed:', err);
      this.shareMessage.set('Teilen fehlgeschlagen.');
    } finally {
      this.sharing.set(false);
      // Auto-dismiss message
      setTimeout(() => this.shareMessage.set(null), 3000);
    }
  }

  /**
   * Renders a 1200×630 OG-image-style card on a canvas and returns as PNG Blob.
   * Uses Canvas 2D API exclusively — no dependencies.
   */
  private async renderCard(): Promise<Blob> {
    const W = 1200, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const sc = this.scoreData();
    const r = this.result();

    // Background gradient (navy → dark blue)
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0f3460');
    grad.addColorStop(1, '#0a1f3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle pattern — decorative circles
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(W - 120, 120, 200, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(150, H - 80, 150, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Brand header
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('RentenCheck', 60, 60);
    ctx.fillStyle = '#e94560';
    const brandW = ctx.measureText('RentenCheck').width;
    ctx.fillText('+', 60 + brandW, 60);

    // Score circle
    const cx = 300, cy = 330, radius = 140;

    // Circle background
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();

    // Score arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (sc.score / 100) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = sc.color;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score arc background track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 16;
    ctx.stroke();

    // Redraw the colored arc on top
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = sc.color;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score number
    ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${sc.score}`, cx, cy + 20);

    // "von 100" label
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('von 100', cx, cy + 52);

    // Right side — Grade badge
    const rx = 660;
    ctx.textAlign = 'left';

    // Grade pill
    const pillY = 180;
    const pillW = 200, pillH = 48;
    ctx.fillStyle = sc.bgColor.replace('0.1', '0.25');
    this.roundRect(ctx, rx, pillY, pillW, pillH, 24);
    ctx.fill();

    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = sc.color;
    ctx.fillText(`${sc.grade}  ${sc.label}`, rx + 24, pillY + 33);

    // Percentile
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Besser als ${sc.percentile}% der Deutschen`, rx, pillY + 80);

    // Metrics
    const metrics = [
      { label: 'Nettorente', value: `${this.formatEur(r.nettoMonatlich)} /Monat` },
      { label: 'Rentenlücke', value: r.rentenluecke > 0 ? `−${this.formatEur(r.rentenluecke)}` : 'Keine' },
      { label: 'Deckungsquote', value: `${r.deckungsquote.toFixed(1)}%` },
    ];

    let my = pillY + 130;
    metrics.forEach(m => {
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillText(m.label, rx, my);

      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(m.value, rx, my + 32);
      my += 72;
    });

    // Footer bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, H - 60, W, 60);

    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('Teste deinen Renten-Score kostenlos:', 60, H - 22);

    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('rentencheckplus.de/rechner', W - 60, H - 22);

    // Convert to blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/png');
    });
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private formatEur(v: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v);
  }
}



