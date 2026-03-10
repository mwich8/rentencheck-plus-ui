import { Component, signal, computed, output, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionInput, DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';
import { LATEST_STEUER_JAHR } from '@core/constants/tax-brackets.const';
import { getInsuranceRates } from '@core/constants/insurance-rates.const';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [FormsModule, EuroPipe],
  templateUrl: './input-panel.component.html',
  styleUrls: ['./input-panel.component.scss'],
})
export class InputPanelComponent {
  // Signals for all user inputs — instant reactivity
  readonly bruttoRente = signal<number>(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
  readonly gewuenschteRente = signal<number>(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente);
  readonly aktuellesAlter = signal<number>(DEFAULT_PENSION_INPUT.aktuellesAlter);
  readonly rentenbeginnJahr = signal<number>(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
  readonly inflationsrate = signal<number>(DEFAULT_PENSION_INPUT.inflationsrate);
  readonly hatKinder = signal<boolean>(DEFAULT_PENSION_INPUT.hatKinder);

  /** Emits the full PensionInput whenever any field changes */
  readonly inputChange = output<PensionInput>();

  /** Dynamic Pflegeversicherung rates from constants (avoids hardcoding in template) */
  private readonly insuranceRates = getInsuranceRates(LATEST_STEUER_JAHR);
  readonly pflegeMitKindernProzent: string = (this.insuranceRates.pflegeMitKindern * 100).toFixed(1);
  readonly pflegeOhneKinderProzent: string = (this.insuranceRates.pflegeOhneKinder * 100).toFixed(1);

  /** Computed PensionInput from all signals */
  readonly pensionInput = computed<PensionInput>(() => ({
    bruttoMonatlicheRente: this.bruttoRente(),
    rentenbeginnJahr: this.rentenbeginnJahr(),
    aktuellesAlter: this.aktuellesAlter(),
    gewuenschteMonatlicheRente: this.gewuenschteRente(),
    inflationsrate: this.inflationsrate(),
    hatKinder: this.hatKinder(),
    zusatzbeitragssatz: DEFAULT_PENSION_INPUT.zusatzbeitragssatz,
    steuerJahr: LATEST_STEUER_JAHR,
  }));

  constructor() {
    effect(() => {
      this.inputChange.emit(this.pensionInput());
    });
  }
}

