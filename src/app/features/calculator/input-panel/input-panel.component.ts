import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionInput, DEFAULT_PENSION_INPUT } from '../../../core/models/pension-input.model';

@Component({
  selector: 'app-input-panel',
  standalone: true,
  imports: [FormsModule, EuroPipe],
  template: `
    <div class="input-panel">
      <h2 class="panel-title">
        <span class="icon">📊</span> Ihre Rentendaten
      </h2>
      <p class="panel-hint">Bewegen Sie die Regler — alle Ergebnisse aktualisieren sich sofort.</p>

      <!-- Brutto Rente -->
      <div class="input-group">
        <label class="input-label" for="slider-brutto">
          Prognostizierte Bruttorente
          <span class="input-hint">monatlich, laut Rentenbescheid</span>
        </label>
        <div class="slider-row">
          <input
            id="slider-brutto"
            type="range"
            [min]="200"
            [max]="4000"
            [step]="25"
            [ngModel]="bruttoRente()"
            (ngModelChange)="bruttoRente.set($event)"
            aria-label="Monatliche Bruttorente in Euro"
          />
          <output class="slider-output accent">{{ bruttoRente() | euro }}</output>
        </div>
        <div class="range-labels">
          <span>200 €</span>
          <span>4.000 €</span>
        </div>
      </div>

      <!-- Gewünschte Rente -->
      <div class="input-group">
        <label class="input-label" for="slider-wunsch">
          Gewünschtes Einkommen im Alter
          <span class="input-hint">Ihr Wunsch-Nettoeinkommen</span>
        </label>
        <div class="slider-row">
          <input
            id="slider-wunsch"
            type="range"
            [min]="1000"
            [max]="6000"
            [step]="50"
            [ngModel]="gewuenschteRente()"
            (ngModelChange)="gewuenschteRente.set($event)"
            aria-label="Gewünschtes monatliches Einkommen im Alter"
          />
          <output class="slider-output success">{{ gewuenschteRente() | euro }}</output>
        </div>
        <div class="range-labels">
          <span>1.000 €</span>
          <span>6.000 €</span>
        </div>
      </div>

      <!-- Aktuelles Alter -->
      <div class="input-group">
        <label class="input-label" for="slider-alter">
          Ihr aktuelles Alter
        </label>
        <div class="slider-row">
          <input
            id="slider-alter"
            type="range"
            [min]="18"
            [max]="66"
            [step]="1"
            [ngModel]="aktuellesAlter()"
            (ngModelChange)="aktuellesAlter.set($event)"
            aria-label="Aktuelles Alter"
          />
          <output class="slider-output neutral">{{ aktuellesAlter() }} Jahre</output>
        </div>
        <div class="range-labels">
          <span>18</span>
          <span>66</span>
        </div>
      </div>

      <!-- Rentenbeginn -->
      <div class="input-group">
        <label class="input-label" for="slider-beginn">
          Voraussichtlicher Rentenbeginn
          <span class="input-hint">Regelaltersgrenze: 67 Jahre</span>
        </label>
        <div class="slider-row">
          <input
            id="slider-beginn"
            type="range"
            [min]="2025"
            [max]="2075"
            [step]="1"
            [ngModel]="rentenbeginnJahr()"
            (ngModelChange)="rentenbeginnJahr.set($event)"
            aria-label="Jahr des Rentenbeginns"
          />
          <output class="slider-output neutral">{{ rentenbeginnJahr() }}</output>
        </div>
        <div class="range-labels">
          <span>2025</span>
          <span>2075</span>
        </div>
      </div>

      <!-- Inflationsrate -->
      <div class="input-group">
        <label class="input-label" for="slider-inflation">
          Angenommene Inflationsrate
          <span class="input-hint">EZB-Ziel: 2,0 % p.a.</span>
        </label>
        <div class="slider-row">
          <input
            id="slider-inflation"
            type="range"
            [min]="0"
            [max]="0.06"
            [step]="0.001"
            [ngModel]="inflationsrate()"
            (ngModelChange)="inflationsrate.set($event)"
            aria-label="Jährliche Inflationsrate"
          />
          <output class="slider-output" [class.danger]="inflationsrate() > 0.03" [class.neutral]="inflationsrate() <= 0.03">
            {{ (inflationsrate() * 100).toFixed(1) }} %
          </output>
        </div>
        <div class="range-labels">
          <span>0 %</span>
          <span>6 %</span>
        </div>
      </div>

      <!-- Kinder Toggle -->
      <div class="input-group toggle-group">
        <label class="input-label">Haben Sie Kinder?</label>
        <div class="toggle-buttons" role="radiogroup" aria-label="Kinder vorhanden">
          <button
            role="radio"
            [attr.aria-checked]="hatKinder()"
            [class.active]="hatKinder()"
            (click)="hatKinder.set(true)"
            type="button"
          >
            Ja
          </button>
          <button
            role="radio"
            [attr.aria-checked]="!hatKinder()"
            [class.active]="!hatKinder()"
            (click)="hatKinder.set(false)"
            type="button"
          >
            Nein
          </button>
        </div>
        <p class="toggle-hint">
          {{ hatKinder() ? 'Pflegeversicherung: 3,4 %' : 'Pflegeversicherung: 4,0 % (Zuschlag für Kinderlose)' }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .input-panel {
      padding: 0;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon {
      font-size: 1.5rem;
    }

    .panel-hint {
      font-size: 0.82rem;
      color: var(--color-text-light);
      margin-bottom: 2rem;
      line-height: 1.5;
    }

    .input-group {
      margin-bottom: 1.6rem;
    }

    .input-label {
      display: block;
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.6rem;
      line-height: 1.4;
    }

    .input-hint {
      display: block;
      font-size: 0.76rem;
      font-weight: 400;
      color: var(--color-text-light);
      margin-top: 0.15rem;
    }

    .slider-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .slider-row input[type="range"] {
      flex: 1;
      min-width: 0;
    }

    .slider-output {
      flex-shrink: 0;
      min-width: 5.5rem;
      text-align: right;
      font-size: 1rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      background: #f1f5f9;
      line-height: 1.3;
      white-space: nowrap;
    }

    .slider-output.accent {
      color: var(--color-accent);
      background: #eef2ff;
    }

    .slider-output.success {
      color: var(--color-success);
      background: #ecfdf5;
    }

    .slider-output.neutral {
      color: var(--color-text);
      background: #f8fafc;
    }

    .slider-output.danger {
      color: var(--color-danger);
      background: #fef2f2;
    }

    .range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--color-text-light);
      margin-top: 0.3rem;
      padding: 0 2px;
      opacity: 0.7;
    }

    .toggle-group {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--color-border);
    }

    .toggle-buttons {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }

    .toggle-buttons button {
      flex: 1;
      padding: 0.65rem 1rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-card);
      color: var(--color-text-light);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toggle-buttons button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .toggle-buttons button.active {
      border-color: var(--color-accent);
      background: var(--color-accent);
      color: white;
    }

    .toggle-buttons button:hover:not(.active) {
      border-color: var(--color-accent);
      color: var(--color-accent);
    }

    .toggle-hint {
      font-size: 0.78rem;
      color: var(--color-text-light);
      margin-top: 0.5rem;
      font-style: italic;
    }
  `],
})
export class InputPanelComponent {
  // Signals for all user inputs — instant reactivity
  readonly bruttoRente = signal(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
  readonly gewuenschteRente = signal(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente);
  readonly aktuellesAlter = signal(DEFAULT_PENSION_INPUT.aktuellesAlter);
  readonly rentenbeginnJahr = signal(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
  readonly inflationsrate = signal(DEFAULT_PENSION_INPUT.inflationsrate);
  readonly hatKinder = signal(DEFAULT_PENSION_INPUT.hatKinder);

  /** Computed PensionInput from all signals */
  readonly pensionInput = computed<PensionInput>(() => ({
    bruttoMonatlicheRente: this.bruttoRente(),
    rentenbeginnJahr: this.rentenbeginnJahr(),
    aktuellesAlter: this.aktuellesAlter(),
    gewuenschteMonatlicheRente: this.gewuenschteRente(),
    inflationsrate: this.inflationsrate(),
    hatKinder: this.hatKinder(),
    zusatzbeitragssatz: DEFAULT_PENSION_INPUT.zusatzbeitragssatz,
    steuerJahr: 2026,
  }));
}

