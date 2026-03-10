import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { ResultPanelComponent } from './result-panel.component';
import { PensionResult } from '@core/models/pension-result.model';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { DEFAULT_PENSION_INPUT } from '@core/models/pension-input.model';

/** Test host to provide required inputs to ResultPanelComponent */
@Component({
  standalone: true,
  imports: [ResultPanelComponent],
  template: `<app-result-panel [result]="result" [gewuenschteRente]="2500" />`,
})
class TestHostComponent {
  result!: PensionResult;
}

describe('ResultPanelComponent', () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let result: PensionResult;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    const calcService = TestBed.inject(PensionCalculatorService);
    result = calcService.calculate(DEFAULT_PENSION_INPUT);

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    host.result = result;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });

  // ── Template rendering ────────────────────────────

  describe('Template rendering', () => {
    it('should render the result panel title', () => {
      const el: HTMLElement = fixture.nativeElement;
      const title = el.querySelector('.panel-title');
      expect(title?.textContent).toContain('Ergebnis');
    });

    it('should render the quick stats pipeline (Brutto → Netto → Real)', () => {
      const el: HTMLElement = fixture.nativeElement;
      const stats = el.querySelectorAll('.stat-value');
      expect(stats.length).toBeGreaterThanOrEqual(3);
    });

    it('should render the shock-number sub-component', () => {
      const el: HTMLElement = fixture.nativeElement;
      const shockNumber = el.querySelector('app-shock-number');
      expect(shockNumber).toBeTruthy();
    });

    it('should render the renten-score sub-component', () => {
      const el: HTMLElement = fixture.nativeElement;
      const score = el.querySelector('app-renten-score');
      expect(score).toBeTruthy();
    });

    it('should render the deduction-breakdown sub-component', () => {
      const el: HTMLElement = fixture.nativeElement;
      const breakdown = el.querySelector('app-deduction-breakdown');
      expect(breakdown).toBeTruthy();
    });

    it('should display Besteuerungsanteil badge', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain('Besteuerungsanteil');
    });

    it('should display years to retirement', () => {
      const el: HTMLElement = fixture.nativeElement;
      expect(el.textContent).toContain(`${result.jahresBisRente} Jahre bis Rente`);
    });
  });

  // ── Data correctness ──────────────────────────────

  describe('Data display', () => {
    it('should show correct Besteuerungsanteil percentage', () => {
      const el: HTMLElement = fixture.nativeElement;
      const expectedPercent = (result.besteuerungsanteil * 100).toFixed(1);
      expect(el.textContent).toContain(`${expectedPercent}%`);
    });

    it('should show "Kein Freibetrag" when besteuerungsanteil is 100%', () => {
      // Default input has rentenbeginnJahr 2058 → 100% taxable
      if (result.besteuerungsanteil >= 1) {
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent).toContain('Kein Freibetrag');
      }
    });
  });

  // ── Update handling ───────────────────────────────

  describe('Result updates', () => {
    it('should update when result input changes', () => {
      const calcService = TestBed.inject(PensionCalculatorService);
      const newResult = calcService.calculate({
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 3000,
      });
      host.result = newResult;
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      // Verify years to retirement still displayed correctly
      expect(el.textContent).toContain(`${newResult.jahresBisRente} Jahre bis Rente`);
    });
  });
});

