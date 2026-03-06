import { PensionInputValidator, INPUT_CONSTRAINTS } from './pension-input-validator';
import { DEFAULT_PENSION_INPUT, PensionInput } from './pension-input.model';

describe('PensionInputValidator', () => {

  // ──────────────────────────────────────────────
  // Valid input — happy path
  // ──────────────────────────────────────────────

  describe('Valid input (happy path)', () => {
    it('should accept DEFAULT_PENSION_INPUT as valid', () => {
      const result = PensionInputValidator.validate(DEFAULT_PENSION_INPUT);
      expect(result.valid).toBeTrue();
      expect(result.errors.length).toBe(0);
    });

    it('should return sanitized input identical to original when valid', () => {
      const result = PensionInputValidator.validate(DEFAULT_PENSION_INPUT);
      expect(result.sanitizedInput).toEqual(DEFAULT_PENSION_INPUT);
    });

    it('isValid() should return true for valid input', () => {
      expect(PensionInputValidator.isValid(DEFAULT_PENSION_INPUT)).toBeTrue();
    });

    it('sanitize() should return input unchanged when valid', () => {
      const sanitized = PensionInputValidator.sanitize(DEFAULT_PENSION_INPUT);
      expect(sanitized).toEqual(DEFAULT_PENSION_INPUT);
    });

    it('should accept minimum valid values', () => {
      const input: PensionInput = {
        bruttoMonatlicheRente: 0,
        rentenbeginnJahr: 2025,
        aktuellesAlter: 16,
        gewuenschteMonatlicheRente: 0,
        inflationsrate: 0,
        hatKinder: false,
        zusatzbeitragssatz: 0,
        steuerJahr: 2025,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeTrue();
    });

    it('should accept maximum valid values', () => {
      const input: PensionInput = {
        bruttoMonatlicheRente: 10_000,
        rentenbeginnJahr: 2080,
        aktuellesAlter: 100,
        gewuenschteMonatlicheRente: 20_000,
        inflationsrate: 0.15,
        hatKinder: true,
        zusatzbeitragssatz: 0.05,
        steuerJahr: 2026,
      };
      const result = PensionInputValidator.validate(input);
      // May have cross-field warning about age 100, but range is fine
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(10_000);
      expect(result.sanitizedInput.inflationsrate).toBe(0.15);
    });
  });

  // ──────────────────────────────────────────────
  // NaN / Infinity / type errors
  // ──────────────────────────────────────────────

  describe('NaN and Infinity handling', () => {
    it('should reject NaN bruttoMonatlicheRente and use default', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: NaN };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
      expect(result.errors.some(e => e.field === 'bruttoMonatlicheRente')).toBeTrue();
    });

    it('should reject Infinity inflationsrate and use default', () => {
      const input = { ...DEFAULT_PENSION_INPUT, inflationsrate: Infinity };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.inflationsrate).toBe(DEFAULT_PENSION_INPUT.inflationsrate);
    });

    it('should reject -Infinity aktuellesAlter and use default', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: -Infinity };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.aktuellesAlter).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
    });

    it('should reject NaN for all numeric fields', () => {
      const input: PensionInput = {
        bruttoMonatlicheRente: NaN,
        rentenbeginnJahr: NaN,
        aktuellesAlter: NaN,
        gewuenschteMonatlicheRente: NaN,
        inflationsrate: NaN,
        hatKinder: true,
        zusatzbeitragssatz: NaN,
        steuerJahr: 2026,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      // Should have errors for all numeric fields
      expect(result.errors.filter(e => e.message.includes('finite number')).length).toBe(6);
      // Sanitized values should be defaults
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
      expect(result.sanitizedInput.rentenbeginnJahr).toBe(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
      expect(result.sanitizedInput.aktuellesAlter).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
    });

    it('should handle string coerced as number (type safety)', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: 'abc' as unknown as number };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
    });

    it('should handle undefined coerced as number', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: undefined as unknown as number };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.aktuellesAlter).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
    });

    it('should handle null coerced as number', () => {
      const input = { ...DEFAULT_PENSION_INPUT, inflationsrate: null as unknown as number };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.inflationsrate).toBe(DEFAULT_PENSION_INPUT.inflationsrate);
    });
  });

  // ──────────────────────────────────────────────
  // Range clamping — bruttoMonatlicheRente
  // ──────────────────────────────────────────────

  describe('bruttoMonatlicheRente range', () => {
    it('should clamp negative values to 0', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: -500 };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(0);
    });

    it('should clamp values above max to 10,000', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: 50_000 };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(10_000);
    });

    it('should accept €0 gross pension', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: 0 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'bruttoMonatlicheRente').length).toBe(0);
    });

    it('should accept €10,000 gross pension', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: 10_000 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'bruttoMonatlicheRente').length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Range clamping — aktuellesAlter
  // ──────────────────────────────────────────────

  describe('aktuellesAlter range', () => {
    it('should clamp age below 16 to 16', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 5 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.aktuellesAlter).toBe(16);
    });

    it('should clamp age above 100 to 100', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 150 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.aktuellesAlter).toBe(100);
    });

    it('should round fractional age to integer', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 35.7 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.aktuellesAlter).toBe(36);
    });

    it('should accept age 67 (retirement age)', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 67 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'aktuellesAlter').length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Range clamping — rentenbeginnJahr
  // ──────────────────────────────────────────────

  describe('rentenbeginnJahr range', () => {
    it('should clamp year below 2025 to 2025', () => {
      const input = { ...DEFAULT_PENSION_INPUT, rentenbeginnJahr: 2000 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.rentenbeginnJahr).toBe(2025);
    });

    it('should clamp year above 2080 to 2080', () => {
      const input = { ...DEFAULT_PENSION_INPUT, rentenbeginnJahr: 2100 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.rentenbeginnJahr).toBe(2080);
    });

    it('should round fractional year to integer', () => {
      const input = { ...DEFAULT_PENSION_INPUT, rentenbeginnJahr: 2058.5 };
      const result = PensionInputValidator.validate(input);
      expect(Number.isInteger(result.sanitizedInput.rentenbeginnJahr)).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────
  // Range clamping — gewuenschteMonatlicheRente
  // ──────────────────────────────────────────────

  describe('gewuenschteMonatlicheRente range', () => {
    it('should clamp negative values to 0', () => {
      const input = { ...DEFAULT_PENSION_INPUT, gewuenschteMonatlicheRente: -100 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.gewuenschteMonatlicheRente).toBe(0);
    });

    it('should clamp values above max to 20,000', () => {
      const input = { ...DEFAULT_PENSION_INPUT, gewuenschteMonatlicheRente: 100_000 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.gewuenschteMonatlicheRente).toBe(20_000);
    });
  });

  // ──────────────────────────────────────────────
  // Range clamping — inflationsrate
  // ──────────────────────────────────────────────

  describe('inflationsrate range', () => {
    it('should clamp negative inflation to 0', () => {
      const input = { ...DEFAULT_PENSION_INPUT, inflationsrate: -0.05 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.inflationsrate).toBe(0);
    });

    it('should clamp inflation above 15% to 15%', () => {
      const input = { ...DEFAULT_PENSION_INPUT, inflationsrate: 0.50 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.inflationsrate).toBe(0.15);
    });

    it('should accept 0% inflation', () => {
      const input = { ...DEFAULT_PENSION_INPUT, inflationsrate: 0 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'inflationsrate').length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Range clamping — zusatzbeitragssatz
  // ──────────────────────────────────────────────

  describe('zusatzbeitragssatz range', () => {
    it('should clamp negative values to 0', () => {
      const input = { ...DEFAULT_PENSION_INPUT, zusatzbeitragssatz: -0.01 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.zusatzbeitragssatz).toBe(0);
    });

    it('should clamp values above 5% to 5%', () => {
      const input = { ...DEFAULT_PENSION_INPUT, zusatzbeitragssatz: 0.10 };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.zusatzbeitragssatz).toBe(0.05);
    });

    it('should accept 0 zusatzbeitragssatz', () => {
      const input = { ...DEFAULT_PENSION_INPUT, zusatzbeitragssatz: 0 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'zusatzbeitragssatz').length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // Boolean validation — hatKinder
  // ──────────────────────────────────────────────

  describe('hatKinder validation', () => {
    it('should accept true', () => {
      const input = { ...DEFAULT_PENSION_INPUT, hatKinder: true };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'hatKinder').length).toBe(0);
    });

    it('should accept false', () => {
      const input = { ...DEFAULT_PENSION_INPUT, hatKinder: false };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'hatKinder').length).toBe(0);
    });

    it('should coerce non-boolean truthy value to true', () => {
      const input = { ...DEFAULT_PENSION_INPUT, hatKinder: 1 as unknown as boolean };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.hatKinder).toBeTrue();
    });

    it('should coerce non-boolean falsy value to false', () => {
      const input = { ...DEFAULT_PENSION_INPUT, hatKinder: 0 as unknown as boolean };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.hatKinder).toBeFalse();
    });

    it('should coerce string to boolean', () => {
      const input = { ...DEFAULT_PENSION_INPUT, hatKinder: 'yes' as unknown as boolean };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.hatKinder).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────
  // steuerJahr validation
  // ──────────────────────────────────────────────

  describe('steuerJahr validation', () => {
    it('should accept 2025', () => {
      const input = { ...DEFAULT_PENSION_INPUT, steuerJahr: 2025 as 2025 | 2026 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'steuerJahr').length).toBe(0);
    });

    it('should accept 2026', () => {
      const input = { ...DEFAULT_PENSION_INPUT, steuerJahr: 2026 as 2025 | 2026 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'steuerJahr').length).toBe(0);
    });

    it('should reject invalid year and use default', () => {
      const input = { ...DEFAULT_PENSION_INPUT, steuerJahr: 2024 as unknown as 2025 | 2026 };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.steuerJahr).toBe(DEFAULT_PENSION_INPUT.steuerJahr);
    });

    it('should reject future year and use default', () => {
      const input = { ...DEFAULT_PENSION_INPUT, steuerJahr: 2030 as unknown as 2025 | 2026 };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      expect(result.sanitizedInput.steuerJahr).toBe(DEFAULT_PENSION_INPUT.steuerJahr);
    });
  });

  // ──────────────────────────────────────────────
  // Cross-field validation
  // ──────────────────────────────────────────────

  describe('Cross-field validation', () => {
    // ── How aktuellesAlter correlates with rentenbeginnJahr ──
    //
    //   birthYear ≈ currentYear − aktuellesAlter
    //   impliedRetirementAge = rentenbeginnJahr − birthYear
    //                        = rentenbeginnJahr − currentYear + aktuellesAlter
    //
    // A YOUNGER person (lower age) → higher birthYear → retires at a YOUNGER age
    // An OLDER person (higher age) → lower birthYear  → retires at an OLDER age
    //
    // Only truly impossible: impliedRetirementAge < 0 (retirement before birth)

    it('should compute correct implied retirement age for a young person', () => {
      // 20 y/o in 2026, retirement in 2073 → implied retirement age = 2073 - 2026 + 20 = 67
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 20, rentenbeginnJahr: 2073 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'rentenbeginnJahr').length).toBe(0);
    });

    it('should compute correct implied retirement age for an older person', () => {
      // 60 y/o in 2026, retirement in 2033 → implied retirement age = 2033 - 2026 + 60 = 67
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 60, rentenbeginnJahr: 2033 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'rentenbeginnJahr').length).toBe(0);
    });

    it('should accept early retirement (implied age < 67 is allowed)', () => {
      // 50 y/o, retirement in 2026 → implied retirement age = 2026 - 2026 + 50 = 50
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 50, rentenbeginnJahr: 2026 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e => e.field === 'rentenbeginnJahr').length).toBe(0);
    });

    it('should accept retirement year in the near past (already retired)', () => {
      // 30 y/o, retirement in 2025 → implied retirement age = 2025 - 2026 + 30 = 29 ≥ 0
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 30, rentenbeginnJahr: 2025 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e =>
        e.field === 'rentenbeginnJahr' && e.message.includes('impossible'),
      ).length).toBe(0);
    });

    it('should be a safety net that never triggers after range clamping', () => {
      // After clamping: rentenbeginnJahr ≥ 2025, aktuellesAlter ≥ 16
      // Minimum impliedRetirementAge = 2025 - 2026 + 16 = 15 ≥ 0 → always valid
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 16, rentenbeginnJahr: 2025 };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e =>
        e.field === 'rentenbeginnJahr' && e.message.includes('impossible'),
      ).length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────
  // INPUT_CONSTRAINTS export
  // ──────────────────────────────────────────────

  describe('INPUT_CONSTRAINTS', () => {
    it('should define constraints for all numeric fields', () => {
      expect(INPUT_CONSTRAINTS.bruttoMonatlicheRente).toBeDefined();
      expect(INPUT_CONSTRAINTS.rentenbeginnJahr).toBeDefined();
      expect(INPUT_CONSTRAINTS.aktuellesAlter).toBeDefined();
      expect(INPUT_CONSTRAINTS.gewuenschteMonatlicheRente).toBeDefined();
      expect(INPUT_CONSTRAINTS.inflationsrate).toBeDefined();
      expect(INPUT_CONSTRAINTS.zusatzbeitragssatz).toBeDefined();
      expect(INPUT_CONSTRAINTS.steuerJahr).toBeDefined();
    });

    it('should have min <= max for all ranged constraints', () => {
      expect(INPUT_CONSTRAINTS.bruttoMonatlicheRente.min).toBeLessThanOrEqual(INPUT_CONSTRAINTS.bruttoMonatlicheRente.max);
      expect(INPUT_CONSTRAINTS.rentenbeginnJahr.min).toBeLessThanOrEqual(INPUT_CONSTRAINTS.rentenbeginnJahr.max);
      expect(INPUT_CONSTRAINTS.aktuellesAlter.min).toBeLessThanOrEqual(INPUT_CONSTRAINTS.aktuellesAlter.max);
      expect(INPUT_CONSTRAINTS.gewuenschteMonatlicheRente.min).toBeLessThanOrEqual(INPUT_CONSTRAINTS.gewuenschteMonatlicheRente.max);
      expect(INPUT_CONSTRAINTS.inflationsrate.min).toBeLessThanOrEqual(INPUT_CONSTRAINTS.inflationsrate.max);
      expect(INPUT_CONSTRAINTS.zusatzbeitragssatz.min).toBeLessThanOrEqual(INPUT_CONSTRAINTS.zusatzbeitragssatz.max);
    });

    it('should include default values within valid ranges', () => {
      expect(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente).toBeGreaterThanOrEqual(INPUT_CONSTRAINTS.bruttoMonatlicheRente.min);
      expect(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente).toBeLessThanOrEqual(INPUT_CONSTRAINTS.bruttoMonatlicheRente.max);
      expect(DEFAULT_PENSION_INPUT.aktuellesAlter).toBeGreaterThanOrEqual(INPUT_CONSTRAINTS.aktuellesAlter.min);
      expect(DEFAULT_PENSION_INPUT.aktuellesAlter).toBeLessThanOrEqual(INPUT_CONSTRAINTS.aktuellesAlter.max);
      expect(DEFAULT_PENSION_INPUT.inflationsrate).toBeGreaterThanOrEqual(INPUT_CONSTRAINTS.inflationsrate.min);
      expect(DEFAULT_PENSION_INPUT.inflationsrate).toBeLessThanOrEqual(INPUT_CONSTRAINTS.inflationsrate.max);
    });
  });

  // ──────────────────────────────────────────────
  // Error object structure
  // ──────────────────────────────────────────────

  describe('ValidationError structure', () => {
    it('should include field name in error', () => {
      const input = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: NaN };
      const result = PensionInputValidator.validate(input);
      const error = result.errors.find(e => e.field === 'bruttoMonatlicheRente');
      expect(error).toBeDefined();
      expect(error!.field).toBe('bruttoMonatlicheRente');
    });

    it('should include the invalid value in error', () => {
      const input = { ...DEFAULT_PENSION_INPUT, inflationsrate: 0.99 };
      const result = PensionInputValidator.validate(input);
      const error = result.errors.find(e => e.field === 'inflationsrate');
      expect(error).toBeDefined();
      expect(error!.value).toBe(0.99);
    });

    it('should include a human-readable message', () => {
      const input = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: -5 };
      const result = PensionInputValidator.validate(input);
      const error = result.errors.find(e => e.field === 'aktuellesAlter');
      expect(error).toBeDefined();
      expect(typeof error!.message).toBe('string');
      expect(error!.message.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────
  // Multiple errors scenario
  // ──────────────────────────────────────────────

  describe('Multiple validation errors', () => {
    it('should collect all errors, not stop at first', () => {
      const input: PensionInput = {
        bruttoMonatlicheRente: -100,
        rentenbeginnJahr: 1900,
        aktuellesAlter: -5,
        gewuenschteMonatlicheRente: -200,
        inflationsrate: 1.0,
        hatKinder: 'maybe' as unknown as boolean,
        zusatzbeitragssatz: -0.1,
        steuerJahr: 2024 as unknown as 2025 | 2026,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      // Should have errors for every field
      expect(result.errors.length).toBeGreaterThanOrEqual(7);
    });

    it('should still produce a usable sanitized input even with many errors', () => {
      const input: PensionInput = {
        bruttoMonatlicheRente: NaN,
        rentenbeginnJahr: NaN,
        aktuellesAlter: NaN,
        gewuenschteMonatlicheRente: NaN,
        inflationsrate: NaN,
        hatKinder: null as unknown as boolean,
        zusatzbeitragssatz: NaN,
        steuerJahr: NaN as unknown as 2025 | 2026,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.valid).toBeFalse();
      // Sanitized should be usable (all defaults)
      const s = result.sanitizedInput;
      expect(s.bruttoMonatlicheRente).toBe(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
      expect(s.rentenbeginnJahr).toBe(DEFAULT_PENSION_INPUT.rentenbeginnJahr);
      expect(s.aktuellesAlter).toBe(DEFAULT_PENSION_INPUT.aktuellesAlter);
      expect(s.steuerJahr).toBe(DEFAULT_PENSION_INPUT.steuerJahr);
    });
  });

  // ──────────────────────────────────────────────
  // Edge-case combinations
  // ──────────────────────────────────────────────

  describe('Edge-case combinations', () => {
    it('should handle age 67 with retirement year 2026 (already retired)', () => {
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        aktuellesAlter: 67,
        rentenbeginnJahr: 2026,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.aktuellesAlter).toBe(67);
    });

    it('should handle €0 brutto with €0 gewünscht (no gap)', () => {
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 0,
        gewuenschteMonatlicheRente: 0,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.errors.filter(e =>
        e.field === 'bruttoMonatlicheRente' || e.field === 'gewuenschteMonatlicheRente',
      ).length).toBe(0);
    });

    it('should handle 0% inflation with 0 years to retirement', () => {
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        inflationsrate: 0,
        aktuellesAlter: 67,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.inflationsrate).toBe(0);
    });

    it('should handle maximum pension with maximum desired income', () => {
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: 10_000,
        gewuenschteMonatlicheRente: 20_000,
      };
      const result = PensionInputValidator.validate(input);
      expect(result.sanitizedInput.bruttoMonatlicheRente).toBe(10_000);
      expect(result.sanitizedInput.gewuenschteMonatlicheRente).toBe(20_000);
    });
  });

  // ──────────────────────────────────────────────
  // Immutability
  // ──────────────────────────────────────────────

  describe('Immutability', () => {
    it('should not mutate the original input object', () => {
      const input: PensionInput = {
        ...DEFAULT_PENSION_INPUT,
        bruttoMonatlicheRente: -500,
        aktuellesAlter: 200,
      };
      const originalBrutto = input.bruttoMonatlicheRente;
      const originalAlter = input.aktuellesAlter;

      PensionInputValidator.validate(input);

      expect(input.bruttoMonatlicheRente).toBe(originalBrutto);
      expect(input.aktuellesAlter).toBe(originalAlter);
    });

    it('sanitize() should return a new object, not the original', () => {
      const input = { ...DEFAULT_PENSION_INPUT };
      const sanitized = PensionInputValidator.sanitize(input);
      expect(sanitized).not.toBe(input);
    });
  });
});



