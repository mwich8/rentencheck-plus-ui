import { EuroPipe } from './euro.pipe';

describe('EuroPipe', () => {
  let pipe: EuroPipe;

  beforeEach(() => {
    pipe = new EuroPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  describe('formatting', () => {
    it('should format a positive number as EUR', () => {
      const result = pipe.transform(1234.56);
      // German locale: 1.234,56 €
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    it('should format zero', () => {
      const result = pipe.transform(0);
      expect(result).toContain('0,00');
      expect(result).toContain('€');
    });

    it('should format a negative number', () => {
      const result = pipe.transform(-500);
      expect(result).toContain('500,00');
      expect(result).toContain('€');
    });

    it('should format with exactly 2 decimal places', () => {
      const result = pipe.transform(100);
      expect(result).toContain('100,00');
    });

    it('should format a large number with thousand separators', () => {
      const result = pipe.transform(1234567.89);
      expect(result).toContain('1.234.567,89');
    });

    it('should round to 2 decimal places', () => {
      const result = pipe.transform(99.999);
      expect(result).toContain('100,00');
    });
  });

  describe('edge cases', () => {
    it('should return "0,00 €" for null', () => {
      expect(pipe.transform(null)).toBe('0,00 €');
    });

    it('should return "0,00 €" for undefined', () => {
      expect(pipe.transform(undefined)).toBe('0,00 €');
    });

    it('should return "0,00 €" for NaN', () => {
      expect(pipe.transform(NaN)).toBe('0,00 €');
    });

    it('should handle very small values', () => {
      const result = pipe.transform(0.01);
      expect(result).toContain('0,01');
    });

    it('should handle very large values', () => {
      const result = pipe.transform(999999999.99);
      expect(result).toContain('€');
    });
  });
});

