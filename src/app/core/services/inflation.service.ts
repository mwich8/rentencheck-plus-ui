import { Injectable } from '@angular/core';
import { InflationProjection } from '../models/pension-result.model';

/**
 * Inflation decay model for pension purchasing power.
 *
 * Real Value = Nominal × (1 - i)^n
 *
 * Where:
 *   i = annual inflation rate (e.g. 0.02 for 2%)
 *   n = number of years
 *
 * This computes how much purchasing power is lost over time
 * even if the nominal pension amount stays constant.
 */
@Injectable({ providedIn: 'root' })
export class InflationService {
  /**
   * Calculate the real (inflation-adjusted) value of a nominal amount.
   *
   * @param nominal The nominal value in EUR
   * @param inflationRate Annual inflation rate (e.g. 0.02)
   * @param years Number of years of inflation exposure
   * @returns Real purchasing power value
   */
  computeRealValue(nominal: number, inflationRate: number, years: number): number {
    if (years <= 0) return nominal;
    if (inflationRate <= 0) return nominal;
    return nominal * Math.pow(1 - inflationRate, years);
  }

  /**
   * Generate a year-by-year projection of inflation impact.
   *
   * @param nominalMonatlich Nominal monthly pension
   * @param inflationRate Annual inflation rate
   * @param startAlter Current age at start
   * @param startJahr Start year (retirement year)
   * @param maxJahre Number of years to project (default: 30)
   * @returns Array of yearly projection data points
   */
  projectInflation(
    nominalMonatlich: number,
    inflationRate: number,
    startAlter: number,
    startJahr: number,
    maxJahre: number = 30,
  ): InflationProjection[] {
    const projections: InflationProjection[] = [];

    for (let n = 0; n <= maxJahre; n++) {
      const realMonatlich = this.computeRealValue(nominalMonatlich, inflationRate, n);
      const kaufkraftVerlust = nominalMonatlich - realMonatlich;

      projections.push({
        jahr: startJahr + n,
        alter: startAlter + n,
        nominalMonatlich,
        realMonatlich: Math.round(realMonatlich * 100) / 100,
        kaufkraftVerlust: Math.round(kaufkraftVerlust * 100) / 100,
      });
    }

    return projections;
  }

  /**
   * Calculate the total purchasing power lost over a period.
   *
   * @param nominalMonatlich Monthly nominal pension
   * @param inflationRate Annual inflation rate
   * @param years Number of years
   * @returns Total cumulative loss in EUR
   */
  computeCumulativeLoss(
    nominalMonatlich: number,
    inflationRate: number,
    years: number,
  ): number {
    let totalLoss = 0;
    for (let n = 1; n <= years; n++) {
      const realValue = this.computeRealValue(nominalMonatlich, inflationRate, n);
      totalLoss += (nominalMonatlich - realValue) * 12; // Annual loss
    }
    return Math.round(totalLoss * 100) / 100;
  }
}

