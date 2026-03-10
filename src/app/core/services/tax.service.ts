import { Injectable } from '@angular/core';
import { getTaxConfig, TaxBracketConfig, SteuerJahr, LATEST_STEUER_JAHR } from '../constants/tax-brackets.const';

export interface TaxResult {
  einkommensteuer: number;
  solidaritaetszuschlag: number;
  gesamtSteuer: number;
  grenzsteuersatz: number;
  durchschnittssteuersatz: number;
}

/**
 * Calculates German income tax (Einkommensteuer) according to §32a EStG.
 *
 * The formula uses a piecewise progressive function:
 * - Zone 1: Tax-free up to Grundfreibetrag
 * - Zone 2: Linear-progressive 14%→24% (quadratic formula)
 * - Zone 3: Linear-progressive 24%→42% (quadratic formula)
 * - Zone 4: Proportional at 42%
 * - Zone 5: "Reichensteuer" at 45%
 *
 * Solidaritätszuschlag: 5.5% of ESt, with Freigrenze and Gleitzone.
 */
@Injectable({ providedIn: 'root' })
export class TaxService {
  /**
   * Calculate income tax for a given taxable income (zu versteuerndes Einkommen).
   * @param zvE Annual taxable income in EUR (already after Freibeträge)
   * @param year Tax year (2025 or 2026)
   * @returns Detailed tax result
   */
  calculateIncomeTax(zvE: number, year: SteuerJahr = LATEST_STEUER_JAHR): TaxResult {
    const config: TaxBracketConfig = getTaxConfig(year);
    // Round down to full EUR as per §32a Abs. 1 EStG
    const zvEGerundet: number = Math.floor(zvE);

    let einkommensteuer: number = this.computeESt(zvEGerundet, config);
    einkommensteuer = Math.floor(einkommensteuer); // ESt is rounded down to full EUR

    const solidaritaetszuschlag: number = this.computeSoli(einkommensteuer, config);

    const gesamtSteuer: number = einkommensteuer + solidaritaetszuschlag;
    const durchschnittssteuersatz: number = zvEGerundet > 0 ? einkommensteuer / zvEGerundet : 0;
    const grenzsteuersatz: number = this.computeGrenzsteuersatz(zvEGerundet, config);

    return {
      einkommensteuer,
      solidaritaetszuschlag,
      gesamtSteuer,
      grenzsteuersatz,
      durchschnittssteuersatz,
    };
  }

  /**
   * Core §32a formula — piecewise progressive tax
   */
  private computeESt(zvE: number, c: TaxBracketConfig): number {
    if (zvE <= c.grundfreibetrag) {
      // Zone 1: No tax
      return 0;
    }

    if (zvE <= c.zone2Upper) {
      // Zone 2: 14% → ~24% linear-progressive
      const y: number = (zvE - c.grundfreibetrag) / 10_000;
      return (c.zone2FactorA * y + c.zone2FactorB) * y;
    }

    if (zvE <= c.zone3Upper) {
      // Zone 3: ~24% → 42% linear-progressive
      const z: number = (zvE - c.zone2Upper) / 10_000;
      return (c.zone3FactorA * z + c.zone3FactorB) * z + c.zone3ConstC;
    }

    if (zvE <= c.zone4Upper) {
      // Zone 4: Proportional 42%
      return c.zone4Rate * zvE - c.zone4Subtract;
    }

    // Zone 5: Proportional 45% ("Reichensteuer")
    return c.zone5Rate * zvE - c.zone5Subtract;
  }

  /**
   * Solidaritätszuschlag calculation.
   * - Below Freigrenze: 0
   * - In Gleitzone: capped at soliGleitzone% of (ESt - Freigrenze)
   * - Above Gleitzone: full 5.5% of ESt
   *
   * Since 2021, the Soli Freigrenze is high enough that most taxpayers
   * (especially retirees with moderate pensions) pay no Soli at all.
   */
  private computeSoli(est: number, c: TaxBracketConfig): number {
    if (est <= c.soliFreigrenze) {
      return 0;
    }

    const fullSoli: number = est * c.soliRate;
    const gleitzoneSoli: number = (est - c.soliFreigrenze) * (c.soliGleitzone / 100);

    // In the Gleitzone, Soli is capped at the gleitzone amount
    const soli: number = Math.min(fullSoli, gleitzoneSoli);
    return Math.round(soli * 100) / 100; // Round to cents
  }

  /**
   * Marginal tax rate at a given income level
   */
  private computeGrenzsteuersatz(zvE: number, c: TaxBracketConfig): number {
    if (zvE <= c.grundfreibetrag) return 0;
    if (zvE <= c.zone2Upper) {
      const y: number = (zvE - c.grundfreibetrag) / 10_000;
      return (2 * c.zone2FactorA * y + c.zone2FactorB) / 10_000;
    }
    if (zvE <= c.zone3Upper) {
      const z: number = (zvE - c.zone2Upper) / 10_000;
      return (2 * c.zone3FactorA * z + c.zone3FactorB) / 10_000;
    }
    if (zvE <= c.zone4Upper) return c.zone4Rate;
    return c.zone5Rate;
  }
}

