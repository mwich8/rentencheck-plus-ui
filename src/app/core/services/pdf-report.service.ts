import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { PensionInput } from '../models/pension-input.model';
import { PensionResult } from '../models/pension-result.model';
import { RentenScoreService } from './renten-score.service';
import { SavingsCalculatorService } from './savings-calculator.service';
import { PdfPrimitives } from './pdf/pdf-primitives';
import { PdfPage1Builder } from './pdf/pdf-page1-builder';
import { PdfPage2Builder } from './pdf/pdf-page2-builder';
import { PdfPage3Builder } from './pdf/pdf-page3-builder';

/**
 * Generates a professional, visually polished PDF report from pension
 * calculation results.  Runs 100 % client-side — no data leaves the browser.
 *
 * This service is a thin orchestrator that delegates page rendering to
 * dedicated builder classes:
 * - {@link PdfPage1Builder} — Overview (hero, inputs, KPIs, deductions)
 * - {@link PdfPage2Builder} — Score gauge & inflation analysis
 * - {@link PdfPage3Builder} — Savings comparison, tips & legal
 *
 * Shared drawing primitives live in {@link PdfPrimitives}, design tokens
 * in `pdf-design-tokens.ts`, and formatters in {@link PdfFormatters}.
 */
@Injectable({ providedIn: 'root' })
export class PdfReportService {
  private readonly scoreService = inject(RentenScoreService);
  private readonly savingsService = inject(SavingsCalculatorService);

  /** Override in tests to inject a custom jsPDF instance. */
  protected createDoc(): jsPDF {
    return new jsPDF('p', 'mm', 'a4');
  }

  generateReport(input: PensionInput, result: PensionResult, reportId?: string): void {
    try {
      const doc   = this.createDoc();
      const score = this.scoreService.computeScore(result, input.gewuenschteMonatlicheRente);

      /* page 1 — overview */
      let y = PdfPrimitives.headerBar(doc, true, undefined, reportId);
      y = PdfPage1Builder.heroBlock(doc, y);
      y = PdfPage1Builder.inputBox(doc, y, input);
      y = PdfPage1Builder.kpiCards(doc, y, result, score);
      y = PdfPage1Builder.gapBanner(doc, y, result, score);
      PdfPage1Builder.deductionTable(doc, y, result);
      PdfPrimitives.footer(doc, reportId);

      /* page 2 — score & inflation */
      doc.addPage();
      y = PdfPrimitives.headerBar(doc, false, 'Renten-Score & Inflationsprognose');
      y = PdfPage2Builder.scoreGauge(doc, y, score);
      y = PdfPage2Builder.inflationChart(doc, y, result);
      PdfPage2Builder.inflationTable(doc, y, result);
      PdfPrimitives.footer(doc, reportId);

      /* page 3 — actions & legal */
      doc.addPage();
      y = PdfPrimitives.headerBar(doc, false, 'Handlungsempfehlungen & Rechtliches');
      y = PdfPage3Builder.savingsComparison(doc, y, result, this.savingsService);
      y = PdfPage3Builder.tipCards(doc, y, result, input);
      y = PdfPage3Builder.affiliateBox(doc, y, result);
      PdfPage3Builder.disclaimer(doc, y);
      PdfPrimitives.footer(doc, reportId);

      const d = new Date().toISOString().slice(0, 10);
      doc.save(`RentenCheck-Plus-Report_${d}.pdf`);
    } catch (error) {
      console.error('[RentenCheck+] PDF generation failed:', error);
      throw error; // Re-throw so callers can handle it (e.g. show error UI)
    }
  }
}
