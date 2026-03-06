import { TestBed } from '@angular/core/testing';
import { InflationService } from './inflation.service';
import { InflationProjection } from '../models/pension-result.model';

describe('InflationService', () => {
  let service: InflationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InflationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // computeRealValue
  // ──────────────────────────────────────────────

  describe('computeRealValue', () => {
    it('should return nominal value when years = 0', () => {
      expect(service.computeRealValue(1000, 0.02, 0)).toBe(1000);
    });

    it('should return nominal value when inflation = 0', () => {
      expect(service.computeRealValue(1000, 0, 30)).toBe(1000);
    });

    it('should return nominal value when years < 0', () => {
      expect(service.computeRealValue(1000, 0.02, -5)).toBe(1000);
    });

    it('should return nominal value when inflation < 0', () => {
      expect(service.computeRealValue(1000, -0.01, 10)).toBe(1000);
    });

    it('should decay value with 2% inflation over 1 year', () => {
      const result = service.computeRealValue(1000, 0.02, 1);
      expect(result).toBeCloseTo(980, 1);
    });

    it('should decay value with 2% inflation over 10 years', () => {
      // 1000 * (0.98)^10 ≈ 817.07
      const result = service.computeRealValue(1000, 0.02, 10);
      expect(result).toBeCloseTo(817.07, 0);
    });

    it('should decay value with 2% inflation over 30 years', () => {
      // 1000 * (0.98)^30 ≈ 545.68
      const result = service.computeRealValue(1000, 0.02, 30);
      expect(result).toBeCloseTo(545.68, 0);
    });

    it('should decay more with higher inflation', () => {
      const r2 = service.computeRealValue(1000, 0.02, 20);
      const r4 = service.computeRealValue(1000, 0.04, 20);
      expect(r4).toBeLessThan(r2);
    });

    it('should decay more with more years', () => {
      const r10 = service.computeRealValue(1000, 0.02, 10);
      const r30 = service.computeRealValue(1000, 0.02, 30);
      expect(r30).toBeLessThan(r10);
    });
  });

  // ──────────────────────────────────────────────
  // projectInflation
  // ──────────────────────────────────────────────

  describe('projectInflation', () => {
    it('should return maxJahre + 1 data points (including year 0)', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 30);
      expect(projections.length).toBe(31); // 0..30 inclusive
    });

    it('should start with nominal = real at year 0', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 30);
      expect(projections[0].nominalMonatlich).toBe(1000);
      expect(projections[0].realMonatlich).toBe(1000);
      expect(projections[0].kaufkraftVerlust).toBe(0);
    });

    it('should have correct year and age progression', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 5);
      expect(projections[0].jahr).toBe(2058);
      expect(projections[0].alter).toBe(67);
      expect(projections[3].jahr).toBe(2061);
      expect(projections[3].alter).toBe(70);
    });

    it('should keep nominal value constant', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 10);
      projections.forEach(p => {
        expect(p.nominalMonatlich).toBe(1000);
      });
    });

    it('should show decreasing real value over time', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 10);
      for (let i = 1; i < projections.length; i++) {
        expect(projections[i].realMonatlich).toBeLessThan(projections[i - 1].realMonatlich);
      }
    });

    it('should show increasing kaufkraftVerlust over time', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 10);
      for (let i = 1; i < projections.length; i++) {
        expect(projections[i].kaufkraftVerlust).toBeGreaterThan(projections[i - 1].kaufkraftVerlust);
      }
    });

    it('should round real values to 2 decimal places', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058, 10);
      projections.forEach(p => {
        expect(p.realMonatlich).toBe(Math.round(p.realMonatlich * 100) / 100);
        expect(p.kaufkraftVerlust).toBe(Math.round(p.kaufkraftVerlust * 100) / 100);
      });
    });

    it('should default to 30 years projection', () => {
      const projections = service.projectInflation(1000, 0.02, 67, 2058);
      expect(projections.length).toBe(31);
    });
  });

  // ──────────────────────────────────────────────
  // computeCumulativeLoss
  // ──────────────────────────────────────────────

  describe('computeCumulativeLoss', () => {
    it('should return 0 for 0 years', () => {
      expect(service.computeCumulativeLoss(1000, 0.02, 0)).toBe(0);
    });

    it('should compute loss for 1 year', () => {
      // Year 1: loss = (1000 - 1000*0.98) * 12 = 20 * 12 = 240
      const loss = service.computeCumulativeLoss(1000, 0.02, 1);
      expect(loss).toBeCloseTo(240, 0);
    });

    it('should accumulate loss over multiple years', () => {
      const loss1 = service.computeCumulativeLoss(1000, 0.02, 1);
      const loss5 = service.computeCumulativeLoss(1000, 0.02, 5);
      expect(loss5).toBeGreaterThan(loss1);
    });

    it('should round to 2 decimal places', () => {
      const loss = service.computeCumulativeLoss(1000, 0.02, 10);
      expect(loss).toBe(Math.round(loss * 100) / 100);
    });

    it('should compute significant loss over 30 years', () => {
      // Over 30 years with 2% inflation on €1000/month, cumulative loss is substantial
      const loss = service.computeCumulativeLoss(1000, 0.02, 30);
      expect(loss).toBeGreaterThan(50_000); // Significant loss
    });
  });
});

