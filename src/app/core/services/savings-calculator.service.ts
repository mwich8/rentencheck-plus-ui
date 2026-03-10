import { Injectable } from '@angular/core';
import { DEFAULT_PAYOUT_YEARS } from '../constants/calculator-defaults.const';

export interface SavingsProjection {
  /** Total capital accumulated at end of period */
  endkapital: number;
  /** Total amount contributed (principal) */
  eigenanteil: number;
  /** Total interest/returns earned */
  renditeErtrag: number;
  /** Monthly payout if distributed over payoutYears */
  monatlicheAuszahlung: number;
}

/**
 * Compound interest calculator for retirement savings planning.
 *
 * Uses the future value of annuity formula:
 * FV = PMT × [((1 + r/12)^(n×12) - 1) / (r/12)]
 *
 * Where:
 *   PMT = monthly contribution
 *   r = annual return rate
 *   n = number of years
 */
@Injectable({ providedIn: 'root' })
export class SavingsCalculatorService {
  /**
   * Calculate future value of monthly savings with compound interest.
   */
  calculateFutureValue(
    monthlyContribution: number,
    annualReturnRate: number,
    years: number,
    payoutYears: number = DEFAULT_PAYOUT_YEARS,
  ): SavingsProjection {
    if (years <= 0 || monthlyContribution <= 0) {
      return { endkapital: 0, eigenanteil: 0, renditeErtrag: 0, monatlicheAuszahlung: 0 };
    }

    const months = years * 12;
    const eigenanteil = monthlyContribution * months;

    if (annualReturnRate <= 0) {
      return {
        endkapital: eigenanteil,
        eigenanteil,
        renditeErtrag: 0,
        monatlicheAuszahlung: eigenanteil / (payoutYears * 12),
      };
    }

    const monthlyRate = annualReturnRate / 12;
    const endkapital = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const renditeErtrag = endkapital - eigenanteil;

    // Monthly payout from accumulated capital over payoutYears
    const monatlicheAuszahlung = this.calculateMonthlyPayout(endkapital, annualReturnRate, payoutYears);

    return {
      endkapital: Math.round(endkapital * 100) / 100,
      eigenanteil: Math.round(eigenanteil * 100) / 100,
      renditeErtrag: Math.round(renditeErtrag * 100) / 100,
      monatlicheAuszahlung: Math.round(monatlicheAuszahlung * 100) / 100,
    };
  }

  /**
   * Calculate monthly payout from a capital sum over a given period.
   * Uses annuity formula: PMT = PV × [r/12 × (1+r/12)^(n×12)] / [(1+r/12)^(n×12) - 1]
   */
  calculateMonthlyPayout(
    capital: number,
    annualReturnRate: number,
    years: number,
  ): number {
    if (capital <= 0 || years <= 0) return 0;

    if (annualReturnRate <= 0) {
      return capital / (years * 12);
    }

    const monthlyRate = annualReturnRate / 12;
    const months = years * 12;
    const factor = Math.pow(1 + monthlyRate, months);
    return capital * (monthlyRate * factor) / (factor - 1);
  }

  /**
   * Calculate monthly savings needed to close a pension gap.
   * Reverse of future value calculation.
   */
  calculateRequiredMonthlySavings(
    monthlyGap: number,
    annualReturnRate: number,
    yearsToRetirement: number,
    payoutYears: number = DEFAULT_PAYOUT_YEARS,
  ): number {
    if (monthlyGap <= 0 || yearsToRetirement <= 0) return 0;

    // First, determine the capital needed to generate monthlyGap for payoutYears
    const capitalNeeded = this.calculateRequiredCapital(monthlyGap, annualReturnRate, payoutYears);

    // Then, determine the monthly savings needed to accumulate that capital
    if (annualReturnRate <= 0) {
      return capitalNeeded / (yearsToRetirement * 12);
    }

    const monthlyRate = annualReturnRate / 12;
    const months = yearsToRetirement * 12;
    const factor = Math.pow(1 + monthlyRate, months) - 1;
    return capitalNeeded * monthlyRate / factor;
  }

  /**
   * Calculate capital needed to generate a monthly payout for a given period.
   * PV = PMT × [(1 - (1+r/12)^(-n×12)) / (r/12)]
   */
  private calculateRequiredCapital(
    monthlyPayout: number,
    annualReturnRate: number,
    years: number,
  ): number {
    if (monthlyPayout <= 0 || years <= 0) return 0;

    if (annualReturnRate <= 0) {
      return monthlyPayout * years * 12;
    }

    const monthlyRate = annualReturnRate / 12;
    const months = years * 12;
    return monthlyPayout * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
  }
}

