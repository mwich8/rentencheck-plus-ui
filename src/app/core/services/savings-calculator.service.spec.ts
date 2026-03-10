import { TestBed } from '@angular/core/testing';
import { SavingsCalculatorService } from './savings-calculator.service';

describe('SavingsCalculatorService', () => {
  let service: SavingsCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SavingsCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // calculateFutureValue
  // ──────────────────────────────────────────────

  describe('calculateFutureValue', () => {
    it('should return zeros for 0 years', () => {
      const result = service.calculateFutureValue(200, 0.07, 0);
      expect(result.endkapital).toBe(0);
      expect(result.eigenanteil).toBe(0);
      expect(result.renditeErtrag).toBe(0);
      expect(result.monatlicheAuszahlung).toBe(0);
    });

    it('should return zeros for 0 monthly contribution', () => {
      const result = service.calculateFutureValue(0, 0.07, 30);
      expect(result.endkapital).toBe(0);
      expect(result.eigenanteil).toBe(0);
    });

    it('should calculate eigenanteil correctly', () => {
      const result = service.calculateFutureValue(200, 0.07, 30);
      expect(result.eigenanteil).toBeCloseTo(200 * 30 * 12, 0);
    });

    it('should calculate future value with 0% return (no compound interest)', () => {
      const result = service.calculateFutureValue(200, 0, 30);
      expect(result.endkapital).toBe(200 * 30 * 12);
      expect(result.renditeErtrag).toBe(0);
    });

    it('should calculate future value with 7% return over 30 years', () => {
      // FV = 200 * [((1 + 0.07/12)^360 - 1) / (0.07/12)]
      // ≈ 200 * 1219.97 ≈ 243,994
      const result = service.calculateFutureValue(200, 0.07, 30);
      expect(result.endkapital).toBeGreaterThan(200_000);
      expect(result.endkapital).toBeLessThan(260_000);
    });

    it('renditeErtrag should be endkapital minus eigenanteil', () => {
      const result = service.calculateFutureValue(200, 0.07, 30);
      expect(result.renditeErtrag).toBeCloseTo(result.endkapital - result.eigenanteil, 0);
    });

    it('should produce higher return with more years (compound interest)', () => {
      const r10 = service.calculateFutureValue(200, 0.07, 10);
      const r30 = service.calculateFutureValue(200, 0.07, 30);
      // 30 years should have much more than 3× the 10 year amount due to compounding
      expect(r30.endkapital).toBeGreaterThan(r10.endkapital * 3);
    });

    it('should calculate monthly payout for payout period', () => {
      const result = service.calculateFutureValue(200, 0.07, 30, 25);
      expect(result.monatlicheAuszahlung).toBeGreaterThan(0);
    });

    it('should round values to 2 decimal places', () => {
      const result = service.calculateFutureValue(333, 0.07, 15);
      expect(result.endkapital).toBe(Math.round(result.endkapital * 100) / 100);
      expect(result.eigenanteil).toBe(Math.round(result.eigenanteil * 100) / 100);
      expect(result.renditeErtrag).toBe(Math.round(result.renditeErtrag * 100) / 100);
      expect(result.monatlicheAuszahlung).toBe(Math.round(result.monatlicheAuszahlung * 100) / 100);
    });

    it('should handle negative return rate as 0 return', () => {
      const result = service.calculateFutureValue(200, -0.05, 10);
      // Negative rates → treated as 0 return
      expect(result.endkapital).toBe(200 * 10 * 12);
    });
  });

  // ──────────────────────────────────────────────
  // calculateMonthlyPayout
  // ──────────────────────────────────────────────

  describe('calculateMonthlyPayout', () => {
    it('should return 0 for 0 capital', () => {
      expect(service.calculateMonthlyPayout(0, 0.07, 25)).toBe(0);
    });

    it('should return 0 for 0 years', () => {
      expect(service.calculateMonthlyPayout(100_000, 0.07, 0)).toBe(0);
    });

    it('should calculate simple division with 0% return', () => {
      const payout = service.calculateMonthlyPayout(120_000, 0, 10);
      expect(payout).toBe(1000); // 120000 / (10 * 12)
    });

    it('should calculate annuity payout with 7% return', () => {
      const payout = service.calculateMonthlyPayout(100_000, 0.07, 25);
      // With compound interest during payout, monthly amount is higher than simple division
      expect(payout).toBeGreaterThan(100_000 / (25 * 12)); // Greater than €333/month
      expect(payout).toBeLessThan(1_000); // But still reasonable
    });

    it('higher capital should yield higher payout', () => {
      const p1 = service.calculateMonthlyPayout(100_000, 0.07, 25);
      const p2 = service.calculateMonthlyPayout(200_000, 0.07, 25);
      expect(p2).toBeCloseTo(p1 * 2, 0);
    });

    it('longer payout period should yield lower monthly amount', () => {
      const p20 = service.calculateMonthlyPayout(100_000, 0.07, 20);
      const p30 = service.calculateMonthlyPayout(100_000, 0.07, 30);
      expect(p30).toBeLessThan(p20);
    });
  });

  // ──────────────────────────────────────────────
  // calculateRequiredMonthlySavings
  // ──────────────────────────────────────────────

  describe('calculateRequiredMonthlySavings', () => {
    it('should return 0 for 0 gap', () => {
      expect(service.calculateRequiredMonthlySavings(0, 0.07, 30, 25)).toBe(0);
    });

    it('should return 0 for 0 years to retirement', () => {
      expect(service.calculateRequiredMonthlySavings(500, 0.07, 0, 25)).toBe(0);
    });

    it('should calculate required savings for a gap', () => {
      const monthly = service.calculateRequiredMonthlySavings(500, 0.07, 30, 25);
      expect(monthly).toBeGreaterThan(0);
      // Should be much less than the gap itself due to compound interest
      expect(monthly).toBeLessThan(500);
    });

    it('larger gap should require more savings', () => {
      const s1 = service.calculateRequiredMonthlySavings(500, 0.07, 30, 25);
      const s2 = service.calculateRequiredMonthlySavings(1000, 0.07, 30, 25);
      expect(s2).toBeCloseTo(s1 * 2, 0);
    });

    it('fewer years should require more monthly savings', () => {
      const s30 = service.calculateRequiredMonthlySavings(500, 0.07, 30, 25);
      const s10 = service.calculateRequiredMonthlySavings(500, 0.07, 10, 25);
      expect(s10).toBeGreaterThan(s30);
    });

    it('should handle 0% return rate', () => {
      const monthly = service.calculateRequiredMonthlySavings(500, 0, 30, 25);
      expect(monthly).toBeGreaterThan(0);
      // With 0% return, need to save the full capital: gap * 25 * 12 / (30 * 12)
      expect(monthly).toBeCloseTo(500 * 25 / 30, 0);
    });

    it('should be consistent: savings → future value → payout matches gap', () => {
      const gap = 500;
      const years = 30;
      const payoutYears = 25;
      const rate = 0.07;
      const required = service.calculateRequiredMonthlySavings(gap, rate, years, payoutYears);
      const futureValue = service.calculateFutureValue(required, rate, years, payoutYears);
      // The payout should approximately equal the gap
      expect(futureValue.monatlicheAuszahlung).toBeCloseTo(gap, -1);
    });
  });
});

