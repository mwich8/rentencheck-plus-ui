import { Component, input, computed } from '@angular/core';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { DeductionItem } from '../../../core/models/pension-result.model';

/**
 * Displays a detailed breakdown of all pension deductions
 * in a visual stacked bar format.
 */
@Component({
  selector: 'app-deduction-breakdown',
  standalone: true,
  imports: [EuroPipe],
  template: `
    <div class="breakdown">
      <h3 class="breakdown-title">
        <span class="icon">💸</span> Abzüge im Detail
      </h3>

      <div class="deduction-list">
        @for (item of abzuege(); track item.label; let i = $index) {
          <div class="deduction-item" [style.animation-delay.ms]="i * 80">
            <div class="deduction-info">
              <span class="deduction-label">{{ item.label }}</span>
              <span class="deduction-type-badge" [attr.data-type]="item.typ">
                {{ item.typ === 'steuer' ? 'Steuer' : item.typ === 'sozial' ? 'Sozialabgabe' : 'Inflation' }}
              </span>
            </div>
            <div class="deduction-bar-bg">
              <div
                class="deduction-bar"
                [style.width.%]="getBarWidth(item.prozent)"
                [style.background-color]="item.farbe"
              ></div>
            </div>
            <div class="deduction-values">
              <span class="deduction-amount">−{{ item.betrag | euro }}</span>
              <span class="deduction-percent">{{ item.prozent }}%</span>
            </div>
          </div>
        }
      </div>

      <div class="total-deductions">
        <span class="total-label">Gesamte Abzüge</span>
        <span class="total-amount">−{{ totalAbzuege() | euro }} / Monat</span>
      </div>
    </div>
  `,
  styles: [`
    .breakdown {
      margin-top: 1.5rem;
    }

    .breakdown-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1.3rem;
    }

    .deduction-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .deduction-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      animation: fadeInUp 0.4s ease-out both;
    }

    .deduction-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .deduction-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .deduction-bar-bg {
      width: 100%;
      height: 8px;
      background: var(--color-border);
      border-radius: 4px;
      overflow: hidden;
    }

    .deduction-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
      min-width: 4px;
    }

    .deduction-type-badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .deduction-type-badge[data-type="steuer"] {
      background: #fee2e2;
      color: #b91c1c;
    }

    .deduction-type-badge[data-type="sozial"] {
      background: #fef3c7;
      color: #92400e;
    }

    .deduction-type-badge[data-type="inflation"] {
      background: #ede9fe;
      color: #6b21a8;
    }

    .deduction-values {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .deduction-amount {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-danger);
      font-variant-numeric: tabular-nums;
    }

    .deduction-percent {
      font-size: 0.85rem;
      color: var(--color-text-light);
      font-weight: 500;
    }

    .total-deductions {
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 2px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .total-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .total-amount {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-danger);
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class DeductionBreakdownComponent {
  readonly abzuege = input.required<DeductionItem[]>();
  readonly bruttoMonatlich = input.required<number>();

  readonly totalAbzuege = computed(() =>
    this.abzuege().reduce((sum, item) => sum + item.betrag, 0)
  );

  /**
   * Scale bar width so the largest deduction fills ~85% of the bar,
   * and smaller items scale proportionally. Prevents overflow.
   */
  getBarWidth(prozent: number): number {
    const maxProzent = Math.max(...this.abzuege().map(a => a.prozent), 1);
    return Math.max(3, (prozent / maxProzent) * 85);
  }
}

