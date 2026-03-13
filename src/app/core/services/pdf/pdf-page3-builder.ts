import { PDF_COLORS, PDF_LAYOUT, PdfDoc } from './pdf-design-tokens';
import { PdfPrimitives } from './pdf-primitives';
import { PdfFormatters } from './pdf-formatters';
import { PensionInput } from '../../models/pension-input.model';
import { PensionResult } from '../../models/pension-result.model';
import { SavingsCalculatorService } from '../savings-calculator.service';
import { DEFAULT_ANNUAL_ETF_RETURN, DEFAULT_PAYOUT_YEARS } from '../../constants/calculator-defaults.const';
import { RGB } from './pdf-design-tokens';

const { M, CW, MID } = PDF_LAYOUT;
const c = PDF_COLORS;

/**
 * Builds all sections for page 3 of the PDF report
 * (savings comparison, tips, affiliate, disclaimer).
 */
export class PdfPage3Builder {

  static savingsComparison(doc: PdfDoc, y: number, r: PensionResult, savingsService: SavingsCalculatorService): number {
    if (r.rentenluecke <= 0 || r.jahresBisRente <= 0) return y;

    y = PdfPrimitives.heading(doc, y, 'Sparplan-Vergleich',
      `Zwei Wege, Ihre L\u00fccke von ${PdfFormatters.eur(r.rentenluecke)} / Monat zu schlie\u00dfen \u2014 w\u00e4hlen Sie einen:`);

    const etfM = Math.round(savingsService.calculateRequiredMonthlySavings(r.rentenluecke, DEFAULT_ANNUAL_ETF_RETURN, r.jahresBisRente, DEFAULT_PAYOUT_YEARS));
    const savM = Math.round(savingsService.calculateRequiredMonthlySavings(r.rentenluecke, 0.015, r.jahresBisRente, DEFAULT_PAYOUT_YEARS));
    const etfP = savingsService.calculateFutureValue(etfM, DEFAULT_ANNUAL_ETF_RETURN, r.jahresBisRente, DEFAULT_PAYOUT_YEARS);
    const savP = savingsService.calculateFutureValue(savM, 0.015, r.jahresBisRente, DEFAULT_PAYOUT_YEARS);

    const gap = 14;
    const hw = (CW - gap) / 2;
    const ch = 48;

    /* ETF card */
    PdfPrimitives.card(doc, M, y, hw, ch, c.successBg);
    doc.setFillColor(...c.success);
    doc.roundedRect(M + 1, y + 0.8, hw - 2, 2, 1, 1, 'F');
    let cx = M + hw / 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...c.success);
    doc.text('OPTION A', cx, y + 8, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('ETF-SPARPLAN (\u00d8 7 % P.A.)', cx, y + 13, { align: 'center' });
    doc.setFontSize(16);
    doc.text(PdfFormatters.eur(etfM), cx, y + 23, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textSec);
    doc.text('pro Monat ben\u00f6tigt', cx, y + 28, { align: 'center' });
    doc.setFontSize(6.5); doc.setTextColor(...c.text);
    doc.text(`Endkapital: ${PdfFormatters.eur(etfP.endkapital)}`, cx, y + 35, { align: 'center' });
    doc.text(`Eigenanteil: ${PdfFormatters.eur(etfP.eigenanteil)}`, cx, y + 40, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...c.success);
    doc.text(`Rendite: +${PdfFormatters.eur(etfP.renditeErtrag)}`, cx, y + 45, { align: 'center' });

    /* ODER divider */
    const divX = M + hw + gap / 2;
    const divCy = y + ch / 2;
    doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
    doc.line(divX, y + 6, divX, divCy - 6);
    doc.line(divX, divCy + 6, divX, y + ch - 6);
    doc.setFillColor(...c.navy);
    doc.circle(divX, divCy, 5.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...c.white);
    doc.text('ODER', divX, divCy + 1.5, { align: 'center' });

    /* Sparkonto card */
    const sx = M + hw + gap;
    PdfPrimitives.card(doc, sx, y, hw, ch, c.warningBg);
    doc.setFillColor(...c.warning);
    doc.roundedRect(sx + 1, y + 0.8, hw - 2, 2, 1, 1, 'F');
    cx = sx + hw / 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...c.warning);
    doc.text('OPTION B', cx, y + 8, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('SPARKONTO (\u00d8 1,5 % P.A.)', cx, y + 13, { align: 'center' });
    doc.setFontSize(16);
    doc.text(PdfFormatters.eur(savM), cx, y + 23, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textSec);
    doc.text('pro Monat ben\u00f6tigt', cx, y + 28, { align: 'center' });
    doc.setFontSize(6.5); doc.setTextColor(...c.text);
    doc.text(`Endkapital: ${PdfFormatters.eur(savP.endkapital)}`, cx, y + 35, { align: 'center' });
    doc.text(`Eigenanteil: ${PdfFormatters.eur(savP.eigenanteil)}`, cx, y + 40, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...c.warning);
    doc.text(`Rendite: +${PdfFormatters.eur(savP.renditeErtrag)}`, cx, y + 45, { align: 'center' });

    y += ch + 3;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(6); doc.setTextColor(...c.muted);
    doc.text(`* Bei ${r.jahresBisRente} Jahren Ansparzeit und 25 Jahren Auszahlung. Keine Anlageberatung \u2014 historische Durchschnittswerte.`, MID, y, { align: 'center' });
    return y + 8;
  }

