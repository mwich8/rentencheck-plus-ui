import { Injectable, inject } from '@angular/core';
import { PensionInput } from '../models/pension-input.model';
import { PensionResult, DeductionItem, InflationProjection } from '../models/pension-result.model';
import { PensionInputValidator } from '../models/pension-input-validator';
import { TaxService, TaxResult } from './tax.service';
import { SocialInsuranceService, SocialInsuranceResult } from './social-insurance.service';
import { InflationService } from './inflation.service';
import { getBesteuerungsanteil } from '../constants/insurance-rates.const';
import {
  WERBUNGSKOSTENPAUSCHALE,
  SONDERAUSGABENPAUSCHALE,
  STANDARD_RENTENALTER,
  INFLATION_PROJECTION_YEARS,
} from '../constants/calculator-defaults.const';

/**
 * Main pension calculator orchestrator.
 *
 * Calculation pipeline:
 * 1. Gross annual pension = monthly × 12
 * 2. Determine Besteuerungsanteil based on Rentenbeginn year
 * 3. Taxable income = gross annual × Besteuerungsanteil
 * 4. Calculate Einkommensteuer + Solidaritätszuschlag on taxable income
 * 5. Calculate KVdR + Pflegeversicherung on gross monthly pension
 * 6. Net monthly = gross monthly - (taxes/12) - social insurance
 * 7. Real purchasing power = net monthly × (1-i)^n (inflation decay)
 * 8. Rentenlücke = desired income - real purchasing power
 */
@Injectable({ providedIn: 'root' })
export class PensionCalculatorService {
  private readonly taxService = inject(TaxService);
  private readonly insuranceService = inject(SocialInsuranceService);
  private readonly inflationService = inject(InflationService);

  /**
   * Run the full pension calculation pipeline.
   * Input is sanitized/clamped before calculation to prevent garbage-in/garbage-out.
   */
  calculate(rawInput: PensionInput): PensionResult {
    // Sanitize input to prevent garbage values from corrupting the pipeline
    const input: PensionInput = PensionInputValidator.sanitize(rawInput);

    const bruttoMonatlich: number = input.bruttoMonatlicheRente;
    const bruttoJaehrlich: number = bruttoMonatlich * 12;

    // Step 1: Determine taxable share of pension
    const besteuerungsanteil: number = getBesteuerungsanteil(input.rentenbeginnJahr);
    const rentenfreibetrag: number = bruttoJaehrlich * (1 - besteuerungsanteil);
    const zuVersteuerndesEinkommen: number = bruttoJaehrlich * besteuerungsanteil;

    // Step 2: Calculate income tax
    // Subtract Werbungskostenpauschale (§9a Nr. 3 EStG) and Sonderausgabenpauschale (§10c EStG)
    const zvE: number = Math.max(0, zuVersteuerndesEinkommen - WERBUNGSKOSTENPAUSCHALE - SONDERAUSGABENPAUSCHALE);

    const taxResult: TaxResult = this.taxService.calculateIncomeTax(zvE, input.steuerJahr);

    // Step 3: Calculate social insurance
    const insuranceResult: SocialInsuranceResult = this.insuranceService.calculate(
      bruttoMonatlich,
      input.hatKinder,
      input.zusatzbeitragssatz,
      input.steuerJahr,
    );

    // Step 4: Compute net monthly pension
    const steuerMonatlich: number = (taxResult.einkommensteuer + taxResult.solidaritaetszuschlag) / 12;
    const gesamtAbzuegeMonatlich: number = steuerMonatlich + insuranceResult.gesamtMonatlich;
    const nettoMonatlich: number = bruttoMonatlich - gesamtAbzuegeMonatlich;

    // Step 5: Calculate years to retirement and inflation impact
    const jahresBisRente: number = Math.max(0, STANDARD_RENTENALTER - input.aktuellesAlter);

    // Inflation decay on the net pension over years until retirement
    const realeKaufkraftMonatlich: number = this.inflationService.computeRealValue(
      nettoMonatlich,
      input.inflationsrate,
      jahresBisRente,
    );

    // Step 6: Compute pension gap
    const rentenluecke: number = Math.max(0, input.gewuenschteMonatlicheRente - realeKaufkraftMonatlich);
    const deckungsquote: number = input.gewuenschteMonatlicheRente > 0
      ? (realeKaufkraftMonatlich / input.gewuenschteMonatlicheRente) * 100
      : 0;

    // Step 7: Build deduction breakdown for visualization
    const abzuege: DeductionItem[] = this.buildDeductionBreakdown(
      bruttoMonatlich,
      taxResult.einkommensteuer / 12,
      taxResult.solidaritaetszuschlag / 12,
      insuranceResult.kvdrMonatlich,
      insuranceResult.pflegeMonatlich,
      nettoMonatlich,
      realeKaufkraftMonatlich,
    );

    // Step 8: Generate inflation projection
    const inflationsVerlauf: InflationProjection[] = this.inflationService.projectInflation(
      nettoMonatlich,
      input.inflationsrate,
      STANDARD_RENTENALTER,
      input.rentenbeginnJahr,
      INFLATION_PROJECTION_YEARS,
    );

    return {
      bruttoJaehrlich,
      bruttoMonatlich,
      besteuerungsanteil,
      zuVersteuerndesEinkommen,
      rentenfreibetrag,
      einkommensteuer: taxResult.einkommensteuer,
      solidaritaetszuschlag: taxResult.solidaritaetszuschlag,
      kvdrBeitragMonatlich: insuranceResult.kvdrMonatlich,
      pflegeBeitragMonatlich: insuranceResult.pflegeMonatlich,
      gesamtAbzuegeMonatlich,
      nettoMonatlich: Math.round(nettoMonatlich * 100) / 100,
      realeKaufkraftMonatlich: Math.round(realeKaufkraftMonatlich * 100) / 100,
      rentenluecke: Math.round(rentenluecke * 100) / 100,
      deckungsquote: Math.round(deckungsquote * 10) / 10,
      jahresBisRente,
      abzuege,
      inflationsVerlauf,
    };
  }


