/**
 * German Income Tax Brackets — §32a EStG
 *
 * The German income tax formula uses a piecewise function with 5 zones.
 * These coefficients are updated annually in the Einkommensteuergesetz.
 *
 * Formula zones (2025):
 * Zone 1: zvE <= 12,084 → ESt = 0 (Grundfreibetrag)
 * Zone 2: 12,085 <= zvE <= 17,005 → ESt = (922.98 * y + 1400) * y
 *         where y = (zvE - 12,084) / 10,000
 * Zone 3: 17,006 <= zvE <= 66,760 → ESt = (181.19 * z + 2397) * z + 1025.38
 *         where z = (zvE - 17,005) / 10,000
 * Zone 4: 66,761 <= zvE <= 277,825 → ESt = 0.42 * zvE - 10,636.31
 * Zone 5: zvE > 277,825 → ESt = 0.45 * zvE - 18,971.06
 *
 * Source: §32a EStG 2025
 */
export interface TaxBracketConfig {
  year: number;
  grundfreibetrag: number;
  zone2Upper: number;
  zone3Upper: number;
  zone4Upper: number;
  zone2FactorA: number;
  zone2FactorB: number;
  zone3FactorA: number;
  zone3FactorB: number;
  zone3ConstC: number;
  zone4Rate: number;
  zone4Subtract: number;
  zone5Rate: number;
  zone5Subtract: number;

  /** Solidaritätszuschlag */
  soliFreigrenze: number;
  soliRate: number;
  soliGleitzone: number;
}

/**
 * Tax configuration for 2025
 * Based on Wachstumschancengesetz / EStG 2025
 */
export const TAX_CONFIG_2025: TaxBracketConfig = {
  year: 2025,
  grundfreibetrag: 12_084,
  zone2Upper: 17_005,
  zone3Upper: 66_760,
  zone4Upper: 277_825,
  zone2FactorA: 922.98,
  zone2FactorB: 1_400,
  zone3FactorA: 181.19,
  zone3FactorB: 2_397,
  zone3ConstC: 1_025.38,
  zone4Rate: 0.42,
  zone4Subtract: 10_636.31,
  zone5Rate: 0.45,
  zone5Subtract: 18_971.06,

  soliFreigrenze: 18_130,
  soliRate: 0.055,
  soliGleitzone: 11.9,
};

/**
 * Tax configuration for 2026 (projected/enacted)
 * Grundfreibetrag raised per Inflationsausgleich
 */
export const TAX_CONFIG_2026: TaxBracketConfig = {
  year: 2026,
  grundfreibetrag: 12_336,
  zone2Upper: 17_443,
  zone3Upper: 68_480,
  zone4Upper: 277_825,
  zone2FactorA: 899.13,
  zone2FactorB: 1_400,
  zone3FactorA: 176.64,
  zone3FactorB: 2_397,
  zone3ConstC: 1_015.94,
  zone4Rate: 0.42,
  zone4Subtract: 10_888.74,
  zone5Rate: 0.45,
  zone5Subtract: 19_223.39,

  soliFreigrenze: 18_130,
  soliRate: 0.055,
  soliGleitzone: 11.9,
};

/** Supported tax-calculation years */
export type SteuerJahr = 2025 | 2026;

/** All supported tax years — add new entries here when legislation is enacted */
export const SUPPORTED_STEUER_JAHRE: readonly SteuerJahr[] = [2025, 2026] as const;

/** The latest (= default) tax year, derived from SUPPORTED_STEUER_JAHRE */
export const LATEST_STEUER_JAHR: SteuerJahr =
  SUPPORTED_STEUER_JAHRE[SUPPORTED_STEUER_JAHRE.length - 1];

/**
 * Helper to get tax config by year
 */
export function getTaxConfig(year: SteuerJahr): TaxBracketConfig {
  return year === 2025 ? TAX_CONFIG_2025 : TAX_CONFIG_2026;
}

