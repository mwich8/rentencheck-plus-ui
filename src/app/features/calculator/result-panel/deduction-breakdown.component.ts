import { Component, input, computed } from '@angular/core';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { DeductionItem } from '@core/models/pension-result.model';

/**
 * Displays a detailed breakdown of all pension deductions
 * in a visual stacked bar format.
 */
@Component({
  selector: 'app-deduction-breakdown',
  standalone: true,
  imports: [EuroPipe],
  templateUrl: './deduction-breakdown.component.html',
  styleUrls: ['./deduction-breakdown.component.scss'],
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