  /**
   * Build the deduction breakdown for the waterfall chart.
   */
  private buildDeductionBreakdown(
    bruttoMonatlich: number,
    estMonatlich: number,
    soliMonatlich: number,
    kvdrMonatlich: number,
    pflegeMonatlich: number,
    nettoMonatlich: number,
    realeKaufkraft: number,
  ): DeductionItem[] {
    const inflationVerlust: number = nettoMonatlich - realeKaufkraft;

    const items: DeductionItem[] = [
      {
        label: 'Einkommensteuer',
        betrag: Math.round(estMonatlich * 100) / 100,
        prozent: bruttoMonatlich > 0 ? Math.round((estMonatlich / bruttoMonatlich) * 1000) / 10 : 0,
        farbe: '#e74c3c',
        typ: 'steuer',
      },
      {
        label: 'Solidaritätszuschlag',
        betrag: Math.round(soliMonatlich * 100) / 100,
        prozent: bruttoMonatlich > 0 ? Math.round((soliMonatlich / bruttoMonatlich) * 1000) / 10 : 0,
        farbe: '#c0392b',
        typ: 'steuer',
      },
      {
        label: 'Krankenversicherung (KVdR)',
        betrag: Math.round(kvdrMonatlich * 100) / 100,
        prozent: bruttoMonatlich > 0 ? Math.round((kvdrMonatlich / bruttoMonatlich) * 1000) / 10 : 0,
        farbe: '#e67e22',
        typ: 'sozial',
      },
      {
        label: 'Pflegeversicherung',
        betrag: Math.round(pflegeMonatlich * 100) / 100,
        prozent: bruttoMonatlich > 0 ? Math.round((pflegeMonatlich / bruttoMonatlich) * 1000) / 10 : 0,
        farbe: '#f39c12',
        typ: 'sozial',
      },
      {
        label: 'Inflationsverlust',
        betrag: Math.round(inflationVerlust * 100) / 100,
        prozent: bruttoMonatlich > 0 ? Math.round((inflationVerlust / bruttoMonatlich) * 1000) / 10 : 0,
        farbe: '#8e44ad',
        typ: 'inflation',
      },
    ];

    return items.filter(item => item.betrag > 0);
  }
}

