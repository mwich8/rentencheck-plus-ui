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
  templateUrl: './scenario-comparison.component.html',
  styleUrls: ['./scenario-comparison.component.scss'],
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

