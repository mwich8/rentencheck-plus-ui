import { PDF_COLORS, PDF_LAYOUT, PdfDoc } from './pdf-design-tokens';
import { PdfPrimitives } from './pdf-primitives';
import { PdfFormatters } from './pdf-formatters';
import { PensionInput } from '../../models/pension-input.model';
import { PensionResult } from '../../models/pension-result.model';
import { RentenScore } from '../renten-score.service';

const { M, CW, MID } = PDF_LAYOUT;
const c = PDF_COLORS;

/**
 * Builds all sections for page 1 of the PDF report (overview).
 * Stateless — every method takes the doc + data and returns the new Y position.
 */
export class PdfPage1Builder {

  static heroBlock(doc: PdfDoc, y: number): number {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.setTextColor(...c.navy);
    doc.text('Die Wahrheit \u00fcber Ihre Rente', M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(...c.textSec);
    doc.text('Was von Ihrer gesetzlichen Rente wirklich \u00fcbrig bleibt \u2014 nach Steuern, Sozialabgaben und Inflation.', M, y + 6);
    return y + 14;
  }

  static inputBox(doc: PdfDoc, y: number, inp: PensionInput): number {
    const h = 32;
    PdfPrimitives.card(doc, M, y, CW, h, c.bg);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...c.accent);
    doc.text('IHRE EINGABEN', M + 7, y + 6);
    doc.setDrawColor(...c.accent); doc.setLineWidth(0.3);
    doc.line(M + 7, y + 7.5, M + 42, y + 7.5);

    const data: [string, string][] = [
      ['Bruttorente',     PdfFormatters.eur(inp.bruttoMonatlicheRente) + ' /Monat'],
      ['Wunscheinkommen', PdfFormatters.eur(inp.gewuenschteMonatlicheRente) + ' /Monat'],
      ['Aktuelles Alter', `${inp.aktuellesAlter} Jahre`],
      ['Rentenbeginn',    `${inp.rentenbeginnJahr}`],
      ['Inflation',       `${(inp.inflationsrate * 100).toFixed(1)} % p.a.`],
      ['Kinder',          inp.hatKinder ? 'Ja' : 'Nein (PV-Zuschlag)'],
    ];

    const colPositions = [M + 7, M + 64, M + 121];
    const rowSpacing = 9;

    data.forEach((d, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = colPositions[col];
      const ry = y + 13 + row * rowSpacing;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      doc.setTextColor(...c.muted);
      doc.text(d[0], cx, ry);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.setTextColor(...c.text);
      doc.text(d[1], cx, ry + 4);
    });
    return y + h + 5;
  }

