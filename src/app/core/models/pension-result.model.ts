/**
 * Detailed result from the pension calculation.
 */
export interface PensionResult {
  /** Gross annual pension */
  bruttoJaehrlich: number;

  /** Gross monthly pension */
  bruttoMonatlich: number;

  /** Taxable share of pension based on Rentenbeginn year (0-1) */
  besteuerungsanteil: number;

  /** Annual taxable pension income (after Freibetrag) */
  zuVersteuerndesEinkommen: number;

  /** Annual Rentenfreibetrag (tax-free portion) */
  rentenfreibetrag: number;

  /** Annual income tax (Einkommensteuer) */
  einkommensteuer: number;

  /** Annual solidarity surcharge (Solidaritätszuschlag) */
  solidaritaetszuschlag: number;

  /** Monthly KVdR contribution (health insurance) */
  kvdrBeitragMonatlich: number;

  /** Monthly Pflegeversicherung contribution (care insurance) */
  pflegeBeitragMonatlich: number;

  /** Total monthly deductions */
  gesamtAbzuegeMonatlich: number;

  /** Net monthly pension after all deductions */
  nettoMonatlich: number;

  /** Real purchasing power after inflation (monthly) */
  realeKaufkraftMonatlich: number;

  /** Pension gap: difference between desired and real purchasing power */
  rentenluecke: number;

  /** Percentage of desired income covered */
  deckungsquote: number;

  /** Years until retirement */
  jahresBisRente: number;

  /** Detailed deduction breakdown for visualization */
  abzuege: DeductionItem[];

  /** Year-by-year inflation projection */
  inflationsVerlauf: InflationProjection[];
}

/**
 * A single deduction item for the waterfall chart
 */
export interface DeductionItem {
  label: string;
  betrag: number;
  prozent: number;
  farbe: string;
  typ: 'steuer' | 'sozial' | 'inflation';
}

/**
 * Year-by-year inflation projection data point
 */
export interface InflationProjection {
  jahr: number;
  alter: number;
  nominalMonatlich: number;
  realMonatlich: number;
  kaufkraftVerlust: number;
}

