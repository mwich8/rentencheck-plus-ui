import { TestBed } from '@angular/core/testing';
import { SocialInsuranceService } from './social-insurance.service';

describe('SocialInsuranceService', () => {
  let service: SocialInsuranceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocialInsuranceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // KVdR calculation (Krankenversicherung)
  // ──────────────────────────────────────────────

  describe('KVdR (Krankenversicherung der Rentner)', () => {
    it('should calculate KVdR with default Zusatzbeitrag 2026', () => {
      // 2026: kvdrAllgemeinAnteil = 0.073, Zusatzbeitrag = 0.019
      // effective rate = 0.073 + 0.019/2 = 0.0825
      const result = service.calculate(1500, true, undefined, 2026);
      const expectedKvdr = Math.round(1500 * 0.0825 * 100) / 100;
      expect(result.kvdrMonatlich).toBe(expectedKvdr);
    });

    it('should calculate KVdR with custom Zusatzbeitrag', () => {
      // Custom Zusatzbeitrag = 0.02 → effective = 0.073 + 0.02/2 = 0.083
      const result = service.calculate(1500, true, 0.02, 2026);
      const expectedKvdr = Math.round(1500 * 0.083 * 100) / 100;
      expect(result.kvdrMonatlich).toBe(expectedKvdr);
    });

    it('should use 2025 rates when specified', () => {
      // 2025: kvdrAllgemeinAnteil = 0.073, Zusatzbeitrag = 0.017
      // effective rate = 0.073 + 0.017/2 = 0.0815
      const result = service.calculate(1500, true, undefined, 2025);
      const expectedKvdr = Math.round(1500 * 0.0815 * 100) / 100;
      expect(result.kvdrMonatlich).toBe(expectedKvdr);
    });

    it('should scale linearly with gross pension', () => {
      const r1 = service.calculate(1000, true, undefined, 2026);
      const r2 = service.calculate(2000, true, undefined, 2026);
      expect(r2.kvdrMonatlich).toBeCloseTo(r1.kvdrMonatlich * 2, 1);
    });
  });

  // ──────────────────────────────────────────────
  // Pflegeversicherung
  // ──────────────────────────────────────────────

  describe('Pflegeversicherung', () => {
    it('should use lower rate for people with children (2026: 3.6%)', () => {
      const result = service.calculate(1500, true, undefined, 2026);
      const expectedPflege = Math.round(1500 * 0.036 * 100) / 100;
      expect(result.pflegeMonatlich).toBe(expectedPflege);
    });

    it('should use higher rate for childless people (2026: 4.2%)', () => {
      const result = service.calculate(1500, false, undefined, 2026);
      const expectedPflege = Math.round(1500 * 0.042 * 100) / 100;
      expect(result.pflegeMonatlich).toBe(expectedPflege);
    });

    it('should use 2025 rates with children (3.4%)', () => {
      const result = service.calculate(1500, true, undefined, 2025);
      const expectedPflege = Math.round(1500 * 0.034 * 100) / 100;
      expect(result.pflegeMonatlich).toBe(expectedPflege);
    });

    it('should use 2025 rates without children (4.0%)', () => {
      const result = service.calculate(1500, false, undefined, 2025);
      const expectedPflege = Math.round(1500 * 0.040 * 100) / 100;
      expect(result.pflegeMonatlich).toBe(expectedPflege);
    });

    it('childless should always be higher than with children', () => {
      const withKids = service.calculate(1500, true, undefined, 2026);
      const noKids = service.calculate(1500, false, undefined, 2026);
      expect(noKids.pflegeMonatlich).toBeGreaterThan(withKids.pflegeMonatlich);
    });
  });

  // ──────────────────────────────────────────────
  // Totals
  // ──────────────────────────────────────────────

  describe('Totals', () => {
    it('should compute gesamtMonatlich as KVdR + Pflege', () => {
      const result = service.calculate(1500, true, undefined, 2026);
      expect(result.gesamtMonatlich).toBe(result.kvdrMonatlich + result.pflegeMonatlich);
    });

    it('should compute gesamtJaehrlich as 12 × gesamtMonatlich', () => {
      const result = service.calculate(1500, true, undefined, 2026);
      expect(result.gesamtJaehrlich).toBe(result.gesamtMonatlich * 12);
    });
  });

  // ──────────────────────────────────────────────
  // Effective rates
  // ──────────────────────────────────────────────

  describe('Effective rates', () => {
    it('should report correct KVdR effective rate', () => {
      const result = service.calculate(1500, true, 0.02, 2026);
      expect(result.kvdrEffektiverSatz).toBeCloseTo(0.073 + 0.02 / 2, 5);
    });

    it('should report correct Pflege effective rate with children', () => {
      const result = service.calculate(1500, true, undefined, 2026);
      expect(result.pflegeEffektiverSatz).toBe(0.036);
    });

    it('should report correct Pflege effective rate without children', () => {
      const result = service.calculate(1500, false, undefined, 2026);
      expect(result.pflegeEffektiverSatz).toBe(0.042);
    });
  });

  // ──────────────────────────────────────────────
  // Edge cases
  // ──────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle €0 gross pension', () => {
      const result = service.calculate(0, true, undefined, 2026);
      expect(result.kvdrMonatlich).toBe(0);
      expect(result.pflegeMonatlich).toBe(0);
      expect(result.gesamtMonatlich).toBe(0);
    });

    it('should handle very large pension (€5,000)', () => {
      const result = service.calculate(5000, true, undefined, 2026);
      expect(result.kvdrMonatlich).toBeGreaterThan(0);
      expect(result.pflegeMonatlich).toBeGreaterThan(0);
    });

    it('should default hatKinder to true', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = service.calculate(1500, undefined as any, undefined, 2026);
      // The default in service signature is true
      expect(result.pflegeEffektiverSatz).toBe(0.036);
    });

    it('should round to cents', () => {
      const result = service.calculate(1500, true, undefined, 2026);
      expect(result.kvdrMonatlich).toBe(Math.round(result.kvdrMonatlich * 100) / 100);
      expect(result.pflegeMonatlich).toBe(Math.round(result.pflegeMonatlich * 100) / 100);
    });
  });
});