  static kpiCards(doc: PdfDoc, y: number, r: PensionResult, sc: RentenScore): number {
    const gap = 4;
    const cw  = (CW - gap * 3) / 4;
    const ch  = 36;
    const kpis: { label: string; val: string; sub: string; col: [number, number, number] }[] = [
      { label: 'BRUTTORENTE',    val: PdfFormatters.eur(r.bruttoMonatlich),         sub: 'monatlich',                                                              col: c.navy },
      { label: 'NETTORENTE',     val: PdfFormatters.eur(r.nettoMonatlich),          sub: `${((r.nettoMonatlich / r.bruttoMonatlich) * 100).toFixed(1)} % v. Brutto`, col: c.accent },
      { label: 'KAUFKRAFT',      val: PdfFormatters.eur(r.realeKaufkraftMonatlich), sub: `nach ${r.inflationsVerlauf.length} J. Inflation`,                         col: r.realeKaufkraftMonatlich < r.nettoMonatlich * 0.7 ? c.danger : c.warning },
      { label: 'RENTEN-SCORE',   val: `${sc.score} / 100`,                         sub: `Note ${sc.grade} \u2014 ${sc.label}`,                                    col: PdfFormatters.hexToRgb(sc.color) },
    ];
    kpis.forEach((k, i) => {
      const x = M + i * (cw + gap);
      PdfPrimitives.card(doc, x, y, cw, ch);
      /* top accent */
      doc.setFillColor(...k.col);
      doc.roundedRect(x + 1, y + 0.6, cw - 2, 2.2, 1, 1, 'F');
      /* label */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5);
      doc.setTextColor(...c.muted);
      doc.text(k.label, x + cw / 2, y + 10, { align: 'center' });
      /* value */
      doc.setFontSize(12); doc.setTextColor(...k.col);
      doc.text(k.val, x + cw / 2, y + 19, { align: 'center' });
      /* sub */
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.setTextColor(...c.muted);
      doc.text(k.sub, x + cw / 2, y + 26, { align: 'center' });
    });
    return y + ch + 5;
  }

  static gapBanner(doc: PdfDoc, y: number, r: PensionResult, sc: RentenScore): number {
    if (r.rentenluecke > 0) {
      const h = 16;
      PdfPrimitives.card(doc, M, y, CW, h, c.dangerBg);
      PdfPrimitives.accentStrip(doc, M, y, h, c.danger);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
      doc.setTextColor(...c.danger);
      doc.text(`Monatliche Rentenl\u00fccke: ${PdfFormatters.eur(r.rentenluecke)}`, MID, y + 7, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.setTextColor(...c.textSec);
      doc.text(`Deckungsquote ${r.deckungsquote.toFixed(1)} %  \u00b7  Besser als ${sc.percentile} % der Deutschen`, MID, y + 13, { align: 'center' });
      return y + h + 6;
    }
    const h = 12;
    PdfPrimitives.card(doc, M, y, CW, h, c.successBg);
    PdfPrimitives.accentStrip(doc, M, y, h, c.success);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.setTextColor(...c.success);
    doc.text('Keine Rentenl\u00fccke \u2014 Ihre Rente deckt Ihren Wunsch!', MID, y + 8, { align: 'center' });
    return y + h + 6;
  }

  static deductionTable(doc: PdfDoc, y: number, r: PensionResult): number {
    y = PdfPrimitives.heading(doc, y, 'Abzugs\u00fcbersicht', 'Monatliche Abz\u00fcge von Ihrer Bruttorente');

    const c0 = M + 4, c1 = M + 72, c2 = M + 112, c3 = M + 144;
    const rh = 8;

    /* header row */
    doc.setFillColor(...c.navy);
    doc.roundedRect(M, y, CW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
    doc.text('Abzugsposten', c0, y + 5.5);
    doc.text('Typ', c1, y + 5.5);
    doc.text('Betrag', c2, y + 5.5);
    doc.text('Anteil', c3, y + 5.5);
    y += 10;

    const tl: Record<string, string> = { steuer: 'Steuer', sozial: 'Sozialabgabe', inflation: 'Kaufkraftverlust' };

    r.abzuege.forEach((a, i) => {
      const ry = y + i * rh;
      if (i % 2 === 0) { doc.setFillColor(...c.bg); doc.rect(M, ry - 1.5, CW, rh, 'F'); }

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...c.text);
      doc.text(a.label, c0, ry + 4);

      doc.setFontSize(6.5); doc.setTextColor(...c.muted);
      doc.text(tl[a.typ] ?? a.typ, c1, ry + 4);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.danger);
      doc.text(`\u2013 ${PdfFormatters.eur(a.betrag)}`, c2, ry + 4);

      /* mini bar */
      const bw = Math.min(18, (a.prozent / 30) * 18);
      doc.setFillColor(...PdfFormatters.hexToRgb(a.farbe));
      doc.roundedRect(c3, ry + 0.5, bw, 4.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...c.text);
      doc.text(`${a.prozent.toFixed(1)} %`, c3 + 20, ry + 4);
    });

    y += r.abzuege.length * rh + 2;

    /* total row */
    doc.setFillColor(...c.navy);
    doc.roundedRect(M, y, CW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.white);
    doc.text('GESAMT ABZ\u00dcGE', c0, y + 6);
    doc.text(`\u2013 ${PdfFormatters.eur(r.gesamtAbzuegeMonatlich)}`, c2, y + 6);
    const tp = r.bruttoMonatlich > 0 ? ((r.gesamtAbzuegeMonatlich / r.bruttoMonatlich) * 100).toFixed(1) : '0.0';
    doc.text(`${tp} %`, c3, y + 6);
    y += 14;

    /* divider */
    doc.setDrawColor(...c.border); doc.setLineWidth(0.2);
    doc.line(M + 20, y - 2, PDF_LAYOUT.PW - M - 20, y - 2);

    /* net result */
    const nh = 13;
    PdfPrimitives.card(doc, M, y, CW, nh, c.successBg);
    PdfPrimitives.accentStrip(doc, M, y, nh, c.success);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...c.success);
    doc.text(`Verbleibende Netto-Rente: ${PdfFormatters.eur(r.nettoMonatlich)} / Monat`, MID, y + 9, { align: 'center' });
    return y + nh + 4;
  }
}

