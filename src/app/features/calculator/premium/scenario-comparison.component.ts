import { Component, input, computed, inject } from '@angular/core';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionInput } from '../../../core/models/pension-input.model';
import { PensionResult } from '../../../core/models/pension-result.model';
import { PensionCalculatorService } from '../../../core/services/pension-calculator.service';
import { Scenario } from '../../../core/models/scenario.model';

/**
 * Multi-Szenario-Vergleich — compares the user's current pension situation
 * against automatically generated alternative scenarios side-by-side.
 */
@Component({
  selector: 'app-scenario-comparison',
  standalone: true,
  imports: [EuroPipe],
  template: `
    <div class="scenario-section">
      <h3 class="section-title">
        <span class="icon">🔮</span> Multi-Szenario-Vergleich
      </h3>
      <p class="section-subtitle">
        Wie verändert sich Ihre Rente bei anderen Voraussetzungen?
      </p>

      <div class="scenario-grid">
        @for (s of scenarios(); track s.label) {
          <div class="scenario-card" [class.baseline]="s.isBaseline" [style.border-top-color]="s.color">
            @if (s.isBaseline) {
              <span class="baseline-badge">Aktuell</span>
            }
            @if (bestScenarioLabel() === s.label && !s.isBaseline) {
              <span class="best-badge">✅ Beste Option</span>
            }
            <div class="scenario-icon">{{ s.icon }}</div>
            <h4 class="scenario-label">{{ s.label }}</h4>

            <div class="scenario-metrics">
              <div class="metric">
                <span class="metric-label">Netto/Monat</span>
                <span class="metric-value">{{ s.result.nettoMonatlich | euro }}</span>
                @if (!s.isBaseline) {
                  <span class="metric-delta" [class.positive]="s.result.nettoMonatlich > baselineResult().nettoMonatlich" [class.negative]="s.result.nettoMonatlich < baselineResult().nettoMonatlich">
                    {{ formatDelta(s.result.nettoMonatlich - baselineResult().nettoMonatlich) }}
                  </span>
                }
              </div>
              <div class="metric">
                <span class="metric-label">Kaufkraft</span>
                <span class="metric-value">{{ s.result.realeKaufkraftMonatlich | euro }}</span>
                @if (!s.isBaseline) {
                  <span class="metric-delta" [class.positive]="s.result.realeKaufkraftMonatlich > baselineResult().realeKaufkraftMonatlich" [class.negative]="s.result.realeKaufkraftMonatlich < baselineResult().realeKaufkraftMonatlich">
                    {{ formatDelta(s.result.realeKaufkraftMonatlich - baselineResult().realeKaufkraftMonatlich) }}
                  </span>
                }
              </div>
              <div class="metric">
                <span class="metric-label">Rentenlücke</span>
                <span class="metric-value" [class.text-danger]="s.result.rentenluecke > 0" [class.text-success]="s.result.rentenluecke === 0">
                  {{ s.result.rentenluecke | euro }}
                </span>
                @if (!s.isBaseline) {
                  <span class="metric-delta" [class.positive]="s.result.rentenluecke < baselineResult().rentenluecke" [class.negative]="s.result.rentenluecke > baselineResult().rentenluecke">
                    {{ formatDelta(baselineResult().rentenluecke - s.result.rentenluecke) }}
                  </span>
                }
              </div>
              <div class="metric">
                <span class="metric-label">Deckungsquote</span>
                <span class="metric-value">{{ s.result.deckungsquote.toFixed(1) }}%</span>
              </div>
            </div>

            <div class="scenario-detail">
              <small>Brutto {{ s.input.bruttoMonatlicheRente | euro }} · Rente ab {{ s.input.rentenbeginnJahr }}</small>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .scenario-section {
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

    .scenario-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .scenario-card {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      border-top: 4px solid #dee2e6;
      text-align: center;
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .scenario-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }

    .scenario-card.baseline {
      background: linear-gradient(135deg, #f8fafc, #f0f9ff);
      border-color: #bae6fd;
    }

    .baseline-badge, .best-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }

    .baseline-badge {
      background: rgba(15, 52, 96, 0.08);
      color: var(--color-primary);
    }

    .best-badge {
      background: rgba(39, 174, 96, 0.1);
      color: var(--color-success);
    }

    .scenario-icon {
      font-size: 1.75rem;
      margin-bottom: 0.5rem;
    }

    .scenario-label {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 1rem;
    }

    .scenario-metrics {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
    }

    .metric-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-text-light);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-value {
      font-size: 1rem;
      font-weight: 800;
      color: var(--color-primary);
    }

    .metric-delta {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    .metric-delta.positive {
      color: var(--color-success);
      background: rgba(39, 174, 96, 0.08);
    }

    .metric-delta.negative {
      color: var(--color-danger);
      background: rgba(231, 76, 60, 0.08);
    }

    .text-danger { color: var(--color-danger) !important; }
    .text-success { color: var(--color-success) !important; }

    .scenario-detail {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
    }

    .scenario-detail small {
      font-size: 0.72rem;
      color: var(--color-text-light);
    }

    @media (max-width: 1024px) {
      .scenario-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 640px) {
      .scenario-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ScenarioComparisonComponent {
  private readonly calcService = inject(PensionCalculatorService);

  readonly pensionInput = input.required<PensionInput>();
  readonly baselineResult = input.required<PensionResult>();

  readonly scenarios = computed<Scenario[]>(() => {
    const inp = this.pensionInput();
    const base = this.baselineResult();

    const scenarios: Scenario[] = [
      {
        label: 'Ihre Situation',
        icon: '📌',
        color: '#0f3460',
        input: inp,
        result: base,
        isBaseline: true,
      },
      {
        label: '3 Jahre früher',
        icon: '🏖️',
        color: '#e94560',
        input: { ...inp, rentenbeginnJahr: inp.rentenbeginnJahr - 3, bruttoMonatlicheRente: Math.round(inp.bruttoMonatlicheRente * 0.9) },
        result: this.calcService.calculate({ ...inp, rentenbeginnJahr: inp.rentenbeginnJahr - 3, bruttoMonatlicheRente: Math.round(inp.bruttoMonatlicheRente * 0.9) }),
      },
      {
        label: '3 Jahre später',
        icon: '💪',
        color: '#27ae60',
        input: { ...inp, rentenbeginnJahr: inp.rentenbeginnJahr + 3, bruttoMonatlicheRente: Math.round(inp.bruttoMonatlicheRente * 1.15) },
        result: this.calcService.calculate({ ...inp, rentenbeginnJahr: inp.rentenbeginnJahr + 3, bruttoMonatlicheRente: Math.round(inp.bruttoMonatlicheRente * 1.15) }),
      },
      {
        label: 'Höhere Rente',
        icon: '📈',
        color: '#f39c12',
        input: { ...inp, bruttoMonatlicheRente: inp.bruttoMonatlicheRente + 500 },
        result: this.calcService.calculate({ ...inp, bruttoMonatlicheRente: inp.bruttoMonatlicheRente + 500 }),
      },
    ];

    return scenarios;
  });

  readonly bestScenarioLabel = computed(() => {
    const nonBaseline = this.scenarios().filter(s => !s.isBaseline);
    if (nonBaseline.length === 0) return '';
    const best = nonBaseline.reduce((a, b) =>
      a.result.realeKaufkraftMonatlich > b.result.realeKaufkraftMonatlich ? a : b
    );
    return best.label;
  });

  formatDelta(delta: number): string {
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${Math.round(delta).toLocaleString('de-DE')} €`;
  }
}

