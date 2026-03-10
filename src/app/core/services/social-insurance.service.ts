import { Injectable } from '@angular/core';
import { getInsuranceRates } from '../constants/insurance-rates.const';
import { SteuerJahr, LATEST_STEUER_JAHR } from '../constants/tax-brackets.const';

export interface SocialInsuranceResult {
  /** Monthly KVdR contribution (Krankenversicherung) */
  kvdrMonatlich: number;

  /** Monthly Pflegeversicherung contribution */
  pflegeMonatlich: number;

  /** Total monthly social insurance deductions */
  gesamtMonatlich: number;

  /** Annual total */
  gesamtJaehrlich: number;

  /** Effective KVdR rate applied */
  kvdrEffektiverSatz: number;

  /** Effective Pflege rate applied */
  pflegeEffektiverSatz: number;
}

/**
 * Calculates social insurance contributions for German retirees.
 *
 * KVdR: Retirees pay half the general rate (7.3%) plus half the Zusatzbeitrag
 * DRV (pension fund) pays the other half.
 *
 * Pflegeversicherung: Retirees pay the full contribution since July 2023.
 * Kinderlose (childless, 23+) pay a surcharge.
 */
@Injectable({ providedIn: 'root' })
export class SocialInsuranceService {
  /**
   * Calculate monthly social insurance deductions from gross pension.
   *
   * @param bruttoMonatlich Gross monthly pension
   * @param hatKinder Whether the person has children
   * @param zusatzbeitragssatz Custom Zusatzbeitrag rate (overrides default)
   * @param year Rate year
   */
  calculate(
    bruttoMonatlich: number,
    hatKinder: boolean = true,
    zusatzbeitragssatz?: number,
    year: SteuerJahr = LATEST_STEUER_JAHR,
  ): SocialInsuranceResult {
    const rates = getInsuranceRates(year);

    // KVdR: Rentner pays 7.3% + Zusatzbeitrag/2
    const zusatz = zusatzbeitragssatz ?? rates.kvdrZusatzbeitragDefault;
    const kvdrEffektiverSatz = rates.kvdrAllgemeinAnteil + zusatz / 2;
    const kvdrMonatlich = Math.round(bruttoMonatlich * kvdrEffektiverSatz * 100) / 100;

    // Pflegeversicherung: full rate for retirees
    const pflegeEffektiverSatz = hatKinder ? rates.pflegeMitKindern : rates.pflegeOhneKinder;
    const pflegeMonatlich = Math.round(bruttoMonatlich * pflegeEffektiverSatz * 100) / 100;

    const gesamtMonatlich = kvdrMonatlich + pflegeMonatlich;
    const gesamtJaehrlich = gesamtMonatlich * 12;

    return {
      kvdrMonatlich,
      pflegeMonatlich,
      gesamtMonatlich,
      gesamtJaehrlich,
      kvdrEffektiverSatz,
      pflegeEffektiverSatz,
    };
  }
}

