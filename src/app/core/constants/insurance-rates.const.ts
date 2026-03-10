import { SteuerJahr } from './tax-brackets.const';

/**
 * Social insurance rates for German retirees
 *
 * KVdR (Krankenversicherung der Rentner):
 * - Allgemeiner Beitragssatz: 14.6% (halved: 7.3% each for DRV + Rentner)
 * - Zusatzbeitrag: varies by Krankenkasse, avg ~1.7% in 2025 (halved for retirees)
 * - Rentner pays: 7.3% + Zusatzbeitrag/2
 * - DRV pays: 7.3% + Zusatzbeitrag/2
 *
 * Pflegeversicherung:
 * - With children: 3.4% (Rentner pays full amount since 2019)
 * - Without children (kinderlos, >= 23 years): 4.0% (Zuschlag: 0.6%)
 * - With 2+ children: reductions apply (simplified here)
 */
export interface InsuranceRateConfig {
  year: number;

  /** KVdR: Allgemeiner Beitragssatz (Arbeitnehmeranteil) */
  kvdrAllgemeinAnteil: number;

  /** KVdR: Default Zusatzbeitragssatz (durchschnittlich) */
  kvdrZusatzbeitragDefault: number;

  /** Pflegeversicherung: Rate with children */
  pflegeMitKindern: number;

  /** Pflegeversicherung: Rate without children (kinderlos) */
  pflegeOhneKinder: number;
}

export const INSURANCE_RATES_2025: InsuranceRateConfig = {
  year: 2025,
  kvdrAllgemeinAnteil: 0.073,
  kvdrZusatzbeitragDefault: 0.017,
  pflegeMitKindern: 0.034,
  pflegeOhneKinder: 0.040,
};

export const INSURANCE_RATES_2026: InsuranceRateConfig = {
  year: 2026,
  kvdrAllgemeinAnteil: 0.073,
  kvdrZusatzbeitragDefault: 0.019,
  pflegeMitKindern: 0.036,
  pflegeOhneKinder: 0.042,
};

export function getInsuranceRates(year: SteuerJahr): InsuranceRateConfig {
  return year === 2025 ? INSURANCE_RATES_2025 : INSURANCE_RATES_2026;
}

/**
 * Besteuerungsanteil der Rente (§22 Nr. 1 Satz 3 Buchst. a Doppelbuchst. aa EStG)
 *
 * Based on the year retirement starts (Rentenbeginn), a percentage of the
 * pension is taxable. The tax-free portion (Rentenfreibetrag) is fixed in €
 * in the first full year and remains constant for life.
 *
 * This table represents the taxable share (Besteuerungsanteil) by Rentenbeginn year.
 */
export const BESTEUERUNGSANTEIL_TABELLE: Record<number, number> = {
  2005: 0.50,
  2006: 0.52,
  2007: 0.54,
  2008: 0.56,
  2009: 0.58,
  2010: 0.60,
  2011: 0.62,
  2012: 0.64,
  2013: 0.66,
  2014: 0.68,
  2015: 0.70,
  2016: 0.72,
  2017: 0.74,
  2018: 0.76,
  2019: 0.78,
  2020: 0.80,
  2021: 0.81,
  2022: 0.82,
  2023: 0.83,
  2024: 0.84,
  2025: 0.835,  // Wachstumschancengesetz: 83.5% statt 85%
  2026: 0.86,
  2027: 0.87,
  2028: 0.88,
  2029: 0.89,
  2030: 0.90,
  2031: 0.91,
  2032: 0.92,
  2033: 0.93,
  2034: 0.94,
  2035: 0.95,
  2036: 0.96,
  2037: 0.97,
  2038: 0.98,
  2039: 0.99,
  2040: 1.00,
  2041: 1.00,
  2042: 1.00,
  2043: 1.00,
  2044: 1.00,
  2045: 1.00,
  2046: 1.00,
  2047: 1.00,
  2048: 1.00,
  2049: 1.00,
  2050: 1.00,
  2055: 1.00,
  2058: 1.00,
};

/**
 * Get the Besteuerungsanteil for a given Rentenbeginn year.
 * For years beyond the table, assumes 100% taxable.
 * For years between table entries, interpolates linearly.
 */
export function getBesteuerungsanteil(rentenbeginnJahr: number): number {
  if (rentenbeginnJahr >= 2040) return 1.0;
  if (rentenbeginnJahr <= 2005) return 0.50;

  const anteil: number | undefined = BESTEUERUNGSANTEIL_TABELLE[rentenbeginnJahr];
  if (anteil !== undefined) return anteil;

  // Linear interpolation for gaps
  const years: number[] = Object.keys(BESTEUERUNGSANTEIL_TABELLE).map(Number).sort((a: number, b: number) => a - b);
  let lower: number = years[0];
  let upper: number = years[years.length - 1];

  for (const y of years) {
    if (y <= rentenbeginnJahr) lower = y;
    if (y >= rentenbeginnJahr) {
      upper = y;
      break;
    }
  }

  const lowerVal: number = BESTEUERUNGSANTEIL_TABELLE[lower];
  const upperVal: number = BESTEUERUNGSANTEIL_TABELLE[upper];
  const ratio: number = (rentenbeginnJahr - lower) / (upper - lower);
  return lowerVal + ratio * (upperVal - lowerVal);
}

