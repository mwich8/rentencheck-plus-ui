import { jsPDF, GState } from 'jspdf';
import { PDF_COLORS, PDF_LAYOUT, PdfDoc, RGB } from './pdf-design-tokens';
import { PdfPrimitives } from './pdf-primitives';
import { PdfPage1Builder } from './pdf-page1-builder';
import { PensionInput } from '../../models/pension-input.model';
import { PensionResult } from '../../models/pension-result.model';
import { RentenScore } from '../renten-score.service';

const { M, CW, PW, PH } = PDF_LAYOUT;
const c = PDF_COLORS;

/**
 * Builds a 1-page watermarked preview PDF.
 * Shows real KPI data from the user's calculation to demonstrate value,
 * but redacts/blurs the detailed deduction table and adds a prominent
 * "VORSCHAU" watermark + CTA for the full report.
 */
export class PdfPreviewBuilder {

  /**
   * Generate a complete 1-page preview PDF and return it as a Blob.
   */
  static generate(input: PensionInput, result: PensionResult, score: RentenScore): Blob {
    const doc = new jsPDF('p', 'mm', 'a4') as PdfDoc;

    // Page 1 content — real data visible
    let y = PdfPrimitives.headerBar(doc, true);
    y = PdfPage1Builder.heroBlock(doc, y);
    y = PdfPage1Builder.inputBox(doc, y, input);
    y = PdfPage1Builder.kpiCards(doc, y, result, score);
    y = PdfPage1Builder.gapBanner(doc, y, result, score);

    // Redacted deduction table placeholder
    y = PdfPreviewBuilder.redactedTable(doc, y, result);

    // CTA card for full report
    PdfPreviewBuilder.ctaCard(doc, y);

    // Diagonal watermark overlay
    PdfPreviewBuilder.watermark(doc);

    // Footer
    PdfPrimitives.footer(doc);

    return doc.output('blob');
  }

  /**
   * Redacted deduction table — shows structure but blurs values.
   */
  static redactedTable(doc: PdfDoc, y: number, r: PensionResult): number {
    y = PdfPrimitives.heading(doc, y, 'Abzugsübersicht', 'Monatliche Abzüge von Ihrer Bruttorente');

    const c0 = M + 4, c1 = M + 72, c2 = M + 112, c3 = M + 144;

    // Header row (real)
    doc.setFillColor(...c.navy);
    doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
    doc.text('Abzugsposten', c0, y + 5.5);
    doc.text('Typ', c1, y + 5.5);
    doc.text('Betrag', c2, y + 5.5);
    doc.text('Anteil', c3, y + 5.5);
    y += 10;

    // Blurred rows — show labels but redact values
    const gState = new GState({ opacity: 0.35 });

    r.abzuege.forEach((a, i) => {
      const ry = y + i * 8;
      if (i % 2 === 0) {
        doc.setFillColor(...c.bg);
        doc.rect(M, ry - 1.5, CW, 8, 'F');
      }

      // Label visible
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.text);
      doc.text(a.label, c0, ry + 4);

      // Type visible
      const tl: Record<string, string> = { steuer: 'Steuer', sozial: 'Sozialabgabe', inflation: 'Kaufkraftverlust' };
      doc.setFontSize(6.5); doc.setTextColor(...c.muted);
      doc.text(tl[a.typ] ?? a.typ, c1, ry + 4);

      // Values blurred — redaction bars
      doc.saveGraphicsState();
      doc.setGState(gState);
      doc.setFillColor(180, 185, 195);
      doc.roundedRect(c2, ry + 0.5, 22, 5, 2, 2, 'F');
      doc.roundedRect(c3, ry + 0.5, 16, 5, 2, 2, 'F');
      doc.restoreGraphicsState();
    });

    y += r.abzuege.length * 8 + 2;

    // Total row (redacted)
    doc.setFillColor(...c.navy);
    doc.roundedRect(M, y, CW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.white);
    doc.text('GESAMT ABZÜGE', c0, y + 6);
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.4 }));
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(c2, y + 1.5, 22, 5, 2, 2, 'F');
    doc.roundedRect(c3, y + 1.5, 16, 5, 2, 2, 'F');
    doc.restoreGraphicsState();

    return y + 14;
  }

  /**
   * CTA card at the bottom urging purchase of the full report.
   */
  static ctaCard(doc: PdfDoc, y: number): void {
    const ch = 32;
    const ctaY = Math.max(y + 4, PH - 52);

    // Card background
    PdfPrimitives.card(doc, M, ctaY, CW, ch, [255, 251, 235] as RGB);
    PdfPrimitives.accentStrip(doc, M, ctaY, ch, c.warning);

    // Lock icon + title
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(...c.navy);
    doc.text('🔒  Vollständigen Report freischalten', M + 10, ctaY + 10);

    // Description
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.setTextColor(...c.textSec);
    doc.text('30-Jahre-Inflationsprognose · Detaillierte Steuerberechnung · ETF-Sparplan-Empfehlung', M + 10, ctaY + 17);
    doc.text('Persönliche Handlungsempfehlungen · Multi-Szenario-Vergleich', M + 10, ctaY + 23);

    // CTA button
    const bw = 50, bh = 8;
    const bx = PW - M - bw - 6;
    const by = ctaY + 10;
    doc.setFillColor(...c.navy);
    doc.roundedRect(bx, by, bw, bh, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.white);
    doc.text('rentencheckplus.de/rechner', bx + bw / 2, by + 5.5, { align: 'center' });
  }

  /**
   * Large diagonal "VORSCHAU" watermark across the entire page.
   */
  static watermark(doc: PdfDoc): void {
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.07 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(72);
    doc.setTextColor(15, 52, 96);

    // Rotate and place text diagonally
    const cx = PW / 2;
    const cy = PH / 2;
    doc.text('VORSCHAU', cx, cy, {
      align: 'center',
      angle: 45,
    });

    doc.restoreGraphicsState();
  }
}


