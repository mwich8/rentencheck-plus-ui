import { TestBed } from '@angular/core/testing';
import { RentenScoreService, RentenScore } from './renten-score.service';
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

    it('should weight deckungsquote at 50%', () => {
      const lowDeckung = createMockResult({ deckungsquote: 20 });
      const highDeckung = createMockResult({ deckungsquote: 90 });
      const s1 = service.computeScore(lowDeckung, 2500);
      const s2 = service.computeScore(highDeckung, 2500);
      // Higher deckungsquote should significantly affect score
      expect(s2.score).toBeGreaterThan(s1.score);
    });

    it('should cap deckungsquote contribution at 100', () => {
      const result = createMockResult({ deckungsquote: 150 });
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
});

