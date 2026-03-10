import { Injectable } from '@angular/core';
import { PensionResult } from '../models/pension-result.model';

export interface RentenScore {
  /** Score from 0–100 */
  score: number;
  /** Letter grade A–F */
  grade: string;
  /** CSS color for the grade */
  color: string;
  /** Background color (lighter) */
  bgColor: string;
  /** Label text */
  label: string;
  /** Benchmark: "Besser als X% der Deutschen" */
  percentile: number;
}

/**
 * Computes a 0–100 "Renten-Score" from a PensionResult.
 *
 * Design principle: The score must change **monotonically** with age.
 * A younger person (more time to act) should always score higher than
 * an older person with identical pension data — never the reverse.
 *
 * To achieve this, age influences the score ONLY through the time factor.
 * Coverage and gap factors use the **nominal** (non-inflation-adjusted) values
 * so that changing age doesn't pull them in the opposite direction.
 *
 * Weighted factors:
 * - Nominal coverage ratio (net / desired): 40% weight
 * - Nominal gap relative to desired income: 20% weight
 * - Years to act (more time = higher score): 30% weight
 * - Net-to-gross ratio (deduction efficiency): 10% weight
 *
 * Benchmark based on median German deckungsquote (~55%).
 */
@Injectable({ providedIn: 'root' })
export class RentenScoreService {

  /**
   * Hardcoded distribution of deckungsquote percentiles.
   * Based on average German pension data approximation.
   * Key = deckungsquote, Value = percentile rank
   */
  private readonly benchmarkCurve: [number, number][] = [
    [20, 5],
    [30, 12],
    [40, 25],
    [50, 42],
    [55, 50],
    [60, 58],
    [70, 72],
    [80, 85],
    [90, 94],
    [100, 99],
  ];

  computeScore(result: PensionResult, gewuenschteRente: number): RentenScore {
    // Factor 1: Nominal coverage — how much of the desired income does the
    // net pension cover BEFORE inflation? This is age-independent.
    const nominalCoverage: number = gewuenschteRente > 0
      ? (result.nettoMonatlich / gewuenschteRente) * 100
      : 0;
    const coverageScore: number = Math.min(100, Math.max(0, nominalCoverage));

    // Factor 2: Nominal gap — shortfall before inflation (age-independent)
    const nominalGap: number = Math.max(0, gewuenschteRente - result.nettoMonatlich);
    const gapRatio: number = gewuenschteRente > 0
      ? Math.max(0, 1 - nominalGap / gewuenschteRente)
      : 0;
    const gapScore: number = gapRatio * 100;

    // Factor 3: Time to act — more years = higher score (monotonically age-driven)
    // Uses a diminishing-returns curve: sqrt(years/40) × 100
    // This gives meaningful differentiation across the full age range.
    const timeScore: number = Math.min(100, Math.sqrt(result.jahresBisRente / 40) * 100);

    // Factor 4: Net-to-gross efficiency (age-independent)
    const efficiencyRatio: number = result.bruttoMonatlich > 0
      ? result.nettoMonatlich / result.bruttoMonatlich
      : 0;
    const efficiencyScore: number = Math.min(100, efficiencyRatio * 120); // ~83% efficiency = 100

    // Weighted total — time factor at 30% ensures age always matters
    const rawScore: number = (
      coverageScore * 0.40 +
      gapScore * 0.20 +
      timeScore * 0.30 +
      efficiencyScore * 0.10
    );

    const score: number = Math.round(Math.max(0, Math.min(100, rawScore)));
    const { grade, color, bgColor, label }: { grade: string; color: string; bgColor: string; label: string } = this.getGradeInfo(score);
    const percentile: number = this.getPercentile(result.deckungsquote);

    return { score, grade, color, bgColor, label, percentile };
  }

  private getGradeInfo(score: number): { grade: string; color: string; bgColor: string; label: string } {
    if (score >= 85) return { grade: 'A', color: '#27ae60', bgColor: 'rgba(39,174,96,0.1)', label: 'Ausgezeichnet' };
    if (score >= 70) return { grade: 'B', color: '#2ecc71', bgColor: 'rgba(46,204,113,0.1)', label: 'Gut' };
    if (score >= 55) return { grade: 'C', color: '#f39c12', bgColor: 'rgba(243,156,18,0.1)', label: 'Befriedigend' };
    if (score >= 40) return { grade: 'D', color: '#e67e22', bgColor: 'rgba(230,126,34,0.1)', label: 'Bedenklich' };
    return { grade: 'F', color: '#e94560', bgColor: 'rgba(233,69,96,0.1)', label: 'Kritisch' };
  }

  /**
   * Interpolate the percentile from the benchmark curve.
   */
  private getPercentile(deckungsquote: number): number {
    const curve: [number, number][] = this.benchmarkCurve;
    if (deckungsquote <= curve[0][0]) return curve[0][1];
    if (deckungsquote >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];

    for (let i: number = 0; i < curve.length - 1; i++) {
      const [x0, y0]: [number, number] = curve[i];
      const [x1, y1]: [number, number] = curve[i + 1];
      if (deckungsquote >= x0 && deckungsquote <= x1) {
        const t: number = (deckungsquote - x0) / (x1 - x0);
        return Math.round(y0 + t * (y1 - y0));
      }
    }

    return 50;
  }
}
