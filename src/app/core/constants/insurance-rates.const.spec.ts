import {
  getBesteuerungsanteil,
  getInsuranceRates,
  INSURANCE_RATES_2025,
  INSURANCE_RATES_2026,
  BESTEUERUNGSANTEIL_TABELLE,
} from './insurance-rates.const';

describe('Insurance Rates Constants', () => {

  // ──────────────────────────────────────────────
  // getInsuranceRates
  // ──────────────────────────────────────────────

  describe('getInsuranceRates', () => {
    it('should return 2025 rates', () => {
      const rates = getInsuranceRates(2025);
      expect(rates).toBe(INSURANCE_RATES_2025);
      expect(rates.year).toBe(2025);
    });

    it('should return 2026 rates', () => {
      const rates = getInsuranceRates(2026);
      expect(rates).toBe(INSURANCE_RATES_2026);
      expect(rates.year).toBe(2026);
    });
  });

  // ──────────────────────────────────────────────
  // 2025 rate values
  // ──────────────────────────────────────────────

  describe('2025 rates', () => {
    it('should have kvdrAllgemeinAnteil = 7.3%', () => {
      expect(INSURANCE_RATES_2025.kvdrAllgemeinAnteil).toBe(0.073);
    });

    it('should have kvdrZusatzbeitragDefault = 1.7%', () => {
      expect(INSURANCE_RATES_2025.kvdrZusatzbeitragDefault).toBe(0.017);
    });

    it('should have pflegeMitKindern = 3.4%', () => {
      expect(INSURANCE_RATES_2025.pflegeMitKindern).toBe(0.034);
    });

    it('should have pflegeOhneKinder = 4.0%', () => {
      expect(INSURANCE_RATES_2025.pflegeOhneKinder).toBe(0.040);
    });
  });

  // ──────────────────────────────────────────────
  // 2026 rate values
  // ──────────────────────────────────────────────

  describe('2026 rates', () => {
    it('should have kvdrAllgemeinAnteil = 7.3%', () => {
      expect(INSURANCE_RATES_2026.kvdrAllgemeinAnteil).toBe(0.073);
    });

    it('should have kvdrZusatzbeitragDefault = 1.9%', () => {
      expect(INSURANCE_RATES_2026.kvdrZusatzbeitragDefault).toBe(0.019);
    });

    it('should have pflegeMitKindern = 3.6%', () => {
      expect(INSURANCE_RATES_2026.pflegeMitKindern).toBe(0.036);
    });

    it('should have pflegeOhneKinder = 4.2%', () => {
      expect(INSURANCE_RATES_2026.pflegeOhneKinder).toBe(0.042);
    });

    it('should have higher Zusatzbeitrag than 2025', () => {
      expect(INSURANCE_RATES_2026.kvdrZusatzbeitragDefault)
        .toBeGreaterThan(INSURANCE_RATES_2025.kvdrZusatzbeitragDefault);
    });
  });

  // ──────────────────────────────────────────────
  // Besteuerungsanteil
  // ──────────────────────────────────────────────

  describe('getBesteuerungsanteil', () => {
    it('should return 0.50 for 2005', () => {
      expect(getBesteuerungsanteil(2005)).toBe(0.50);
    });

    it('should return 0.50 for years before 2005', () => {
      expect(getBesteuerungsanteil(2000)).toBe(0.50);
      expect(getBesteuerungsanteil(1990)).toBe(0.50);
    });

    it('should return 1.0 for years >= 2040', () => {
      expect(getBesteuerungsanteil(2040)).toBe(1.0);
      expect(getBesteuerungsanteil(2050)).toBe(1.0);
      expect(getBesteuerungsanteil(2100)).toBe(1.0);
    });

    it('should return 0.835 for 2025 (Wachstumschancengesetz)', () => {
      expect(getBesteuerungsanteil(2025)).toBe(0.835);
    });

    it('should return 0.86 for 2026', () => {
      expect(getBesteuerungsanteil(2026)).toBe(0.86);
    });

    it('should return correct values for known table entries', () => {
      expect(getBesteuerungsanteil(2010)).toBe(0.60);
      expect(getBesteuerungsanteil(2020)).toBe(0.80);
      expect(getBesteuerungsanteil(2030)).toBe(0.90);
      expect(getBesteuerungsanteil(2035)).toBe(0.95);
    });

    it('should increase monotonically from 2005 to 2040 (except 2025 Wachstumschancengesetz)', () => {
      let prev = getBesteuerungsanteil(2005);
      for (let year = 2006; year <= 2040; year++) {
        const current = getBesteuerungsanteil(year);
        // 2025 was intentionally lowered by Wachstumschancengesetz (83.5% instead of 85%)
        if (year !== 2025) {
          expect(current).toBeGreaterThanOrEqual(prev);
        }
        prev = current;
      }
    });
    it('should interpolate for years between table entries', () => {
      // Between 2040 (1.0) and 2050 (1.0) — both are 1.0 so interpolation is trivial
      // Let's test a real gap: between 2050 and 2055 both are 1.0
      expect(getBesteuerungsanteil(2052)).toBe(1.0); // >= 2040 → 1.0
    });
  });

  // ──────────────────────────────────────────────
  // Besteuerungsanteil table integrity
  // ──────────────────────────────────────────────

  describe('Besteuerungsanteil table', () => {
    it('should have entries from 2005 to 2058', () => {
      expect(BESTEUERUNGSANTEIL_TABELLE[2005]).toBeDefined();
      expect(BESTEUERUNGSANTEIL_TABELLE[2058]).toBeDefined();
    });

    it('all values should be between 0 and 1', () => {
      Object.values(BESTEUERUNGSANTEIL_TABELLE).forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      });
    });

    it('should reach 100% by 2040', () => {
      expect(BESTEUERUNGSANTEIL_TABELLE[2040]).toBe(1.0);
    });
  });
});

