import { Component, input, computed, inject } from '@angular/core';
import { PensionResult } from '@core/models/pension-result.model';
import { RentenScoreService, RentenScore } from '@core/services/renten-score.service';

/**
 * Visual gauge showing a 0–100 "Renten-Score" with letter grade,
 * circular progress ring, and benchmark comparison.
 */
@Component({
  selector: 'app-renten-score',
  standalone: true,
  templateUrl: './renten-score.component.html',
  styleUrls: ['./renten-score.component.scss'],
})
export class RentenScoreComponent {
  private readonly scoreService = inject(RentenScoreService);

  readonly result = input.required<PensionResult>();
  readonly gewuenschteRente = input.required<number>();

  readonly circumference: number = 2 * Math.PI * 50; // r=50

  readonly scoreData = computed<RentenScore>(() => {
    return this.scoreService.computeScore(this.result(), this.gewuenschteRente());
  });

  readonly dashOffset = computed(() => {
    const score = this.scoreData().score;
    return this.circumference - (score / 100) * this.circumference;
  });
}

