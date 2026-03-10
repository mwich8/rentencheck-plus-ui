/**
 * Domain constants for the pension calculator.
 *
 * These are values that appear in multiple places across the calculation pipeline.
 * Centralizing them here ensures consistency and makes audits/updates trivial.
 */

/**
 * Werbungskostenpauschale for retirees (§9a Nr. 3 EStG).
 * Retirees receive a flat €102 deduction from pension income.
 */
export const WERBUNGSKOSTENPAUSCHALE: number = 102;

/**
 * Sonderausgabenpauschale (§10c EStG).
 * A flat €36 deduction applied to all taxpayers.
 */
export const SONDERAUSGABENPAUSCHALE: number = 36;

/**
 * Standard retirement age in Germany.
 * Since 2031, everyone born after 1964 retires at 67 (§235 SGB VI).
 * Earlier birth years have slightly lower ages, but this calculator
 * uses the standard 67 for simplicity.
 */
export const STANDARD_RENTENALTER: number = 67;

/**
 * Default assumed annual return rate for ETF savings projections.
 * Based on historical MSCI World average (~7% nominal).
 */
export const DEFAULT_ANNUAL_ETF_RETURN: number = 0.07;

/**
 * Default retirement payout period in years.
 * Assumes capital is distributed over 25 years of retirement.
 */
export const DEFAULT_PAYOUT_YEARS: number = 25;

/**
 * Number of years to project in the inflation forecast table.
 */
export const INFLATION_PROJECTION_YEARS: number = 30;