  static tipCards(doc: PdfDoc, y: number, r: PensionResult, inp: PensionInput): number {
    y = PdfPrimitives.heading(doc, y, 'Pers\u00f6nliche Tipps', 'Konkrete n\u00e4chste Schritte f\u00fcr Ihre Altersvorsorge');

    const tips: { letter: string; title: string; body: string; col: RGB }[] = [];
    if (r.rentenluecke > 0 && r.jahresBisRente > 0)
      tips.push({ letter: 'E', title: 'ETF-Sparplan starten',             body: `Mit einem monatlichen Sparplan k\u00f6nnen Sie den Zinseszinseffekt \u00fcber ${r.jahresBisRente} Jahre nutzen.`, col: c.success });
    if (r.jahresBisRente > 5)
      tips.push({ letter: 'Z', title: 'Zeit ist Ihr Verb\u00fcndeter',    body: `Sie haben noch ${r.jahresBisRente} Jahre \u2014 jeder Monat fr\u00fcher spart sp\u00e4ter tausende Euro.`, col: c.accent });
    if (r.rentenluecke > 500)
      tips.push({ letter: 'S', title: 'Staatliche F\u00f6rderung pr\u00fcfen', body: 'Bei gr\u00f6\u00dferen L\u00fccken lohnen sich Riester-/R\u00fcrup-Vertr\u00e4ge mit Steuervorteilen.', col: c.navy });
    if (r.deckungsquote < 50)
      tips.push({ letter: '!', title: 'Beratung empfohlen',               body: `Mit nur ${r.deckungsquote.toFixed(0)} % Deckung ist eine individuelle Beratung sinnvoll.`, col: c.danger });
    if (inp.hatKinder)
      tips.push({ letter: 'K', title: 'Kindererziehungszeiten pr\u00fcfen', body: 'F\u00fcr Kindererziehung k\u00f6nnen bis zu 3 Rentenpunkte pro Kind (ca. +111 \u20ac/Monat) gutgeschrieben werden. Antrag per Formular V0800 bei der DRV.', col: c.accent });
    tips.push({ letter: '+', title: '1\u20132 Jahre l\u00e4nger arbeiten', body: 'Jedes Extra-Arbeitsjahr erh\u00f6ht die Rente und verk\u00fcrzt die Bezugsdauer \u2014 doppelter Effekt.', col: c.warning });

    const th = 14, tg = 3, max = Math.min(tips.length, 5);
    for (let i = 0; i < max; i++) {
      if (y + th > 235) break;
      const t = tips[i], ty = y + i * (th + tg);
      PdfPrimitives.card(doc, M, ty, CW, th);
      /* icon circle */
      doc.setFillColor(...t.col);
      doc.circle(M + 11, ty + th / 2, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...c.white);
      doc.text(t.letter, M + 11, ty + th / 2 + 1.8, { align: 'center' });
      /* text */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.navy);
      doc.text(t.title, M + 22, ty + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textSec);
      doc.text(t.body, M + 22, ty + 10.5, { maxWidth: CW - 28 });
    }

    y += max * (th + tg);

