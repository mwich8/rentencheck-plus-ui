import { Component, input, computed, signal, effect, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionResult } from '../../../core/models/pension-result.model';

/**
 * The "Shock Number" — displays the real purchasing power with dramatic emphasis.
 * Animates when the value changes for maximum emotional impact.
 */
@Component({
  selector: 'app-shock-number',
  standalone: true,
  imports: [EuroPipe, DecimalPipe],
  template: `
    <div class="shock-container">
      <div class="shock-label">Ihre reale Kaufkraft im Alter</div>
      <div class="shock-number" [class.critical]="isCritical()">
        {{ displayValue() | euro }}
        <span class="per-month">/ Monat</span>
      </div>
      <div class="shock-sublabel">
        nach Steuern, Sozialabgaben & Inflation
      </div>

      @if (result().rentenluecke > 0) {
        <div class="gap-display">
          <div class="gap-icon">⚠️</div>
          <div class="gap-content">
            <div class="gap-label">Ihre monatliche Rentenlücke</div>
            <div class="gap-amount">{{ result().rentenluecke | euro }}</div>
            <div class="gap-coverage">
              Ihre Rente deckt nur
              <strong [class.text-danger]="result().deckungsquote < 60"
                      [class.text-warning]="result().deckungsquote >= 60 && result().deckungsquote < 80"
                      [class.text-success]="result().deckungsquote >= 80">
                {{ result().deckungsquote | number:'1.1-1' }}%
              </strong>
              Ihres gewünschten Einkommens
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .shock-container {
      text-align: center;
      padding: 1.75rem 1rem 2rem;
    }

    .shock-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-text-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.4rem;
    }

    .shock-number {
      font-size: 3.5rem;
      font-weight: 900;
      color: var(--color-danger);
      line-height: 1.1;
      transition: color 0.3s ease;
      font-variant-numeric: tabular-nums;
    }

    .shock-number.critical {
      animation: pulseRed 2s ease-in-out infinite;
    }

    .per-month {
      font-size: 1.1rem;
      font-weight: 400;
      color: var(--color-text-light);
    }

    .shock-sublabel {
      font-size: 0.8rem;
      color: var(--color-text-light);
      margin-top: 0.4rem;
    }

    .gap-display {
      margin-top: 1.75rem;
      padding: 1.25rem 1.25rem;
      background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
      border-radius: var(--radius-md);
      border: 1px solid #fecaca;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      text-align: left;
      animation: fadeInUp 0.5s ease-out both;
    }

    .gap-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
      line-height: 1;
    }

    .gap-content {
      flex: 1;
      min-width: 0;
    }

    .gap-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.2rem;
    }

    .gap-amount {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--color-danger);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }

    .gap-coverage {
      font-size: 0.85rem;
      color: var(--color-text);
      margin-top: 0.4rem;
      line-height: 1.5;
    }

    .gap-coverage strong {
      font-size: 1.05rem;
    }

    @media (max-width: 768px) {
      .shock-number {
        font-size: 2.5rem;
      }

      .gap-amount {
        font-size: 1.4rem;
      }
    }
  `],
})
export class ShockNumberComponent implements OnDestroy {
  readonly result = input.required<PensionResult>();

  readonly isCritical = computed(() => this.result().deckungsquote < 50);

  /** Animated display value for the count-up effect */
  readonly displayValue = signal(0);

  private animationFrameId: number | null = null;
  private previousTarget = 0;

  constructor() {
    effect(() => {
      const target = this.result().realeKaufkraftMonatlich;
      this.animateCountUp(this.previousTarget, target);
      this.previousTarget = target;
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animateCountUp(from: number, to: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const duration = 600; // ms
    const start = performance.now();

    const step = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      this.displayValue.set(Math.round(current * 100) / 100);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.displayValue.set(to);
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }
}

