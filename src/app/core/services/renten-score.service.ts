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
 * Weighted factors:
 * - Deckungsquote (coverage ratio): 50% weight
 * - Rentenluecke relative to desired income: 25% weight
 * - Years to act (more time = higher score): 15% weight
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
    // Factor 1: Deckungsquote (0–100 scale), weight 50%
    const deckungScore = Math.min(100, result.deckungsquote);

    // Factor 2: Gap relative to desired income (inverted, 0=huge gap, 100=no gap)
    const gapRatio = gewuenschteRente > 0
      ? Math.max(0, 1 - result.rentenluecke / gewuenschteRente)
      : 0;
    const gapScore = gapRatio * 100;

    // Factor 3: Time to act — more years = more time to fix things
    const timeScore = Math.min(100, result.jahresBisRente * 3); // 33+ years = max score

    // Factor 4: Net-to-gross efficiency
    const efficiencyRatio = result.bruttoMonatlich > 0
      ? result.nettoMonatlich / result.bruttoMonatlich
      : 0;
    const efficiencyScore = Math.min(100, efficiencyRatio * 120); // ~83% efficiency = 100

    // Weighted total
    const rawScore = (
      deckungScore * 0.50 +
      gapScore * 0.25 +
      timeScore * 0.15 +
      efficiencyScore * 0.10
    );

    const score = Math.round(Math.max(0, Math.min(100, rawScore)));
    const { grade, color, bgColor, label } = this.getGradeInfo(score);
    const percentile = this.getPercentile(result.deckungsquote);

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
    const curve = this.benchmarkCurve;
    if (deckungsquote <= curve[0][0]) return curve[0][1];
    if (deckungsquote >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];

    for (let i = 0; i < curve.length - 1; i++) {
      const [x0, y0] = curve[i];
      const [x1, y1] = curve[i + 1];
      if (deckungsquote >= x0 && deckungsquote <= x1) {
        const t = (deckungsquote - x0) / (x1 - x0);
        return Math.round(y0 + t * (y1 - y0));
      }
    }

    return 50;
  }
}
