import { Component, signal, computed, output, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionInput, DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';
import { LATEST_STEUER_JAHR } from '@core/constants/tax-brackets.const';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [FormsModule, EuroPipe],
  templateUrl: './input-panel.component.html',
  styleUrls: ['./input-panel.component.scss'],
})
export class InputPanelComponent {
  // Signals for all user inputs — instant reactivity
  readonly bruttoRente = signal(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
  readonly gewuenschteRente = signal(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente);
  readonly aktuellesAlter = signal(DEFAULT_PENSION_INPUT.aktuellesAlter);
  readonly rentenbeginnJahr = signal(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
  readonly inflationsrate = signal(DEFAULT_PENSION_INPUT.inflationsrate);
  readonly hatKinder = signal(DEFAULT_PENSION_INPUT.hatKinder);

  /** Emits the full PensionInput whenever any field changes */
  readonly inputChange = output<PensionInput>();

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

