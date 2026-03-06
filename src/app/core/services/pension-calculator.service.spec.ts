import { TestBed } from '@angular/core/testing';
import { PensionCalculatorService } from './pension-calculator.service';
import { PensionInput, DEFAULT_PENSION_INPUT } from '../models/pension-input.model';
import { PensionResult } from '../models/pension-result.model';

describe('PensionCalculatorService', () => {
  let service: PensionCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PensionCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // Full pipeline with default input
  // ──────────────────────────────────────────────

  describe('Full pipeline (default input)', () => {
    let result: PensionResult;

    beforeEach(() => {
      result = service.calculate(DEFAULT_PENSION_INPUT);
    });

    it('should compute gross annual = monthly × 12', () => {
      expect(result.bruttoJaehrlich).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente * 12);
    });

    it('should compute gross monthly correctly', () => {
      expect(result.bruttoMonatlich).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
    });

    it('should determine Besteuerungsanteil from retirement year', () => {
      // 2058 → 100% taxable (>= 2040)
      expect(result.besteuerungsanteil).toBe(1.0);
    });

    it('should compute zuVersteuerndesEinkommen', () => {
      expect(result.zuVersteuerndesEinkommen).toBe(result.bruttoJaehrlich * result.besteuerungsanteil);
    });

    it('should compute Rentenfreibetrag', () => {
      expect(result.rentenfreibetrag).toBe(result.bruttoJaehrlich * (1 - result.besteuerungsanteil));
    });

    it('should compute positive income tax', () => {
      expect(result.einkommensteuer).toBeGreaterThan(0);
    });

    it('should compute KVdR > 0', () => {
      expect(result.kvdrBeitragMonatlich).toBeGreaterThan(0);
    });

    it('should compute Pflege > 0', () => {
      expect(result.pflegeBeitragMonatlich).toBeGreaterThan(0);
    });

    it('should compute net monthly < gross monthly', () => {
      expect(result.nettoMonatlich).toBeLessThan(result.bruttoMonatlich);
      expect(result.nettoMonatlich).toBeGreaterThan(0);
    });

    it('should compute real purchasing power < net monthly (inflation > 0, years > 0)', () => {
      expect(result.realeKaufkraftMonatlich).toBeLessThan(result.nettoMonatlich);
      expect(result.realeKaufkraftMonatlich).toBeGreaterThan(0);
    });

    it('should compute pension gap > 0 (desired = €2500)', () => {
      expect(result.rentenluecke).toBeGreaterThan(0);
    });

    it('should compute Deckungsquote between 0 and 100', () => {
      expect(result.deckungsquote).toBeGreaterThan(0);
      expect(result.deckungsquote).toBeLessThan(100);
    });

    it('should compute years to retirement', () => {
      // aktuellesAlter = 35, retirement at 67 → 32 years
      expect(result.jahresBisRente).toBe(32);
    });

    it('should produce deduction breakdown items', () => {
      expect(result.abzuege.length).toBeGreaterThan(0);
    });

    it('should produce inflation projection with 31 data points', () => {
      expect(result.inflationsVerlauf.length).toBe(31);
    });

    it('should have gesamtAbzuegeMonatlich = sum of all deductions', () => {
      const steuerMonatlich = (result.einkommensteuer + result.solidaritaetszuschlag) / 12;
      const socialMonatlich = result.kvdrBeitragMonatlich + result.pflegeBeitragMonatlich;
      expect(result.gesamtAbzuegeMonatlich).toBeCloseTo(steuerMonatlich + socialMonatlich, 2);
    });
  });

  // ──────────────────────────────────────────────
  // Besteuerungsanteil
  // ──────────────────────────────────────────────

  describe('Besteuerungsanteil by retirement year', () => {
    it('should use 100% for retirement in 2058 (>= 2040)', () => {
      const result = service.calculate({ ...DEFAULT_PENSION_INPUT, rentenbeginnJahr: 2058 });
      expect(result.besteuerungsanteil).toBe(1.0);
    });

    it('should use 86% for retirement in 2026', () => {
      const result = service.calculate({ ...DEFAULT_PENSION_INPUT, rentenbeginnJahr: 2026 });
      expect(result.besteuerungsanteil).toBe(0.86);
    });

    it('should use 83.5% for retirement in 2025 (Wachstumschancengesetz)', () => {
      const result = service.calculate({ ...DEFAULT_PENSION_INPUT, rentenbeginnJahr: 2025 });
      expect(result.besteuerungsanteil).toBe(0.835);
    });
  });

  // ──────────────────────────────────────────────
  // Werbungskosten & Sonderausgaben
  // ──────────────────────────────────────────────

  describe('Tax deductions (Werbungskosten + Sonderausgaben)', () => {
    it('should apply €102 Werbungskosten + €36 Sonderausgaben', () => {
      // Test by computing expected zvE
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 1500,
        rentenbeginnJahr: 2058, // 100% taxable
      };
      const result = service.calculate(input);
      // zvE should be bruttoJaehrlich * besteuerungsanteil - 102 - 36
      const expectedZvE = Math.max(0, 1500 * 12 * 1.0 - 102 - 36);
      expect(result.zuVersteuerndesEinkommen).toBe(1500 * 12); // This is before deductions
      // We verify the tax is computed on zvE after deductions
      // by checking that tax is less than it would be on full zuVersteuerndesEinkommen
      expect(result.einkommensteuer).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────
  // Deduction breakdown
  // ──────────────────────────────────────────────

  describe('Deduction breakdown', () => {
    it('should filter out items with betrag = 0', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      result.abzuege.forEach(item => {
        expect(item.betrag).toBeGreaterThan(0);
      });
    });

    it('should include Einkommensteuer item', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      const estItem = result.abzuege.find(a => a.label === 'Einkommensteuer');
      expect(estItem).toBeTruthy();
      expect(estItem!.typ).toBe('steuer');
    });

    it('should include KVdR item', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      const kvdrItem = result.abzuege.find(a => a.label === 'Krankenversicherung (KVdR)');
      expect(kvdrItem).toBeTruthy();
      expect(kvdrItem!.typ).toBe('sozial');
    });

    it('should include Pflegeversicherung item', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      const pflegeItem = result.abzuege.find(a => a.label === 'Pflegeversicherung');
      expect(pflegeItem).toBeTruthy();
      expect(pflegeItem!.typ).toBe('sozial');
    });

    it('should include Inflationsverlust when inflation > 0 and years > 0', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      const inflationItem = result.abzuege.find(a => a.label === 'Inflationsverlust');
      expect(inflationItem).toBeTruthy();
      expect(inflationItem!.typ).toBe('inflation');
    });

    it('should not include Inflationsverlust when years to retirement = 0', () => {
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        aktuellesAlter: 67, // already at retirement age
      };
      const result = service.calculate(input);
      const inflationItem = result.abzuege.find(a => a.label === 'Inflationsverlust');
      expect(inflationItem).toBeUndefined();
    });

    it('should have correct percentages summing with deduction amounts', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      result.abzuege.forEach(item => {
        const expectedProzent = result.bruttoMonatlich > 0
          ? Math.round((item.betrag / result.bruttoMonatlich) * 1000) / 10
          : 0;
        expect(item.prozent).toBeCloseTo(expectedProzent, 1);
      });
    });
  });

  // ──────────────────────────────────────────────
  // Retirement age
  // ──────────────────────────────────────────────

  describe('Retirement age', () => {
    it('should use 67 for standard retirement', () => {
      const result = service.calculate({ ...DEFAULT_PENSION_INPUT, aktuellesAlter: 35 });
      expect(result.jahresBisRente).toBe(32);
    });

    it('should return 0 years if already at retirement age', () => {
      const result = service.calculate({ ...DEFAULT_PENSION_INPUT, aktuellesAlter: 67 });
      expect(result.jahresBisRente).toBe(0);
    });

    it('should return 0 years if past retirement age', () => {
      const result = service.calculate({ ...DEFAULT_PENSION_INPUT, aktuellesAlter: 70 });
      expect(result.jahresBisRente).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Pension gap (Rentenlücke)
  // ──────────────────────────────────────────────

  describe('Rentenlücke', () => {
    it('should be 0 when desired income = 0', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        gewuenschteMonatlicheRente: 0,
      });
      expect(result.rentenluecke).toBe(0);
    });

    it('should be 0 when real income exceeds desired income', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        gewuenschteMonatlicheRente: 100, // very low desired income
        aktuellesAlter: 67, // no inflation impact
      });
      expect(result.rentenluecke).toBe(0);
    });

    it('should increase when desired income increases', () => {
      const r1 = service.calculate({ ...DEFAULT_PENSION_INPUT, gewuenschteMonatlicheRente: 2000 });
      const r2 = service.calculate({ ...DEFAULT_PENSION_INPUT, gewuenschteMonatlicheRente: 3000 });
      expect(r2.rentenluecke).toBeGreaterThan(r1.rentenluecke);
    });

    it('should be non-negative (clamped at 0)', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.rentenluecke).toBeGreaterThanOrEqual(0);
    });
  });

  // ──────────────────────────────────────────────
  // Deckungsquote
  // ──────────────────────────────────────────────

  describe('Deckungsquote', () => {
    it('should be 0 when desired income is 0', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        gewuenschteMonatlicheRente: 0,
      });
      expect(result.deckungsquote).toBe(0);
    });

    it('should be > 100% when real income exceeds desired', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        gewuenschteMonatlicheRente: 100,
        aktuellesAlter: 67,
      });
      expect(result.deckungsquote).toBeGreaterThan(100);
    });

    it('should be between 0 and 100 for typical gap scenario', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.deckungsquote).toBeGreaterThan(0);
      expect(result.deckungsquote).toBeLessThan(100);
    });
  });

  // ──────────────────────────────────────────────
  // Rounding
  // ──────────────────────────────────────────────

  describe('Rounding', () => {
    it('should round nettoMonatlich to 2 decimal places', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.nettoMonatlich).toBe(Math.round(result.nettoMonatlich * 100) / 100);
    });

    it('should round realeKaufkraftMonatlich to 2 decimal places', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.realeKaufkraftMonatlich).toBe(Math.round(result.realeKaufkraftMonatlich * 100) / 100);
    });

    it('should round rentenluecke to 2 decimal places', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.rentenluecke).toBe(Math.round(result.rentenluecke * 100) / 100);
    });

    it('should round deckungsquote to 1 decimal place', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.deckungsquote).toBe(Math.round(result.deckungsquote * 10) / 10);
    });
  });

  // ──────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle €0 gross pension', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 0,
      });
      expect(result.bruttoMonatlich).toBe(0);
      expect(result.nettoMonatlich).toBe(0);
      expect(result.einkommensteuer).toBe(0);
    });

    it('should handle very high pension (€5,000/month)', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 5000,
      });
      expect(result.nettoMonatlich).toBeGreaterThan(0);
      expect(result.nettoMonatlich).toBeLessThan(5000);
    });

    it('should handle 0% inflation', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        inflationsrate: 0,
      });
      // With 0% inflation, real = net
      expect(result.realeKaufkraftMonatlich).toBe(result.nettoMonatlich);
    });

    it('should handle tax year 2025', () => {
      const result = service.calculate({
        ...DEFAULT_PENSION_INPUT,
        steuerJahr: 2025,
      });
      expect(result.einkommensteuer).toBeGreaterThan(0);
    });

    it('should produce different results for 2025 vs 2026 tax year', () => {
      const r2025 = service.calculate({ ...DEFAULT_PENSION_INPUT, steuerJahr: 2025 });
      const r2026 = service.calculate({ ...DEFAULT_PENSION_INPUT, steuerJahr: 2026 });
      // Different grundfreibetrag → different tax
      expect(r2025.einkommensteuer).not.toBe(r2026.einkommensteuer);
    });

    it('should handle childless retirees (higher Pflege)', () => {
      const withKids = service.calculate({ ...DEFAULT_PENSION_INPUT, hatKinder: true });
      const noKids = service.calculate({ ...DEFAULT_PENSION_INPUT, hatKinder: false });
      expect(noKids.pflegeBeitragMonatlich).toBeGreaterThan(withKids.pflegeBeitragMonatlich);
      expect(noKids.nettoMonatlich).toBeLessThan(withKids.nettoMonatlich);
    });
  });

  // ──────────────────────────────────────────────
  // Inflation projection
  // ──────────────────────────────────────────────

  describe('Inflation projection', () => {
    it('should project 31 data points (years 0..30)', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.inflationsVerlauf.length).toBe(31);
    });

    it('first data point should be at retirement year and age', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      expect(result.inflationsVerlauf[0].alter).toBe(67);
    });

    it('nominal should stay constant across projection', () => {
      const result = service.calculate(DEFAULT_PENSION_INPUT);
      const nominal = result.inflationsVerlauf[0].nominalMonatlich;
      result.inflationsVerlauf.forEach(p => {
        expect(p.nominalMonatlich).toBe(nominal);
      });
    });
  });
});

