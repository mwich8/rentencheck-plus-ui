import { DEFAULT_PENSION_INPUT, PensionInput } from './pension-input.model';

describe('PensionInput Model', () => {

  describe('DEFAULT_PENSION_INPUT', () => {
    it('should have a valid bruttoMonatlicheRente', () => {
      expect(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente).toBe(1500);
    });

    it('should have a future retirement year', () => {
      expect(DEFAULT_PENSION_INPUT.rentenbeginnJahr).toBe(2058);
      expect(DEFAULT_PENSION_INPUT.rentenbeginnJahr).toBeGreaterThan(2025);
    });

    it('should have a reasonable current age', () => {
      expect(DEFAULT_PENSION_INPUT.aktuellesAlter).toBe(35);
      expect(DEFAULT_PENSION_INPUT.aktuellesAlter).toBeGreaterThan(0);
      expect(DEFAULT_PENSION_INPUT.aktuellesAlter).toBeLessThan(67);
    });

    it('should have desired income higher than gross pension', () => {
      expect(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente).toBe(2500);
      expect(DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente)
        .toBeGreaterThan(DEFAULT_PENSION_INPUT.bruttoMonatlicheRente);
    });

    it('should have a standard inflation rate (2%)', () => {
      expect(DEFAULT_PENSION_INPUT.inflationsrate).toBe(0.02);
    });

    it('should default to having children', () => {
      expect(DEFAULT_PENSION_INPUT.hatKinder).toBeTrue();
    });

    it('should have a valid Zusatzbeitragssatz', () => {
      expect(DEFAULT_PENSION_INPUT.zusatzbeitragssatz).toBe(0.017);
      expect(DEFAULT_PENSION_INPUT.zusatzbeitragssatz).toBeGreaterThan(0);
      expect(DEFAULT_PENSION_INPUT.zusatzbeitragssatz).toBeLessThan(0.05);
    });

    it('should use 2026 as default tax year', () => {
      expect(DEFAULT_PENSION_INPUT.steuerJahr).toBe(2026);
    });

    it('should be a complete PensionInput', () => {
      const input: PensionInput = DEFAULT_PENSION_INPUT;
      expect(input.bruttoMonatlicheRente).toBeDefined();
      expect(input.rentenbeginnJahr).toBeDefined();
      expect(input.aktuellesAlter).toBeDefined();
      expect(input.gewuenschteMonatlicheRente).toBeDefined();
      expect(input.inflationsrate).toBeDefined();
      expect(input.hatKinder).toBeDefined();
      expect(input.zusatzbeitragssatz).toBeDefined();
      expect(input.steuerJahr).toBeDefined();
    });
  });
});

