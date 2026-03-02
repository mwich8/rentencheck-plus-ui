import { Component, input } from '@angular/core';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionResult } from '../../../core/models/pension-result.model';
import { ShockNumberComponent } from './shock-number.component';
import { DeductionBreakdownComponent } from './deduction-breakdown.component';

/**
 * Result panel showing the full calculation result.
 * Composes ShockNumber + DeductionBreakdown.
 */
@Component({
  selector: 'app-result-panel',
  standalone: true,
  imports: [EuroPipe, ShockNumberComponent, DeductionBreakdownComponent],
  template: `
    <div class="result-panel">
      <h2 class="panel-title">
        <span class="icon">🎯</span> Ihr Ergebnis
      </h2>

      <!-- Quick Stats Pipeline -->
      <div class="quick-stats">
        <div class="stat">
          <span class="stat-label">Brutto</span>
          <span class="stat-value brutto">{{ result().bruttoMonatlich | euro }}</span>
        </div>
        <div class="stat-arrow" aria-hidden="true">→</div>
        <div class="stat">
          <span class="stat-label">Netto</span>
          <span class="stat-value netto">{{ result().nettoMonatlich | euro }}</span>
        </div>
        <div class="stat-arrow" aria-hidden="true">→</div>
        <div class="stat">
          <span class="stat-label">Real</span>
          <span class="stat-value real">{{ result().realeKaufkraftMonatlich | euro }}</span>
        </div>
      </div>

      <!-- The Shock Number -->
      <app-shock-number [result]="result()" />

      <!-- Tax Info Badges -->
      <div class="tax-info">
        <div class="info-badge">
          <span class="info-icon" aria-hidden="true">📅</span>
          <span>Besteuerungsanteil: {{ (result().besteuerungsanteil * 100).toFixed(1) }}%</span>
        </div>
        <div class="info-badge">
          <span class="info-icon" aria-hidden="true">🛡️</span>
          <span>Freibetrag: {{ result().rentenfreibetrag | euro }}/Jahr</span>
        </div>
        <div class="info-badge">
          <span class="info-icon" aria-hidden="true">⏳</span>
          <span>{{ result().jahresBisRente }} Jahre bis Rente</span>
        </div>
      </div>

      <!-- Deduction Breakdown -->
      <app-deduction-breakdown
        [abzuege]="result().abzuege"
        [bruttoMonatlich]="result().bruttoMonatlich"
      />
    </div>
  `,
  styles: [`
    .result-panel {
      padding: 0;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1.5rem;
    }

    .quick-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: var(--radius-md);
      margin-bottom: 0.25rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }

    .stat-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-light);
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .stat-value.brutto {
      color: var(--color-success);
    }

    .stat-value.netto {
      color: var(--color-warning);
    }

    .stat-value.real {
      color: var(--color-danger);
    }

    .stat-arrow {
      font-size: 1.1rem;
      color: var(--color-border);
      font-weight: 400;
      margin: 0 0.15rem;
    }

    .tax-info {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      justify-content: center;
      margin: 1rem 0 0.25rem;
    }

    .info-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.35rem 0.7rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 20px;
      font-size: 0.76rem;
      font-weight: 500;
      color: #0369a1;
      white-space: nowrap;
    }

    .info-icon {
      font-size: 0.85rem;
    }

    @media (max-width: 640px) {
      .quick-stats {
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.85rem 1rem;
      }

      .stat-arrow {
        transform: rotate(90deg);
        margin: 0;
      }

      .tax-info {
        flex-direction: column;
        align-items: stretch;
      }

      .info-badge {
        justify-content: center;
      }
    }
  `],
})
export class ResultPanelComponent {
  readonly result = input.required<PensionResult>();
}

