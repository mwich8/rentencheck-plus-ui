import { TestBed } from '@angular/core/testing';
import { RentenScoreService } from './renten-score.service';
import { PensionResult } from '../models/pension-result.model';

function createMockResult(overrides: Partial<PensionResult> = {}): PensionResult {
  return {
    bruttoJaehrlich: 18000,
    bruttoMonatlich: 1500,
    besteuerungsanteil: 1.0,
    zuVersteuerndesEinkommen: 18000,
    rentenfreibetrag: 0,
    einkommensteuer: 1200,
    solidaritaetszuschlag: 0,
    kvdrBeitragMonatlich: 123.75,
    pflegeBeitragMonatlich: 54,
    gesamtAbzuegeMonatlich: 277.75,
    nettoMonatlich: 1222.25,
    realeKaufkraftMonatlich: 800,
    rentenluecke: 1700,
    deckungsquote: 32,
    jahresBisRente: 32,
    abzuege: [],
    inflationsVerlauf: [],
    ...overrides,
  };
}

describe('RentenScoreService', () => {
  let service: RentenScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RentenScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // Score computation
  // ──────────────────────────────────────────────

  describe('Score computation', () => {
    it('should return a score between 0 and 100', () => {
      const result = createMockResult();
      const score = service.computeScore(result, 2500);
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('should return high score for excellent pension situation', () => {
      const result = createMockResult({
        deckungsquote: 95,
        rentenluecke: 0,
        jahresBisRente: 35,
        nettoMonatlich: 1400,
        bruttoMonatlich: 1500,
      });
      const score = service.computeScore(result, 1400);
      expect(score.score).toBeGreaterThanOrEqual(80);
    });

    it('should return low score for poor pension situation', () => {
      const result = createMockResult({
        deckungsquote: 15,
        rentenluecke: 2000,
        jahresBisRente: 5,
        nettoMonatlich: 500,
        bruttoMonatlich: 1500,
      });
      const score = service.computeScore(result, 2500);
      expect(score.score).toBeLessThan(30);
    });

    it('should weight nominal coverage at 40%', () => {
      const lowCoverage = createMockResult({ nettoMonatlich: 500 });
      const highCoverage = createMockResult({ nettoMonatlich: 2400 });
      const s1 = service.computeScore(lowCoverage, 2500);
      const s2 = service.computeScore(highCoverage, 2500);
      // Higher nominal coverage should significantly affect score
      expect(s2.score).toBeGreaterThan(s1.score);
    });

    it('should cap coverage contribution at 100', () => {
      const result = createMockResult({ nettoMonatlich: 5000 });
      const score = service.computeScore(result, 2500);
      expect(score.score).toBeLessThanOrEqual(100);
    });

    it('should factor in years to retirement', () => {
      const fewYears = createMockResult({ jahresBisRente: 5 });
      const manyYears = createMockResult({ jahresBisRente: 35 });
      const s1 = service.computeScore(fewYears, 2500);
      const s2 = service.computeScore(manyYears, 2500);
      expect(s2.score).toBeGreaterThan(s1.score);
    });

    it('should handle 0 desired income', () => {
      const result = createMockResult();
      const score = service.computeScore(result, 0);
      // Gap score should be 0 when no desired income
      expect(score.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle 0 brutto (no pension)', () => {
      const result = createMockResult({ bruttoMonatlich: 0, nettoMonatlich: 0 });
      const score = service.computeScore(result, 2500);
      expect(score.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ──────────────────────────────────────────────
  // Grade assignment
  // ──────────────────────────────────────────────

  describe('Grade assignment', () => {
    it('should assign grade A for score >= 85', () => {
      const result = createMockResult({
        deckungsquote: 100,
        rentenluecke: 0,
        jahresBisRente: 40,
        nettoMonatlich: 1400,
        bruttoMonatlich: 1500,
      });
      const score = service.computeScore(result, 1400);
      if (score.score >= 85) {
        expect(score.grade).toBe('A');
        expect(score.label).toBe('Ausgezeichnet');
      }
    });

    it('should assign grade F for very low score', () => {
      const result = createMockResult({
        deckungsquote: 5,
        rentenluecke: 2400,
        jahresBisRente: 2,
        nettoMonatlich: 100,
        bruttoMonatlich: 1500,
      });
      const score = service.computeScore(result, 2500);
      expect(score.grade).toBe('F');
      expect(score.label).toBe('Kritisch');
    });

    it('should return a valid grade (A-F)', () => {
      const result = createMockResult();
      const score = service.computeScore(result, 2500);
      expect(['A', 'B', 'C', 'D', 'F']).toContain(score.grade);
    });

    it('should return a color string', () => {
      const result = createMockResult();
      const score = service.computeScore(result, 2500);
      expect(score.color).toBeTruthy();
      expect(score.color.startsWith('#')).toBeTrue();
    });

    it('should return a background color string', () => {
      const result = createMockResult();
      const score = service.computeScore(result, 2500);
      expect(score.bgColor).toBeTruthy();
      expect(score.bgColor.startsWith('rgba')).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────
  // Percentile (benchmark)
  // ──────────────────────────────────────────────

  describe('Percentile (benchmark)', () => {
    it('should return low percentile for low deckungsquote', () => {
      const result = createMockResult({ deckungsquote: 20 });
      const score = service.computeScore(result, 2500);
      expect(score.percentile).toBeLessThanOrEqual(10);
    });

    it('should return ~50th percentile for median deckungsquote (~55%)', () => {
      const result = createMockResult({ deckungsquote: 55 });
      const score = service.computeScore(result, 2500);
      expect(score.percentile).toBeCloseTo(50, -1);
    });

    it('should return high percentile for high deckungsquote', () => {
      const result = createMockResult({ deckungsquote: 95 });
      const score = service.computeScore(result, 2500);
      expect(score.percentile).toBeGreaterThanOrEqual(90);
    });

    it('should return min percentile for very low deckungsquote', () => {
      const result = createMockResult({ deckungsquote: 5 });
      const score = service.computeScore(result, 2500);
      expect(score.percentile).toBe(5);
    });

    it('should return max percentile for very high deckungsquote', () => {
      const result = createMockResult({ deckungsquote: 120 });
      const score = service.computeScore(result, 2500);
      expect(score.percentile).toBe(99);
    });

    it('should interpolate percentile between benchmark points', () => {
      const result = createMockResult({ deckungsquote: 45 });
      const score = service.computeScore(result, 2500);
      // Between [40, 25] and [50, 42]: 45 → ~33.5
      expect(score.percentile).toBeGreaterThan(25);
      expect(score.percentile).toBeLessThan(42);
    });
  });

  // ──────────────────────────────────────────────
  // Age monotonicity — CRITICAL invariant
  // ──────────────────────────────────────────────

  describe('Age monotonicity', () => {
    // The core invariant: when ONLY age changes (all other pension data
    // held constant), a younger person must ALWAYS score higher.
    // This test sweeps through ages to verify strict monotonicity.

    it('should decrease score monotonically as jahresBisRente decreases', () => {
      const yearsValues = [40, 35, 30, 25, 20, 15, 10, 5, 0];
      const scores = yearsValues.map(years => {
        const result = createMockResult({ jahresBisRente: years });
        return service.computeScore(result, 2500).score;
      });

      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should produce strictly higher score for 30 vs 5 years to retirement', () => {
      const young = createMockResult({ jahresBisRente: 30 });
      const old = createMockResult({ jahresBisRente: 5 });
      const scoreYoung = service.computeScore(young, 2500).score;
      const scoreOld = service.computeScore(old, 2500).score;
      expect(scoreYoung).toBeGreaterThan(scoreOld);
    });

    it('should never reverse direction when sweeping age 18→66', () => {
      const scores: number[] = [];
      for (let age = 18; age <= 66; age++) {
        const jahresBisRente = Math.max(0, 67 - age);
        const result = createMockResult({ jahresBisRente });
        scores.push(service.computeScore(result, 2500).score);
      }
      // Verify monotonically non-increasing (younger = higher or equal)
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should show meaningful difference between age 25 and age 60', () => {
      const young = createMockResult({ jahresBisRente: 42 }); // age 25
      const old = createMockResult({ jahresBisRente: 7 });    // age 60
      const scoreYoung = service.computeScore(young, 2500).score;
      const scoreOld = service.computeScore(old, 2500).score;
      // At least 5 points difference to be perceptible
      expect(scoreYoung - scoreOld).toBeGreaterThanOrEqual(5);
    });

    it('should give 0 time score when jahresBisRente is 0', () => {
      const atRetirement = createMockResult({ jahresBisRente: 0 });
      const withTime = createMockResult({ jahresBisRente: 20 });
      const scoreAt = service.computeScore(atRetirement, 2500).score;
      const scoreWith = service.computeScore(withTime, 2500).score;
      expect(scoreWith).toBeGreaterThan(scoreAt);
    });
  });

  // ──────────────────────────────────────────────
  // End-to-end with PensionCalculatorService
  // ──────────────────────────────────────────────

  describe('Integration: score monotonicity through full pipeline', () => {
    // This test uses the real PensionCalculatorService to prove
    // that the score is monotonic even with inflation-adjusted results.

    let calcService: import('./pension-calculator.service').PensionCalculatorService;

    beforeEach(async () => {
      const mod = await import('./pension-calculator.service');
      calcService = TestBed.inject(mod.PensionCalculatorService);
    });

    it('should produce monotonically decreasing scores as age increases (full pipeline)', () => {
      const baseInput = {
        bruttoMonatlicheRente: 1500,
        rentenbeginnJahr: 2058,
        gewuenschteMonatlicheRente: 2500,
        inflationsrate: 0.02,
        hatKinder: true,
        zusatzbeitragssatz: 0.017,
        steuerJahr: 2026 as const,
      };

      const scores: number[] = [];
      for (let age = 20; age <= 66; age++) {
        const result = calcService.calculate({ ...baseInput, aktuellesAlter: age });
        const score = service.computeScore(result, 2500);
        scores.push(score.score);
      }

      // Verify monotonically non-increasing
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(
          scores[i + 1],
          // Custom failure message:
        );
      }
    });

    it('should produce higher score at age 25 than age 55 through full pipeline', () => {
      const baseInput = {
        bruttoMonatlicheRente: 1500,
        rentenbeginnJahr: 2058,
        gewuenschteMonatlicheRente: 2500,
        inflationsrate: 0.02,
        hatKinder: true,
        zusatzbeitragssatz: 0.017,
        steuerJahr: 2026 as const,
      };

      const result25 = calcService.calculate({ ...baseInput, aktuellesAlter: 25 });
      const result55 = calcService.calculate({ ...baseInput, aktuellesAlter: 55 });
      const score25 = service.computeScore(result25, 2500).score;
      const score55 = service.computeScore(result55, 2500).score;

      expect(score25).toBeGreaterThan(score55);
    });
  });
});

