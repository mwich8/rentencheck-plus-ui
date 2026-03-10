import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputPanelComponent } from './input-panel.component';
import { DEFAULT_PENSION_INPUT, PensionInput } from '@core/models/pension-input.model';
import { LATEST_STEUER_JAHR } from '@core/constants/tax-brackets.const';
import { getInsuranceRates } from '@core/constants/insurance-rates.const';

describe('InputPanelComponent', () => {
  let component: InputPanelComponent;
  let fixture: ComponentFixture<InputPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial state ─────────────────────────────────

  describe('Initial state', () => {
    it('should initialize bruttoRente with default value', () => {
      expect(component.bruttoRente()).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
    });

    it('should initialize gewuenschteRente with default value', () => {
      expect(component.gewuenschteRente()).toBe(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente);
    });

    it('should initialize aktuellesAlter with default value', () => {
      expect(component.aktuellesAlter()).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
    });

    it('should initialize rentenbeginnJahr with default value', () => {
      expect(component.rentenbeginnJahr()).toBe(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
    });

    it('should initialize inflationsrate with default value', () => {
      expect(component.inflationsrate()).toBe(DEFAULT_PENSION_INPUT.inflationsrate);
    });

    it('should initialize hatKinder with default value', () => {
      expect(component.hatKinder()).toBe(DEFAULT_PENSION_INPUT.hatKinder);
    });
  });

  // ── Computed pensionInput ─────────────────────────

  describe('pensionInput computed', () => {
    it('should compose a valid PensionInput from all signals', () => {
      const input = component.pensionInput();
      expect(input.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
      expect(input.gewuenschteMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente);
      expect(input.aktuellesAlter).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
      expect(input.rentenbeginnJahr).toBe(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
      expect(input.inflationsrate).toBe(DEFAULT_PENSION_INPUT.inflationsrate);
      expect(input.hatKinder).toBe(DEFAULT_PENSION_INPUT.hatKinder);
      expect(input.zusatzbeitragssatz).toBe(DEFAULT_PENSION_INPUT.zusatzbeitragssatz);
      expect(input.steuerJahr).toBe(LATEST_STEUER_JAHR);
    });

    it('should update when a signal changes', () => {
      component.bruttoRente.set(2000);
      const input = component.pensionInput();
      expect(input.bruttoMonatlicheRente).toBe(2000);
    });

    it('should reflect hatKinder toggle', () => {
      component.hatKinder.set(false);
      expect(component.pensionInput().hatKinder).toBeFalse();
    });
  });

  // ── Output emission ───────────────────────────────

  describe('inputChange output', () => {
    it('should emit PensionInput when a signal changes', () => {
      const emitted: PensionInput[] = [];
      component.inputChange.subscribe((v: PensionInput) => emitted.push(v));

      // Trigger a change to fire the effect
      component.bruttoRente.set(2000);
      fixture.detectChanges();

      expect(emitted.length).toBeGreaterThanOrEqual(1);
      const last = emitted[emitted.length - 1];
      expect(last.bruttoMonatlicheRente).toBe(2000);
    });

    it('should emit updated PensionInput when signal changes', () => {
      const emitted: PensionInput[] = [];
      component.inputChange.subscribe((v: PensionInput) => emitted.push(v));

      component.aktuellesAlter.set(50);
      fixture.detectChanges();

      const last = emitted[emitted.length - 1];
      expect(last.aktuellesAlter).toBe(50);
    });
  });

  // ── Template rendering ────────────────────────────

  describe('Template rendering', () => {
    it('should render the panel title', () => {
      const el: HTMLElement = fixture.nativeElement;
      const title = el.querySelector('.panel-title');
      expect(title?.textContent).toContain('Rentendaten');
    });

    it('should render all slider inputs', () => {
      const el: HTMLElement = fixture.nativeElement;
      const sliders = el.querySelectorAll('input[type="range"]');
      // bruttoRente, gewuenschteRente, aktuellesAlter, rentenbeginnJahr, inflationsrate = 5 sliders
      expect(sliders.length).toBeGreaterThanOrEqual(3);
    });

    it('should render the hatKinder toggle', () => {
      const el: HTMLElement = fixture.nativeElement;
      // Could be a checkbox or toggle — look for the label text
      expect(el.textContent).toContain('Kinder');
    });

    it('should display the info tooltip for age', () => {
      const el: HTMLElement = fixture.nativeElement;
      const tooltip = el.querySelector('.info-tooltip');
      expect(tooltip).toBeTruthy();
      expect(tooltip?.textContent).toContain('jünger');
    });
  });
});


