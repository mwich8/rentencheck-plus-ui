import { Component, input } from '@angular/core';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionResult } from '@core/models/pension-result.model';
import { ShockNumberComponent } from './shock-number.component';
import { DeductionBreakdownComponent } from './deduction-breakdown.component';
import { RentenScoreComponent } from './renten-score.component';

/**
 * Result panel showing the full calculation result.
 * Composes ShockNumber + RentenScore + DeductionBreakdown.
 */
@Component({
  selector: 'app-result-panel',
  standalone: true,
  imports: [EuroPipe, ShockNumberComponent, DeductionBreakdownComponent, RentenScoreComponent],
  templateUrl: './result-panel.component.html',
  styleUrls: ['./result-panel.component.scss'],
})
export class ResultPanelComponent {
  readonly result = input.required<PensionResult>();
  readonly gewuenschteRente = input<number>(2500);
}

