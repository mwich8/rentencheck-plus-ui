import { Component, input, computed, signal, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionInput } from '../../../core/models/pension-input.model';
import { PensionResult } from '../../../core/models/pension-result.model';
import { PensionCalculatorService } from '../../../core/services/pension-calculator.service';

/**
 * Was-wäre-wenn-Analyse — interactive sliders let the user explore
 * how changes to brutto pension, inflation, and retirement year affect
 * their real outcome, with live delta comparison.
 */
@Component({
  selector: 'app-what-if-analysis',
  standalone: true,
  imports: [FormsModule, EuroPipe, DecimalPipe],
  template: `
    <div class="whatif-section">
      <h3 class="section-title">
        <span class="icon">🧪</span> Was-wäre-wenn-Analyse
      </h3>
      <p class="section-subtitle">
        Bewegen Sie die Regler und sehen Sie sofort, wie Änderungen Ihre Rente beeinflussen.
      </p>

      <div class="whatif-layout">
        <!-- Sliders -->
        <div class="whatif-controls">
          <div class="control-group">
            <label>
              Bruttorente
              @if (whatIfBrutto() !== pensionInput().bruttoMonatlicheRente) {
                <span class="label-delta" [class.positive]="whatIfBrutto() > pensionInput().bruttoMonatlicheRente" [class.negative]="whatIfBrutto() < pensionInput().bruttoMonatlicheRente">
                  ({{ whatIfBrutto() > pensionInput().bruttoMonatlicheRente ? '+' : '' }}{{ whatIfBrutto() - pensionInput().bruttoMonatlicheRente }} €)
                </span>
              }
            </label>
            <div class="slider-row">
              <input type="range"
                [min]="200" [max]="4000" [step]="25"
                [ngModel]="whatIfBrutto()"
                (ngModelChange)="whatIfBrutto.set($event)"
              />
              <output class="slider-output">{{ whatIfBrutto() | euro }}</output>
            </div>
            <div class="range-labels">
              <span>200 €</span><span>4.000 €</span>
            </div>
          </div>

          <div class="control-group">
            <label>
              Inflationsrate
              @if (whatIfInflationPct() !== baselineInflationPct()) {
                <span class="label-delta" [class.positive]="whatIfInflationPct() < baselineInflationPct()" [class.negative]="whatIfInflationPct() > baselineInflationPct()">
                  ({{ whatIfInflationPct() > baselineInflationPct() ? '+' : '' }}{{ ((whatIfInflationPct() - baselineInflationPct()) / 10).toFixed(1) }} pp)
                </span>
              }
            </label>
            <div class="slider-row">
              <input type="range"
                [min]="0" [max]="60" [step]="1"
                [ngModel]="whatIfInflationPct()"
                (ngModelChange)="whatIfInflationPct.set($event)"
              />
              <output class="slider-output">{{ (whatIfInflationPct() / 10).toFixed(1) }} %</output>
            </div>
            <div class="range-labels">
              <span>0,0 %</span><span>6,0 %</span>
            </div>
          </div>

          <div class="control-group">
            <label>
              Rentenbeginn
              @if (whatIfRentenbeginn() !== pensionInput().rentenbeginnJahr) {
                <span class="label-delta" [class.positive]="whatIfRentenbeginn() > pensionInput().rentenbeginnJahr" [class.negative]="whatIfRentenbeginn() < pensionInput().rentenbeginnJahr">
                  ({{ whatIfRentenbeginn() > pensionInput().rentenbeginnJahr ? '+' : '' }}{{ whatIfRentenbeginn() - pensionInput().rentenbeginnJahr }} J.)
                </span>
              }
            </label>
            <div class="slider-row">
              <input type="range"
                [min]="2025" [max]="2075" [step]="1"
                [ngModel]="whatIfRentenbeginn()"
                (ngModelChange)="whatIfRentenbeginn.set($event)"
              />
              <output class="slider-output">{{ whatIfRentenbeginn() }}</output>
            </div>
            <div class="range-labels">
              <span>2025</span><span>2075</span>
            </div>
          </div>

          <div class="control-group">
            <label>
              Wunscheinkommen
              @if (whatIfWunsch() !== pensionInput().gewuenschteMonatlicheRente) {
                <span class="label-delta" [class.positive]="whatIfWunsch() < pensionInput().gewuenschteMonatlicheRente" [class.negative]="whatIfWunsch() > pensionInput().gewuenschteMonatlicheRente">
                  ({{ whatIfWunsch() > pensionInput().gewuenschteMonatlicheRente ? '+' : '' }}{{ whatIfWunsch() - pensionInput().gewuenschteMonatlicheRente }} €)
                </span>
              }
            </label>
            <div class="slider-row">
              <input type="range"
                [min]="500" [max]="6000" [step]="50"
                [ngModel]="whatIfWunsch()"
                (ngModelChange)="whatIfWunsch.set($event)"
              />
              <output class="slider-output">{{ whatIfWunsch() | euro }}</output>
            </div>
            <div class="range-labels">
              <span>500 €</span><span>6.000 €</span>
            </div>
          </div>

          <button class="reset-btn" (click)="resetToBaseline()" [disabled]="!hasChanges()">
            ↻ Zurücksetzen
          </button>
        </div>

        <!-- Delta Dashboard -->
        <div class="whatif-results">
          <h4 class="results-title">
            @if (hasChanges()) {
              Vergleich zum aktuellen Stand
            } @else {
              Verändern Sie die Regler links
            }
          </h4>

          <div class="delta-grid">
            <div class="delta-card" [class.changed]="deltaNetto() !== 0">
              <span class="delta-label">Netto/Monat</span>
              <span class="delta-value">{{ whatIfResult().nettoMonatlich | euro }}</span>
              <span class="delta-change" [class.positive]="deltaNetto() > 0" [class.negative]="deltaNetto() < 0" [class.neutral]="deltaNetto() === 0">
                {{ formatDelta(deltaNetto()) }}
              </span>
            </div>

            <div class="delta-card" [class.changed]="deltaKaufkraft() !== 0">
              <span class="delta-label">Reale Kaufkraft</span>
              <span class="delta-value">{{ whatIfResult().realeKaufkraftMonatlich | euro }}</span>
              <span class="delta-change" [class.positive]="deltaKaufkraft() > 0" [class.negative]="deltaKaufkraft() < 0" [class.neutral]="deltaKaufkraft() === 0">
                {{ formatDelta(deltaKaufkraft()) }}
              </span>
            </div>

            <div class="delta-card" [class.changed]="deltaLuecke() !== 0">
              <span class="delta-label">Rentenlücke</span>
              <span class="delta-value" [class.text-danger]="whatIfResult().rentenluecke > 0" [class.text-success]="whatIfResult().rentenluecke <= 0">
                {{ whatIfResult().rentenluecke | euro }}
              </span>
              <span class="delta-change" [class.positive]="deltaLuecke() < 0" [class.negative]="deltaLuecke() > 0" [class.neutral]="deltaLuecke() === 0">
                {{ formatDelta(-deltaLuecke()) }}
              </span>
            </div>

            <div class="delta-card" [class.changed]="deltaDeckung() !== 0">
              <span class="delta-label">Deckungsquote</span>
              <span class="delta-value" [class.text-success]="whatIfResult().deckungsquote >= 80" [class.text-danger]="whatIfResult().deckungsquote < 50">
                {{ whatIfResult().deckungsquote | number:'1.1-1' }}%
              </span>
              <span class="delta-change" [class.positive]="deltaDeckung() > 0" [class.negative]="deltaDeckung() < 0" [class.neutral]="deltaDeckung() === 0">
                {{ deltaDeckung() >= 0 ? '+' : '' }}{{ deltaDeckung() | number:'1.1-1' }} pp
              </span>
            </div>

            <div class="delta-card" [class.changed]="deltaAbzuege() !== 0">
              <span class="delta-label">Abzüge/Monat</span>
              <span class="delta-value">{{ whatIfResult().gesamtAbzuegeMonatlich | euro }}</span>
              <span class="delta-change" [class.positive]="deltaAbzuege() < 0" [class.negative]="deltaAbzuege() > 0" [class.neutral]="deltaAbzuege() === 0">
                {{ formatDelta(-deltaAbzuege()) }}
              </span>
            </div>

            <div class="delta-card" [class.changed]="deltaJahre() !== 0">
              <span class="delta-label">Jahre bis Rente</span>
              <span class="delta-value">{{ whatIfResult().jahresBisRente }} J.</span>
              <span class="delta-change" [class.neutral]="deltaJahre() === 0" [class.positive]="deltaJahre() > 0" [class.negative]="deltaJahre() < 0">
                {{ deltaJahre() >= 0 ? '+' : '' }}{{ deltaJahre() }} J.
              </span>
            </div>
          </div>

          @if (hasChanges()) {
            <div class="summary-box" [class.improved]="deltaKaufkraft() > 5" [class.worsened]="deltaKaufkraft() < -5">
              @if (deltaKaufkraft() > 5) {
                <span class="summary-icon">📈</span>
                <span>Ihre reale Kaufkraft verbessert sich um <strong>{{ formatDelta(deltaKaufkraft()) }}</strong>/Monat.
                  @if (whatIfResult().rentenluecke <= 0 && baselineResult().rentenluecke > 0) {
                    Ihre Rentenlücke wäre geschlossen! 🎉
                  }
                </span>
              } @else if (deltaKaufkraft() < -5) {
                <span class="summary-icon">📉</span>
                <span>Ihre reale Kaufkraft sinkt um <strong>{{ formatDelta(-deltaKaufkraft()) }}</strong>/Monat.
                  @if (whatIfResult().rentenluecke > baselineResult().rentenluecke) {
                    Ihre Rentenlücke wächst auf {{ whatIfResult().rentenluecke | euro }}/Monat.
                  }
                </span>
              } @else {
                <span class="summary-icon">↔️</span>
                <span>Nahezu keine Veränderung zur aktuellen Prognose.</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .whatif-section {
      padding: 2rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .icon { font-size: 1.3rem; }

    .section-subtitle {
      font-size: 0.88rem;
      color: var(--color-text-light);
      margin-bottom: 1.5rem;
    }

    .whatif-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 2rem;
    }

    /* Controls */
    .whatif-controls {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .control-group label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .label-delta {
      font-size: 0.75rem;
      font-weight: 700;
    }

    .label-delta.positive { color: var(--color-success); }
    .label-delta.negative { color: var(--color-danger); }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .slider-row input[type="range"] {
      flex: 1;
      accent-color: var(--color-accent);
      height: 6px;
    }

    .slider-output {
      min-width: 80px;
      text-align: right;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-primary);
      font-variant-numeric: tabular-nums;
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--color-text-light);
      margin-top: 0.15rem;
    }

    .reset-btn {
      margin-top: 0.5rem;
      padding: 0.55rem 1.25rem;
      background: #f1f5f9;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-text-light);
      cursor: pointer;
      transition: all 0.2s;
      align-self: flex-start;
    }

    .reset-btn:hover:not(:disabled) {
      background: #e2e8f0;
      color: var(--color-text);
    }

    .reset-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    /* Results */
    .whatif-results {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .results-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
    }

    .delta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .delta-card {
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: #f8fafc;
      border: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
      transition: border-color 0.3s, background 0.3s;
    }

    .delta-card.changed {
      border-color: var(--color-accent);
      background: rgba(15, 52, 96, 0.02);
    }

    .delta-label {
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--color-text-light);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .delta-value {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--color-primary);
      font-variant-numeric: tabular-nums;
    }

    .delta-change {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.12rem 0.45rem;
      border-radius: 4px;
    }

    .delta-change.positive {
      color: var(--color-success);
      background: rgba(39, 174, 96, 0.08);
    }

    .delta-change.negative {
      color: var(--color-danger);
      background: rgba(231, 76, 60, 0.08);
    }

    .delta-change.neutral {
      color: var(--color-text-light);
      background: transparent;
    }

    .text-danger { color: var(--color-danger) !important; }
    .text-success { color: var(--color-success) !important; }

    .summary-box {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1.5;
    }

    .summary-box.improved {
      background: rgba(39, 174, 96, 0.06);
      border: 1px solid rgba(39, 174, 96, 0.2);
      color: #166534;
    }

    .summary-box.worsened {
      background: rgba(231, 76, 60, 0.06);
      border: 1px solid rgba(231, 76, 60, 0.2);
      color: #991b1b;
    }

    .summary-box:not(.improved):not(.worsened) {
      background: #f8fafc;
      border: 1px solid var(--color-border);
      color: var(--color-text-light);
    }

    .summary-icon { font-size: 1.2rem; flex-shrink: 0; }

    .summary-box strong { font-weight: 800; }

    @media (max-width: 768px) {
      .whatif-layout {
        grid-template-columns: 1fr;
      }

      .delta-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 480px) {
      .delta-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class WhatIfAnalysisComponent {
  private readonly calcService = inject(PensionCalculatorService);

  readonly pensionInput = input.required<PensionInput>();
  readonly baselineResult = input.required<PensionResult>();

  /**
   * What-if override signals.
   * Inflation stored as integer (0-60) representing tenths of percent to avoid float issues.
   */
  readonly whatIfBrutto = signal(1500);
  readonly whatIfInflationPct = signal(20); // 20 = 2.0%
  readonly whatIfRentenbeginn = signal(2058);
  readonly whatIfWunsch = signal(2500);

  /** Sync sliders to input when input changes */
  constructor() {
    effect(() => {
      const inp = this.pensionInput();
      this.whatIfBrutto.set(inp.bruttoMonatlicheRente);
      this.whatIfInflationPct.set(Math.round(inp.inflationsrate * 1000));
      this.whatIfRentenbeginn.set(inp.rentenbeginnJahr);
      this.whatIfWunsch.set(inp.gewuenschteMonatlicheRente);
    }, { allowSignalWrites: true });
  }

  /** Baseline inflation as integer for comparison */
  readonly baselineInflationPct = computed(() =>
    Math.round(this.pensionInput().inflationsrate * 1000)
  );

  readonly hasChanges = computed(() =>
    this.whatIfBrutto() !== this.pensionInput().bruttoMonatlicheRente ||
    this.whatIfInflationPct() !== this.baselineInflationPct() ||
    this.whatIfRentenbeginn() !== this.pensionInput().rentenbeginnJahr ||
    this.whatIfWunsch() !== this.pensionInput().gewuenschteMonatlicheRente
  );

  readonly whatIfResult = computed(() => {
    const inp = this.pensionInput();
    const modified: PensionInput = {
      ...inp,
      bruttoMonatlicheRente: this.whatIfBrutto(),
      inflationsrate: this.whatIfInflationPct() / 1000,
      rentenbeginnJahr: this.whatIfRentenbeginn(),
      gewuenschteMonatlicheRente: this.whatIfWunsch(),
    };
    return this.calcService.calculate(modified);
  });

  readonly deltaNetto = computed(() =>
    Math.round(this.whatIfResult().nettoMonatlich - this.baselineResult().nettoMonatlich)
  );
  readonly deltaKaufkraft = computed(() =>
    Math.round(this.whatIfResult().realeKaufkraftMonatlich - this.baselineResult().realeKaufkraftMonatlich)
  );
  readonly deltaLuecke = computed(() =>
    Math.round(this.whatIfResult().rentenluecke - this.baselineResult().rentenluecke)
  );
  readonly deltaDeckung = computed(() =>
    this.whatIfResult().deckungsquote - this.baselineResult().deckungsquote
  );
  readonly deltaAbzuege = computed(() =>
    Math.round(this.whatIfResult().gesamtAbzuegeMonatlich - this.baselineResult().gesamtAbzuegeMonatlich)
  );
  readonly deltaJahre = computed(() =>
    this.whatIfResult().jahresBisRente - this.baselineResult().jahresBisRente
  );

  resetToBaseline(): void {
    const inp = this.pensionInput();
    this.whatIfBrutto.set(inp.bruttoMonatlicheRente);
    this.whatIfInflationPct.set(Math.round(inp.inflationsrate * 1000));
    this.whatIfRentenbeginn.set(inp.rentenbeginnJahr);
    this.whatIfWunsch.set(inp.gewuenschteMonatlicheRente);
  }

  formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toLocaleString('de-DE')} €`;
  }
}

