import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalculatorPageComponent } from './calculator-page.component';
import { DEFAULT_PENSION_INPUT, PensionInput } from '@core/models/pension-input.model';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';

describe('CalculatorPageComponent', () => {
  let component: CalculatorPageComponent;
  let fixture: ComponentFixture<CalculatorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalculatorPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CalculatorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial state ─────────────────────────────────

  describe('Initial state', () => {
    it('should initialize with default pension input', () => {
      const input = component.currentInput();
      expect(input).toEqual(DEFAULT_PENSION_INPUT);
    });

    it('should compute a valid pension result from defaults', () => {
      const result = component.pensionResult();
      expect(result).toBeTruthy();
      expect(result.bruttoMonatlich).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
      expect(result.nettoMonatlich).toBeGreaterThan(0);
      expect(result.nettoMonatlich).toBeLessThan(result.bruttoMonatlich);
    });

    it('should derive gewuenschteRente from currentInput', () => {
      expect(component.gewuenschteRente()).toBe(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente);
    });

    it('should derive hatKinder from currentInput', () => {
      expect(component.hatKinder()).toBe(DEFAULT_PENSION_INPUT.hatKinder);
    });

    it('should have steuerJahr set', () => {
      expect(component.steuerJahr).toBeDefined();
      expect(typeof component.steuerJahr).toBe('number');
    });

    it('should have currentYear set to the actual year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear());
    });
  });

  // ── Signal reactivity ─────────────────────────────

  describe('Signal reactivity', () => {
    it('should update pensionResult when currentInput changes', () => {
      const originalResult = component.pensionResult();
      const newInput: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 3000,
      };

      component.onInputChange(newInput);
      const updatedResult = component.pensionResult();

      expect(updatedResult.bruttoMonatlich).toBe(3000);
      expect(updatedResult.nettoMonatlich).not.toBe(originalResult.nettoMonatlich);
    });

    it('should update gewuenschteRente when input changes', () => {
      component.onInputChange({
        ...DEFAULT_PENSION_INPUT,
        gewuenschteMonatlicheRente: 4000,
      });
      expect(component.gewuenschteRente()).toBe(4000);
    });

    it('should update hatKinder when input changes', () => {
      component.onInputChange({
        ...DEFAULT_PENSION_INPUT,
        hatKinder: false,
      });
      expect(component.hatKinder()).toBeFalse();
    });
  });

  // ── Error resilience ──────────────────────────────

  describe('Error resilience', () => {
    it('should handle calculation errors gracefully (fallback to default)', () => {
      // The try/catch in pensionResult should prevent crashes
      // Even with edge-case inputs, the validator sanitizes them
      const edgeCaseInput: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 0,
        gewuenschteMonatlicheRente: 0,
      };

      component.onInputChange(edgeCaseInput);
      const result = component.pensionResult();

      // Should not throw, should return a valid result
      expect(result).toBeTruthy();
      expect(result.bruttoMonatlich).toBe(0);
    });
  });

  // ── monthlyCostOfWaiting ──────────────────────────

  describe('monthlyCostOfWaiting', () => {
    it('should return 0 when rentenluecke is 0', () => {
      component.onInputChange({
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 4000,
        gewuenschteMonatlicheRente: 100,
        aktuellesAlter: 67,
      });
      expect(component.monthlyCostOfWaiting()).toBe(0);
    });

    it('should return 0 when jahresBisRente <= 1', () => {
      component.onInputChange({
        ...DEFAULT_PENSION_INPUT,
        aktuellesAlter: 66,
      });
      expect(component.monthlyCostOfWaiting()).toBe(0);
    });

    it('should return a positive value for typical gap scenario', () => {
      // Default input has rentenluecke > 0 and jahresBisRente > 1
      const cost = component.monthlyCostOfWaiting();
      expect(cost).toBeGreaterThan(0);
    });
  });

  // ── Collapse signals ──────────────────────────────

  describe('Collapse state signals', () => {
    it('should start with all premium sections collapsed', () => {
      expect(component.scenarioCollapsed()).toBeTrue();
      expect(component.timelineCollapsed()).toBeTrue();
      expect(component.optimizationCollapsed()).toBeTrue();
    });

    it('should toggle scenario collapse', () => {
      component.scenarioCollapsed.set(false);
      expect(component.scenarioCollapsed()).toBeFalse();
      component.scenarioCollapsed.set(true);
      expect(component.scenarioCollapsed()).toBeTrue();
    });
  });

  // ── Template rendering ────────────────────────────

  describe('Template rendering', () => {
    it('should render the navbar', () => {
      const el: HTMLElement = fixture.nativeElement;
      const nav = el.querySelector('.calc-navbar');
      expect(nav).toBeTruthy();
    });

    it('should render the brand name', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('RentenCheck');
    });

    it('should render the hero section', () => {
      const el: HTMLElement = fixture.nativeElement;
      const hero = el.querySelector('.hero');
      expect(hero).toBeTruthy();
    });

    it('should render the calculator grid', () => {
      const el: HTMLElement = fixture.nativeElement;
      const grid = el.querySelector('.calculator-grid');
      expect(grid).toBeTruthy();
    });

    it('should render the input panel', () => {
      const el: HTMLElement = fixture.nativeElement;
      const inputPanel = el.querySelector('app-input-panel');
      expect(inputPanel).toBeTruthy();
    });

    it('should render the result panel', () => {
      const el: HTMLElement = fixture.nativeElement;
      const resultPanel = el.querySelector('app-result-panel');
      expect(resultPanel).toBeTruthy();
    });

    it('should render the footer', () => {
      const el: HTMLElement = fixture.nativeElement;
      const footer = el.querySelector('.footer');
      expect(footer).toBeTruthy();
    });

    it('should render the dynamic steuerJahr in footer', () => {
      const el: HTMLElement = fixture.nativeElement;
      const footer = el.querySelector('.footer-disclaimer');
      expect(footer?.textContent).toContain(`${component.steuerJahr}`);
    });

    it('should render the current year in copyright', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain(`${component.currentYear}`);
    });
  });

  // ── Integration: Input → Result flow ──────────────

  describe('Input → Result integration', () => {
    it('should show updated results when onInputChange is called', () => {
      component.onInputChange({
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 2000,
      });
      fixture.detectChanges();

      const result = component.pensionResult();
      expect(result.bruttoMonatlich).toBe(2000);
      expect(result.bruttoJaehrlich).toBe(24000);
    });

    it('should produce consistent results with PensionCalculatorService', () => {
      const calcService = TestBed.inject(PensionCalculatorService);
      const directResult = calcService.calculate(DEFAULT_PENSION_INPUT);
      const componentResult = component.pensionResult();

      expect(componentResult.nettoMonatlich).toBe(directResult.nettoMonatlich);
      expect(componentResult.rentenluecke).toBe(directResult.rentenluecke);
      expect(componentResult.deckungsquote).toBe(directResult.deckungsquote);
    });
  });
});

