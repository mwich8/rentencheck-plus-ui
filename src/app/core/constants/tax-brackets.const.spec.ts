import {
  getTaxConfig,
  TAX_CONFIG_2025,
  TAX_CONFIG_2026,
  TaxBracketConfig,
} from './tax-brackets.const';

describe('Tax Brackets Constants', () => {

  // ──────────────────────────────────────────────
  // getTaxConfig
  // ──────────────────────────────────────────────

  describe('getTaxConfig', () => {
    it('should return 2025 config', () => {
      expect(getTaxConfig(2025)).toBe(TAX_CONFIG_2025);
    });

    it('should return 2026 config', () => {
      expect(getTaxConfig(2026)).toBe(TAX_CONFIG_2026);
    });
  });

  // ──────────────────────────────────────────────
  // 2025 config values
  // ──────────────────────────────────────────────

  describe('TAX_CONFIG_2025', () => {
    const c = TAX_CONFIG_2025;

    it('should have year = 2025', () => {
      expect(c.year).toBe(2025);
    });

    it('should have Grundfreibetrag = €12,084', () => {
      expect(c.grundfreibetrag).toBe(12_084);
    });

    it('should have zone2Upper = €17,005', () => {
      expect(c.zone2Upper).toBe(17_005);
    });

    it('should have zone3Upper = €66,760', () => {
      expect(c.zone3Upper).toBe(66_760);
    });

    it('should have zone4Upper = €277,825', () => {
      expect(c.zone4Upper).toBe(277_825);
    });

    it('should have zone4Rate = 42%', () => {
      expect(c.zone4Rate).toBe(0.42);
    });

    it('should have zone5Rate = 45%', () => {
      expect(c.zone5Rate).toBe(0.45);
    });

    it('should have soliFreigrenze = €18,130', () => {
      expect(c.soliFreigrenze).toBe(18_130);
    });

    it('should have soliRate = 5.5%', () => {
      expect(c.soliRate).toBe(0.055);
    });
  });

  // ──────────────────────────────────────────────
  // 2026 config values
  // ──────────────────────────────────────────────

  describe('TAX_CONFIG_2026', () => {
    const c = TAX_CONFIG_2026;

    it('should have year = 2026', () => {
      expect(c.year).toBe(2026);
    });

    it('should have Grundfreibetrag = €12,336', () => {
      expect(c.grundfreibetrag).toBe(12_336);
    });

    it('should have higher Grundfreibetrag than 2025', () => {
      expect(c.grundfreibetrag).toBeGreaterThan(TAX_CONFIG_2025.grundfreibetrag);
    });

    it('should have zone2Upper = €17,443', () => {
      expect(c.zone2Upper).toBe(17_443);
    });

    it('should have zone3Upper = €68,480', () => {
      expect(c.zone3Upper).toBe(68_480);
    });

    it('should have same zone4Upper as 2025', () => {
      expect(c.zone4Upper).toBe(TAX_CONFIG_2025.zone4Upper);
    });

    it('should have same zone4Rate and zone5Rate as 2025', () => {
      expect(c.zone4Rate).toBe(TAX_CONFIG_2025.zone4Rate);
      expect(c.zone5Rate).toBe(TAX_CONFIG_2025.zone5Rate);
    });

    it('should have same soliFreigrenze as 2025', () => {
      expect(c.soliFreigrenze).toBe(TAX_CONFIG_2025.soliFreigrenze);
    });
  });

  // ──────────────────────────────────────────────
  // Structural integrity
  // ──────────────────────────────────────────────

  describe('Structural integrity', () => {
    function validateConfig(c: TaxBracketConfig) {
      it(`${c.year}: zones should be in ascending order`, () => {
        expect(c.grundfreibetrag).toBeLessThan(c.zone2Upper);
        expect(c.zone2Upper).toBeLessThan(c.zone3Upper);
        expect(c.zone3Upper).toBeLessThan(c.zone4Upper);
      });

      it(`${c.year}: zone2FactorB should be 1400 (14% entry rate × 10000)`, () => {
        expect(c.zone2FactorB).toBe(1_400);
      });

      it(`${c.year}: zone3FactorB should be 2397`, () => {
        expect(c.zone3FactorB).toBe(2_397);
      });

      it(`${c.year}: all rates should be positive`, () => {
        expect(c.zone4Rate).toBeGreaterThan(0);
        expect(c.zone5Rate).toBeGreaterThan(0);
        expect(c.soliRate).toBeGreaterThan(0);
      });

      it(`${c.year}: zone5Rate should be higher than zone4Rate`, () => {
        expect(c.zone5Rate).toBeGreaterThan(c.zone4Rate);
      });
    }

    validateConfig(TAX_CONFIG_2025);
    validateConfig(TAX_CONFIG_2026);
  });
});

