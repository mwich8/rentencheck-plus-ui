import { LATEST_STEUER_JAHR, SteuerJahr } from '../constants/tax-brackets.const';

/**
 * Input model for the pension calculator.
 * All monetary values are monthly amounts in EUR.
 */
export interface PensionInput {
  /** Projected gross monthly pension from DRV (€/month) */
  bruttoMonatlicheRente: number;

  /** Year of retirement start (e.g. 2030) */
  rentenbeginnJahr: number;

  /** Current age of the user */
  aktuellesAlter: number;

  /** Desired monthly retirement income (€/month) — for gap calculation */
  gewuenschteMonatlicheRente: number;

  /** Expected annual inflation rate (e.g. 0.02 for 2%) */
  inflationsrate: number;

  /** Whether the person has children (affects Pflegeversicherung) */
  hatKinder: boolean;

  /** KVdR Zusatzbeitragssatz (e.g. 0.017 for 1.7%) — defaults to average */
  zusatzbeitragssatz: number;

  /** Tax year to use for calculation */
  steuerJahr: SteuerJahr;
}

/**
 * Default input values for the calculator
 */
export const DEFAULT_PENSION_INPUT: PensionInput = {
  bruttoMonatlicheRente: 1500,
  rentenbeginnJahr: 2058,
  aktuellesAlter: 35,
  gewuenschteMonatlicheRente: 2500,
  inflationsrate: 0.02,
  hatKinder: true,
  zusatzbeitragssatz: 0.017,
  steuerJahr: LATEST_STEUER_JAHR,
};