    /* advisory note */
    doc.setFont('helvetica', 'italic'); doc.setFontSize(6); doc.setTextColor(...c.muted);
    doc.text('F\u00fcr individuelle Beratung wenden Sie sich an einen qualifizierten Steuer- oder Rentenberater.', MID, y + 2, { align: 'center' });

    return y + 8;
  }

  /**
   * Affiliate CTA box — only shown when user has a pension gap.
   * Labeled as "Anzeige" per German UWG/TMG requirements.
   */
  static affiliateBox(doc: PdfDoc, y: number, result: PensionResult): number {
    if (result.rentenluecke <= 0) return y;
    if (y > 235) { doc.addPage(); y = PdfPrimitives.headerBar(doc, false, 'Nächste Schritte'); }

    const h = 22;
    PdfPrimitives.card(doc, M, y, CW, h, [245, 249, 255] as RGB);

    // "Anzeige" label
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5);
    doc.setTextColor(...c.muted);
    doc.text('Anzeige', M + 4, y + 4);

    // Icon
    const ix = M + 5;
    const iy = y + 8;
    doc.setFillColor(...c.accent);
    doc.roundedRect(ix, iy, 8, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text('\u20ac', ix + 2.8, iy + 5.5);

    // Text
    const tx = M + 16;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(...c.navy);
    doc.text('N\u00e4chster Schritt: Kostenloses Depot er\u00f6ffnen', tx, y + 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.setTextColor(...c.textSec);
    doc.text('Starten Sie Ihren ETF-Sparplan \u2014 bei vielen Anbietern dauerhaft geb\u00fchrenfrei.', tx, y + 14.5);

    // CTA URL
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...c.accent);
    const url = 'https://refnocode.trade.re/xmgb600n';
    doc.textWithLink('Jetzt Depot er\u00f6ffnen \u2192', tx, y + 19, { url });

    return y + h + 4;
  }

  static disclaimer(doc: PdfDoc, y: number): number {
    if (y > 210) { doc.addPage(); y = PdfPrimitives.headerBar(doc, false, 'Rechtliche Hinweise'); }

    y = PdfPrimitives.heading(doc, y, 'Rechtliche Hinweise', 'Bitte lesen Sie die folgenden Hinweise sorgf\u00e4ltig');

    const h = 52;
    PdfPrimitives.card(doc, M, y, CW, h, c.bg);
    PdfPrimitives.accentStrip(doc, M, y, h, c.navy);

    const tx = M + 10;
    const tw = CW - 16;
    let ty = y + 7;

    /* block 1 — general */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...c.navy);
    doc.text('Allgemeiner Hinweis', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...c.textSec);
    doc.text('Dieser Report wurde von RentenCheck+ erstellt und dient ausschlie\u00dflich der allgemeinen Information.', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('Er stellt keine individuelle Steuer-, Finanz- oder Rechtsberatung dar.', tx, ty, { maxWidth: tw });
    ty += 5;

    /* block 2 — legal basis */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.navy);
    doc.text('Berechnungsgrundlagen', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...c.textSec);
    doc.text('\u00a732a EStG 2025/2026, KVdR-Beitragss\u00e4tze (GKV-Spitzenverband), \u00a722 Nr. 1 EStG', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('(Besteuerungsanteil, Wachstumschancengesetz), \u00a755 SGB XI (Pflegeversicherung).', tx, ty, { maxWidth: tw });
    ty += 5;

    /* block 3 — exclusions */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.navy);
    doc.text('Nicht ber\u00fccksichtigt', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...c.textSec);
    doc.text('Ehegatten-Splitting, weitere Eink\u00fcnfte, Kirchensteuer, PKV, Grundrentenzuschlag,', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('Schwerbehinderung, regionale Zusatzbeitr\u00e4ge. Ergebnisse sind Orientierungswerte.', tx, ty, { maxWidth: tw });
    ty += 5;

    /* block 4 — investment disclaimer */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...c.navy);
    doc.text('Renditehinweis', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...c.textSec);
    doc.text('Renditeangaben (7 % / 1,5 % p.a.) sind historische Durchschnittswerte und keine Garantie f\u00fcr', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('zuk\u00fcnftige Ertr\u00e4ge. Kapitalanlagen unterliegen Risiken einschlie\u00dflich Totalverlust.', tx, ty, { maxWidth: tw });

    return y + h + 4;
  }
}

