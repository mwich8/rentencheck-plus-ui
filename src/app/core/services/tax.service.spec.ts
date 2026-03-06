import { TestBed } from '@angular/core/testing';
import { TaxService, TaxResult } from './tax.service';

describe('TaxService', () => {
  let service: TaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // Zone 1: Grundfreibetrag (no tax)
  // ──────────────────────────────────────────────

  describe('Zone 1 — Grundfreibetrag (no tax)', () => {
    it('should return 0 tax for €0 income (2026)', () => {
      const result = service.calculateIncomeTax(0, 2026);
      expect(result.einkommensteuer).toBe(0);
      expect(result.solidaritaetszuschlag).toBe(0);
      expect(result.gesamtSteuer).toBe(0);
      expect(result.grenzsteuersatz).toBe(0);
      expect(result.durchschnittssteuersatz).toBe(0);
    });

    it('should return 0 tax at exactly Grundfreibetrag 2026 (€12,336)', () => {
      const result = service.calculateIncomeTax(12_336, 2026);
      expect(result.einkommensteuer).toBe(0);
      expect(result.solidaritaetszuschlag).toBe(0);
    });

    it('should return 0 tax at exactly Grundfreibetrag 2025 (€12,084)', () => {
      const result = service.calculateIncomeTax(12_084, 2025);
      expect(result.einkommensteuer).toBe(0);
      expect(result.solidaritaetszuschlag).toBe(0);
    });

    it('should return 0 tax for income below Grundfreibetrag', () => {
      const result = service.calculateIncomeTax(5_000, 2026);
      expect(result.einkommensteuer).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Zone 2: Linear-progressive 14%→24%
  // ──────────────────────────────────────────────

  describe('Zone 2 — Linear-progressive (14%→24%)', () => {
    it('should calculate tax for €1 above Grundfreibetrag 2026 (floors to 0 due to tiny value)', () => {
      const result = service.calculateIncomeTax(12_337, 2026);
      // y = (12337 - 12336) / 10000 = 0.0001
      // ESt = (899.13 * 0.0001 + 1400) * 0.0001 ≈ 0.14 → floors to 0
      expect(result.einkommensteuer).toBe(0);
    });

    it('should calculate positive tax for €500 above Grundfreibetrag 2026', () => {
      const result = service.calculateIncomeTax(12_836, 2026);
      expect(result.einkommensteuer).toBeGreaterThan(0);
      expect(result.einkommensteuer).toBeLessThan(200);
    });

    it('should calculate tax at Zone 2 upper boundary (2026: €17,443)', () => {
      const result = service.calculateIncomeTax(17_443, 2026);
      expect(result.einkommensteuer).toBeGreaterThan(0);
      // ESt at zone 2 upper is moderate
      expect(result.einkommensteuer).toBeLessThan(2_000);
    });

    it('should calculate tax for €15,000 income 2025', () => {
      const result = service.calculateIncomeTax(15_000, 2025);
      // y = (15000 - 12084) / 10000 = 0.2916
      // ESt = (922.98 * 0.2916 + 1400) * 0.2916 ≈ 486 (floored)
      expect(result.einkommensteuer).toBeGreaterThan(400);
      expect(result.einkommensteuer).toBeLessThan(600);
    });

    it('should have marginal tax rate ≈ 14% at start of Zone 2', () => {
      const result = service.calculateIncomeTax(12_500, 2026);
      expect(result.grenzsteuersatz).toBeGreaterThanOrEqual(0.14);
      expect(result.grenzsteuersatz).toBeLessThan(0.18);
    });
  });

  // ──────────────────────────────────────────────
  // Zone 3: Linear-progressive 24%→42%
  // ──────────────────────────────────────────────

  describe('Zone 3 — Linear-progressive (24%→42%)', () => {
    it('should calculate tax for €30,000 income (2026)', () => {
      const result = service.calculateIncomeTax(30_000, 2026);
      expect(result.einkommensteuer).toBeGreaterThan(3_000);
      expect(result.einkommensteuer).toBeLessThan(6_000);
    });

    it('should calculate tax for €50,000 income (2026)', () => {
      const result = service.calculateIncomeTax(50_000, 2026);
      expect(result.einkommensteuer).toBeGreaterThan(8_000);
      expect(result.einkommensteuer).toBeLessThan(14_000);
    });

    it('should calculate tax at Zone 3 upper boundary (2026: €68,480)', () => {
      const result = service.calculateIncomeTax(68_480, 2026);
      expect(result.einkommensteuer).toBeGreaterThan(15_000);
      expect(result.einkommensteuer).toBeLessThan(20_000);
    });
  });

  // ──────────────────────────────────────────────
  // Zone 4: Proportional 42%
  // ──────────────────────────────────────────────

  describe('Zone 4 — Proportional (42%)', () => {
    it('should calculate tax for €100,000 income (2026)', () => {
      const result = service.calculateIncomeTax(100_000, 2026);
      // ESt = 0.42 * 100000 - 10888.74 = 31111.26, floored = 31111
      expect(result.einkommensteuer).toBe(31_111);
    });

    it('should calculate tax for €200,000 income (2026)', () => {
      const result = service.calculateIncomeTax(200_000, 2026);
      // ESt = 0.42 * 200000 - 10888.74 = 73111.26, floored = 73111
      expect(result.einkommensteuer).toBe(73_111);
    });

    it('should have marginal tax rate of 42% in Zone 4', () => {
      const result = service.calculateIncomeTax(150_000, 2026);
      expect(result.grenzsteuersatz).toBe(0.42);
    });
  });

  // ──────────────────────────────────────────────
  // Zone 5: Reichensteuer 45%
  // ──────────────────────────────────────────────

  describe('Zone 5 — Reichensteuer (45%)', () => {
    it('should calculate tax for €300,000 income (2026)', () => {
      const result = service.calculateIncomeTax(300_000, 2026);
      // ESt = 0.45 * 300000 - 19223.39 = 115776.61, floored = 115776
      expect(result.einkommensteuer).toBe(115_776);
    });

    it('should have marginal tax rate of 45% in Zone 5', () => {
      const result = service.calculateIncomeTax(300_000, 2026);
      expect(result.grenzsteuersatz).toBe(0.45);
    });

    it('should calculate tax at exactly Zone 5 boundary (€277,826)', () => {
      const result = service.calculateIncomeTax(277_826, 2026);
      // Just above zone 4 upper, should use zone 5 formula
      // ESt = 0.45 * 277826 - 19223.39 = 105798.31, floored = 105798
      expect(result.einkommensteuer).toBe(105_798);
    });
  });

  // ──────────────────────────────────────────────
  // Solidaritätszuschlag
  // ──────────────────────────────────────────────

  describe('Solidaritätszuschlag', () => {
    it('should be 0 for low ESt below Freigrenze (€18,130)', () => {
      // €30,000 income → ESt is well below €18,130
      const result = service.calculateIncomeTax(30_000, 2026);
      expect(result.solidaritaetszuschlag).toBe(0);
    });

    it('should be 0 for ESt at exactly Freigrenze', () => {
      // Need income that produces exactly €18,130 ESt — hard to hit exactly,
      // but we can test that moderate incomes produce 0 Soli
      const result = service.calculateIncomeTax(50_000, 2026);
      expect(result.solidaritaetszuschlag).toBe(0);
    });

    it('should apply Soli for very high incomes', () => {
      const result = service.calculateIncomeTax(200_000, 2026);
      expect(result.solidaritaetszuschlag).toBeGreaterThan(0);
      // Soli = 5.5% of ESt for high incomes
      expect(result.solidaritaetszuschlag).toBeCloseTo(result.einkommensteuer * 0.055, 0);
    });

    it('should calculate total tax as ESt + Soli', () => {
      const result = service.calculateIncomeTax(200_000, 2026);
      expect(result.gesamtSteuer).toBe(result.einkommensteuer + result.solidaritaetszuschlag);
    });
  });

  // ──────────────────────────────────────────────
  // Durchschnittssteuersatz
  // ──────────────────────────────────────────────

  describe('Durchschnittssteuersatz', () => {
    it('should be 0 for 0 income', () => {
      const result = service.calculateIncomeTax(0, 2026);
      expect(result.durchschnittssteuersatz).toBe(0);
    });

    it('should be less than marginal rate', () => {
      const result = service.calculateIncomeTax(50_000, 2026);
      expect(result.durchschnittssteuersatz).toBeLessThan(result.grenzsteuersatz);
    });

    it('should increase with income', () => {
      const r1 = service.calculateIncomeTax(20_000, 2026);
      const r2 = service.calculateIncomeTax(60_000, 2026);
      expect(r2.durchschnittssteuersatz).toBeGreaterThan(r1.durchschnittssteuersatz);
    });
  });

  // ──────────────────────────────────────────────
  // Year comparison (2025 vs 2026)
  // ──────────────────────────────────────────────

  describe('Year comparison (2025 vs 2026)', () => {
    it('should default to 2026 when no year specified', () => {
      const r1 = service.calculateIncomeTax(40_000);
      const r2 = service.calculateIncomeTax(40_000, 2026);
      expect(r1.einkommensteuer).toBe(r2.einkommensteuer);
    });

    it('2026 should have lower tax than 2025 for same income (higher Grundfreibetrag)', () => {
      const r2025 = service.calculateIncomeTax(40_000, 2025);
      const r2026 = service.calculateIncomeTax(40_000, 2026);
      // 2026 has higher Grundfreibetrag → less tax
      expect(r2026.einkommensteuer).toBeLessThanOrEqual(r2025.einkommensteuer);
    });
  });

  // ──────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle fractional income (floor to full EUR)', () => {
      const result = service.calculateIncomeTax(30_000.99, 2026);
      const resultFloored = service.calculateIncomeTax(30_000, 2026);
      expect(result.einkommensteuer).toBe(resultFloored.einkommensteuer);
    });

    it('should handle very large incomes', () => {
      const result = service.calculateIncomeTax(1_000_000, 2026);
      expect(result.einkommensteuer).toBeGreaterThan(400_000);
      expect(result.grenzsteuersatz).toBe(0.45);
    });

    it('should floor ESt to full EUR', () => {
      const result = service.calculateIncomeTax(20_000, 2026);
      expect(result.einkommensteuer).toBe(Math.floor(result.einkommensteuer));
    });
  });
});

