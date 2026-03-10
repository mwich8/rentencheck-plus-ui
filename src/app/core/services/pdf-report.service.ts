import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { PensionInput } from '../models/pension-input.model';
import { PensionResult } from '../models/pension-result.model';
import { RentenScoreService, RentenScore } from './renten-score.service';
import { SavingsCalculatorService } from './savings-calculator.service';
import { DEFAULT_ANNUAL_ETF_RETURN, DEFAULT_PAYOUT_YEARS } from '../constants/calculator-defaults.const';

type RGB = [number, number, number];

/**
 * Generates a professional, visually polished PDF report from pension
 * calculation results.  Runs 100 % client-side — no data leaves the browser.
 */
@Injectable({ providedIn: 'root' })
export class PdfReportService {
  private readonly scoreService = inject(RentenScoreService);
  private readonly savingsService = inject(SavingsCalculatorService);

  /* ── design tokens ─────────────────────────────────────── */
  private readonly c = {
    navy:       [15,  52,  96]  as RGB,
    navyLight:  [26,  82, 118] as RGB,
    accent:     [41, 128, 185] as RGB,
    danger:     [231, 76,  60] as RGB,
    dangerBg:   [253, 237, 236] as RGB,
    success:    [39, 174,  96] as RGB,
    successBg:  [235, 250, 242] as RGB,
    warning:    [243, 156,  18] as RGB,
    warningBg:  [255, 248, 230] as RGB,
    text:       [33,  37,  41] as RGB,
    textSec:    [108, 117, 125] as RGB,
    muted:      [160, 165, 170] as RGB,
    bg:         [248, 249, 250] as RGB,
    card:       [255, 255, 255] as RGB,
    border:     [222, 226, 230] as RGB,
    white:      [255, 255, 255] as RGB,
  };

  private readonly PW  = 210;
  private readonly PH  = 297;
  private readonly M   = 20;
  private readonly CW  = 170;           // PW − 2·M
  private readonly MID = 105;           // PW / 2

  /* ── public API ────────────────────────────────────────── */

  /** Override in tests to inject a custom jsPDF instance. */
  protected createDoc(): jsPDF {
    return new jsPDF('p', 'mm', 'a4');
  }

  generateReport(input: PensionInput, result: PensionResult): void {
    const doc   = this.createDoc();
    const score = this.scoreService.computeScore(result, input.gewuenschteMonatlicheRente);

    /* page 1 — overview */
    let y = this.headerBar(doc, true);
    y = this.heroBlock(doc, y);
    y = this.inputBox(doc, y, input);
    y = this.kpiCards(doc, y, result, score);
    y = this.gapBanner(doc, y, result, score);
    y = this.deductionTable(doc, y, result);
    this.footer(doc);

    /* page 2 — score & inflation */
    doc.addPage();
    y = this.headerBar(doc, false, 'Renten-Score & Inflationsprognose');
    y = this.scoreGauge(doc, y, score);
    y = this.inflationChart(doc, y, result);
    y = this.inflationTable(doc, y, result);
    this.footer(doc);

    /* page 3 — actions & legal */
    doc.addPage();
    y = this.headerBar(doc, false, 'Handlungsempfehlungen & Rechtliches');
    y = this.savingsComparison(doc, y, result);
    y = this.tipCards(doc, y, result, input);
    y = this.affiliateBox(doc, y, result);
    y = this.disclaimer(doc, y);
    this.footer(doc);

    const d = new Date().toISOString().slice(0, 10);
    doc.save(`RentenCheck-Plus-Report_${d}.pdf`);
  }

  /* ═══════════════════════════════════════════════════════════
     REUSABLE PRIMITIVES
     ═══════════════════════════════════════════════════════════ */

  /** Rounded card with a 0.5 mm offset shadow. */
  private card(doc: jsPDF, x: number, y: number, w: number, h: number, fill: RGB = this.c.card): void {
    doc.setFillColor(228, 230, 234);
    doc.roundedRect(x + 0.5, y + 0.7, w, h, 3, 3, 'F');
    doc.setFillColor(...fill);
    doc.setDrawColor(...this.c.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  }

  /** Coloured accent strip on the left edge of a card. */
  private accentStrip(doc: jsPDF, x: number, y: number, h: number, color: RGB): void {
    doc.setFillColor(...color);
    doc.roundedRect(x + 0.6, y + 1, 2.2, h - 2, 1, 1, 'F');
  }

  /** Section heading: accent dot · title · subtitle. */
  private heading(doc: jsPDF, y: number, title: string, sub: string): number {
    doc.setFillColor(...this.c.accent);
    doc.circle(this.M + 2.5, y + 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.c.navy);
    doc.text(title, this.M + 8, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...this.c.textSec);
    doc.text(sub, this.M + 8, y + 10);
    return y + 16;
  }

  /** Semi‑circle arc built from triangle pairs (gauge). */
  private arc(doc: jsPDF, cx: number, cy: number,
              ro: number, ri: number,
              sDeg: number, eDeg: number, color: RGB): void {
    const n = Math.max(30, Math.round(Math.abs(eDeg - sDeg) / 1.5));
    const r = (d: number) => d * Math.PI / 180;
    doc.setFillColor(...color);
    for (let i = 0; i < n; i++) {
      const a1 = r(sDeg + (i / n) * (eDeg - sDeg));
      const a2 = r(sDeg + ((i + 1) / n) * (eDeg - sDeg));
      const ox1 = cx + Math.cos(a1) * ro, oy1 = cy + Math.sin(a1) * ro;
      const ox2 = cx + Math.cos(a2) * ro, oy2 = cy + Math.sin(a2) * ro;
      const ix2 = cx + Math.cos(a2) * ri, iy2 = cy + Math.sin(a2) * ri;
      const ix1 = cx + Math.cos(a1) * ri, iy1 = cy + Math.sin(a1) * ri;
      doc.triangle(ox1, oy1, ox2, oy2, ix1, iy1, 'F');
      doc.triangle(ox2, oy2, ix2, iy2, ix1, iy1, 'F');
    }
  }

  /* ═══════════════════════════════════════════════════════════
     PAGE FURNITURE — header bar, footer
     ═══════════════════════════════════════════════════════════ */

  private headerBar(doc: jsPDF, main: boolean, subtitle?: string): number {
    const h = main ? 42 : 16;

    doc.setFillColor(...this.c.navy);
    doc.rect(0, 0, this.PW, h, 'F');
    if (main) { doc.setFillColor(...this.c.navyLight); doc.rect(0, h - 5, this.PW, 5, 'F'); }
    doc.setFillColor(...this.c.danger);
    doc.rect(0, h, this.PW, 1, 'F');

    /* brand */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(main ? 22 : 10);
    doc.setTextColor(...this.c.white);
    const by = main ? 18 : 11;
    doc.text('RentenCheck', this.M, by);
    doc.setTextColor(...this.c.danger);
    doc.text('+', this.M + doc.getTextWidth('RentenCheck'), by);

    if (main) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(190, 200, 215);
      doc.text('Ihre pers\u00f6nliche Rentenanalyse', this.M, 27);
      const ds = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.setFontSize(8); doc.setTextColor(160, 175, 195);
      doc.text(ds, this.PW - this.M, 18, { align: 'right' });
      doc.setFontSize(6.5); doc.setTextColor(130, 150, 175);
      doc.text('\u00a732a EStG 2026  \u00b7  KVdR-konform  \u00b7  100 % Datenschutz', this.M, 35);
    } else if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(190, 200, 215);
      doc.text(subtitle, this.PW - this.M, 11, { align: 'right' });
    }

    return h + 8;
  }

  private footer(doc: jsPDF): void {
    const fy = this.PH - 10;
    doc.setDrawColor(...this.c.border); doc.setLineWidth(0.3);
    doc.line(this.M, fy - 3, this.PW - this.M, fy - 3);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...this.c.muted);
    doc.text(
      'RentenCheck+  \u00b7  rentencheck-plus.netlify.app  \u00b7  Marten Wichmann  \u00b7  Colloredostr. 1c, 84453 M\u00fchldorf  \u00b7  marten.wichmann@gmail.com',
      this.M, fy);
    const pn = (doc as any).internal.getCurrentPageInfo().pageNumber;
    const tp = (doc as any).internal.getNumberOfPages();
    doc.text(`Seite ${pn} von ${tp}`, this.PW - this.M, fy, { align: 'right' });
  }

  /* ═══════════════════════════════════════════════════════════
     PAGE 1 — overview
     ═══════════════════════════════════════════════════════════ */

  private heroBlock(doc: jsPDF, y: number): number {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
    doc.setTextColor(...this.c.navy);
    doc.text('Die Wahrheit \u00fcber Ihre Rente', this.M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.setTextColor(...this.c.textSec);
    doc.text('Was von Ihrer gesetzlichen Rente wirklich \u00fcbrig bleibt \u2014 nach Steuern, Sozialabgaben und Inflation.', this.M, y + 6);
    return y + 14;
  }

  private inputBox(doc: jsPDF, y: number, inp: PensionInput): number {
    const h = 32;
    this.card(doc, this.M, y, this.CW, h, this.c.bg);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...this.c.accent);
    doc.text('IHRE EINGABEN', this.M + 7, y + 6);
    doc.setDrawColor(...this.c.accent); doc.setLineWidth(0.3);
    doc.line(this.M + 7, y + 7.5, this.M + 42, y + 7.5);

    const data: [string, string][] = [
      ['Bruttorente',     this.eur(inp.bruttoMonatlicheRente) + ' /Monat'],
      ['Wunscheinkommen', this.eur(inp.gewuenschteMonatlicheRente) + ' /Monat'],
      ['Aktuelles Alter', `${inp.aktuellesAlter} Jahre`],
      ['Rentenbeginn',    `${inp.rentenbeginnJahr}`],
      ['Inflation',       `${(inp.inflationsrate * 100).toFixed(1)} % p.a.`],
      ['Kinder',          inp.hatKinder ? 'Ja' : 'Nein (PV-Zuschlag)'],
    ];

    /* 3 columns with explicit x-positions for proper separation */
    const colPositions = [this.M + 7, this.M + 64, this.M + 121];
    const rowSpacing = 9;

    data.forEach((d, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = colPositions[col];
      const ry = y + 13 + row * rowSpacing;

      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      doc.setTextColor(...this.c.muted);
      doc.text(d[0], cx, ry);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.setTextColor(...this.c.text);
      doc.text(d[1], cx, ry + 4);
    });
    return y + h + 5;
  }

  private kpiCards(doc: jsPDF, y: number, r: PensionResult, sc: RentenScore): number {
    const gap = 4;
    const cw  = (this.CW - gap * 3) / 4;
    const ch  = 36;
    const kpis: { label: string; val: string; sub: string; col: RGB }[] = [
      { label: 'BRUTTORENTE',    val: this.eur(r.bruttoMonatlich),        sub: 'monatlich',                                                    col: this.c.navy },
      { label: 'NETTORENTE',     val: this.eur(r.nettoMonatlich),         sub: `${((r.nettoMonatlich / r.bruttoMonatlich) * 100).toFixed(1)} % v. Brutto`, col: this.c.accent },
      { label: 'KAUFKRAFT',      val: this.eur(r.realeKaufkraftMonatlich),sub: `nach ${r.inflationsVerlauf.length} J. Inflation`,               col: r.realeKaufkraftMonatlich < r.nettoMonatlich * 0.7 ? this.c.danger : this.c.warning },
      { label: 'RENTEN-SCORE',   val: `${sc.score} / 100`,               sub: `Note ${sc.grade} \u2014 ${sc.label}`,                           col: this.hexToRgb(sc.color) },
    ];
    kpis.forEach((k, i) => {
      const x = this.M + i * (cw + gap);
      this.card(doc, x, y, cw, ch);
      /* top accent */
      doc.setFillColor(...k.col);
      doc.roundedRect(x + 1, y + 0.6, cw - 2, 2.2, 1, 1, 'F');
      /* label */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5);
      doc.setTextColor(...this.c.muted);
      doc.text(k.label, x + cw / 2, y + 10, { align: 'center' });
      /* value */
      doc.setFontSize(12); doc.setTextColor(...k.col);
      doc.text(k.val, x + cw / 2, y + 19, { align: 'center' });
      /* sub */
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6);
      doc.setTextColor(...this.c.muted);
      doc.text(k.sub, x + cw / 2, y + 26, { align: 'center' });
    });
    return y + ch + 5;
  }

  private gapBanner(doc: jsPDF, y: number, r: PensionResult, sc: RentenScore): number {
    if (r.rentenluecke > 0) {
      const h = 16;
      this.card(doc, this.M, y, this.CW, h, this.c.dangerBg);
      this.accentStrip(doc, this.M, y, h, this.c.danger);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
      doc.setTextColor(...this.c.danger);
      doc.text(`Monatliche Rentenl\u00fccke: ${this.eur(r.rentenluecke)}`, this.MID, y + 7, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.setTextColor(...this.c.textSec);
      doc.text(`Deckungsquote ${r.deckungsquote.toFixed(1)} %  \u00b7  Besser als ${sc.percentile} % der Deutschen`, this.MID, y + 13, { align: 'center' });
      return y + h + 6;
    }
    const h = 12;
    this.card(doc, this.M, y, this.CW, h, this.c.successBg);
    this.accentStrip(doc, this.M, y, h, this.c.success);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.setTextColor(...this.c.success);
    doc.text('Keine Rentenl\u00fccke \u2014 Ihre Rente deckt Ihren Wunsch!', this.MID, y + 8, { align: 'center' });
    return y + h + 6;
  }

  private deductionTable(doc: jsPDF, y: number, r: PensionResult): number {
    y = this.heading(doc, y, 'Abzugs\u00fcbersicht', 'Monatliche Abz\u00fcge von Ihrer Bruttorente');

    /* column positions */
    const c0 = this.M + 4, c1 = this.M + 72, c2 = this.M + 112, c3 = this.M + 144;
    const rh = 8;

    /* header row */
    doc.setFillColor(...this.c.navy);
    doc.roundedRect(this.M, y, this.CW, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...this.c.white);
    doc.text('Abzugsposten', c0, y + 5.5);
    doc.text('Typ', c1, y + 5.5);
    doc.text('Betrag', c2, y + 5.5);
    doc.text('Anteil', c3, y + 5.5);
    y += 10;

    const tl: Record<string, string> = { steuer: 'Steuer', sozial: 'Sozialabgabe', inflation: 'Kaufkraftverlust' };

    r.abzuege.forEach((a, i) => {
      const ry = y + i * rh;
      if (i % 2 === 0) { doc.setFillColor(...this.c.bg); doc.rect(this.M, ry - 1.5, this.CW, rh, 'F'); }

      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...this.c.text);
      doc.text(a.label, c0, ry + 4);

      doc.setFontSize(6.5); doc.setTextColor(...this.c.muted);
      doc.text(tl[a.typ] ?? a.typ, c1, ry + 4);

      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...this.c.danger);
      doc.text(`\u2013 ${this.eur(a.betrag)}`, c2, ry + 4);

      /* mini bar */
      const bw = Math.min(18, (a.prozent / 30) * 18);
      doc.setFillColor(...this.hexToRgb(a.farbe));
      doc.roundedRect(c3, ry + 0.5, bw, 4.5, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...this.c.text);
      doc.text(`${a.prozent.toFixed(1)} %`, c3 + 20, ry + 4);
    });

    y += r.abzuege.length * rh + 2;

    /* total row */
    doc.setFillColor(...this.c.navy);
    doc.roundedRect(this.M, y, this.CW, 9, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...this.c.white);
    doc.text('GESAMT ABZ\u00dcGE', c0, y + 6);
    doc.text(`\u2013 ${this.eur(r.gesamtAbzuegeMonatlich)}`, c2, y + 6);
    const tp = r.bruttoMonatlich > 0 ? ((r.gesamtAbzuegeMonatlich / r.bruttoMonatlich) * 100).toFixed(1) : '0.0';
    doc.text(`${tp} %`, c3, y + 6);
    y += 14;

    /* divider */
    doc.setDrawColor(...this.c.border); doc.setLineWidth(0.2);
    doc.line(this.M + 20, y - 2, this.PW - this.M - 20, y - 2);

    /* net result */
    const nh = 13;
    this.card(doc, this.M, y, this.CW, nh, this.c.successBg);
    this.accentStrip(doc, this.M, y, nh, this.c.success);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...this.c.success);
    doc.text(`Verbleibende Netto-Rente: ${this.eur(r.nettoMonatlich)} / Monat`, this.MID, y + 9, { align: 'center' });
    return y + nh + 4;
  }

  /* ═══════════════════════════════════════════════════════════
     PAGE 2 — score gauge, inflation chart + table
     ═══════════════════════════════════════════════════════════ */

  private scoreGauge(doc: jsPDF, y: number, sc: RentenScore): number {
    y = this.heading(doc, y, 'Ihr Renten-Score', 'Gesamtbewertung Ihrer Rentensituation');

    const cardH = 72;
    this.card(doc, this.M, y, this.CW, cardH);

    const cx = this.MID, cy = y + 32;
    const oR = 28, iR = 20;
    const col = this.hexToRgb(sc.color);

    /* track + fill */
    this.arc(doc, cx, cy, oR, iR, 180, 360, this.c.bg);
    const deg = (sc.score / 100) * 180;
    if (deg > 0) this.arc(doc, cx, cy, oR, iR, 180, 180 + deg, col);

    /* needle tick mark */
    const needleAngle = (180 + deg) * Math.PI / 180;
    const midR = (oR + iR) / 2;
    doc.setFillColor(...this.c.text);
    doc.circle(cx + Math.cos(needleAngle) * midR, cy + Math.sin(needleAngle) * midR, 1.5, 'F');

    /* score text */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...col);
    doc.text(`${sc.score}`, cx, cy - 4, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...this.c.muted);
    doc.text('von 100', cx, cy + 2, { align: 'center' });

    /* scale labels */
    doc.setFontSize(6);
    doc.text('0', cx - oR - 3, cy + 4);
    doc.text('100', cx + oR + 1, cy + 4);

    /* grade badge */
    const by = cy + 9;
    const bw = 46;
    doc.setFillColor(...col);
    doc.roundedRect(cx - bw / 2, by, bw, 10, 3, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...this.c.white);
    doc.text(`Note ${sc.grade} \u2014 ${sc.label}`, cx, by + 7, { align: 'center' });

    /* percentile */
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...this.c.textSec);
    doc.text(`Besser als ${sc.percentile} % der Deutschen (basierend auf Deckungsquote)`, cx, by + 17, { align: 'center' });

    return y + cardH + 6;
  }

  private inflationChart(doc: jsPDF, y: number, r: PensionResult): number {
    y = this.heading(doc, y, 'Kaufkraftverlauf', 'Wie Inflation Ihre Rente \u00fcber die Jahre entwertet');

    const proj = r.inflationsVerlauf;
    if (!proj.length) return y;

    const cx = this.M + 12, cw = this.CW - 24, ch = 45;
    this.card(doc, this.M, y - 2, this.CW, ch + 16, this.c.card);

    const maxV = r.nettoMonatlich * 1.05;
    const minV = Math.min(...proj.map(p => p.realMonatlich)) * 0.92;
    const range = maxV - minV || 1;
    const projDivisor = proj.length > 1 ? proj.length - 1 : 1;

    /* grid */
    for (let i = 0; i <= 4; i++) {
      const gy = y + (i / 4) * ch;
      doc.setDrawColor(...this.c.border); doc.setLineWidth(0.12); doc.line(cx, gy, cx + cw, gy);
      const v = maxV - (i / 4) * range;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(...this.c.muted);
      doc.text(this.eurShort(v), cx - 2, gy + 1.5, { align: 'right' });
    }

    /* area fill between lines */
    const step = Math.max(1, Math.floor(proj.length / 40));
    let pnx = 0, pny = 0, prx = 0, pry = 0;
    proj.forEach((p, i) => {
      if (i % step !== 0 && i !== proj.length - 1) return;
      const px = cx + (i / projDivisor) * cw;
      const ny = y + ((maxV - p.nominalMonatlich) / range) * ch;
      const ry = y + ((maxV - p.realMonatlich) / range) * ch;
      if (i > 0) {
        /* area (light danger fill) */
        doc.setFillColor(253, 230, 230);
        doc.triangle(pnx, pny, px, ny, px, ry, 'F');
        doc.triangle(pnx, pny, pnx, pry, px, ry, 'F');
        /* nominal line */
        doc.setDrawColor(...this.c.accent); doc.setLineWidth(0.5);
        doc.line(pnx, pny, px, ny);
        /* real line */
        doc.setDrawColor(...this.c.danger); doc.setLineWidth(0.9);
        doc.line(prx, pry, px, ry);
      }
      pnx = px; pny = ny; prx = px; pry = ry;
    });

    /* x-axis labels */
    [0, Math.floor(proj.length / 2), proj.length - 1].forEach(idx => {
      const lx = cx + (idx / projDivisor) * cw;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...this.c.muted);
      doc.text(`${proj[idx].jahr}`, lx, y + ch + 4, { align: 'center' });
    });

    /* legend */
    const ly = y + ch + 9;
    doc.setFillColor(...this.c.accent); doc.rect(this.M + 32, ly - 1, 8, 1.8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...this.c.textSec);
    doc.text('Nominale Rente', this.M + 42, ly);
    doc.setFillColor(...this.c.danger); doc.rect(this.M + 85, ly - 1, 8, 1.8, 'F');
    doc.text('Reale Kaufkraft', this.M + 95, ly);

    return ly + 8;
  }

  private inflationTable(doc: jsPDF, y: number, r: PensionResult): number {
    y = this.heading(doc, y, 'Inflationstabelle', 'Detaillierte Jahres\u00fcbersicht');

    const c = {
      j: this.M + 4, a: this.M + 22, n: this.M + 40,
      r: this.M + 76, v: this.M + 112, p: this.M + 148,
    };

    doc.setFillColor(...this.c.navy);
    doc.roundedRect(this.M, y, this.CW, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...this.c.white);
    doc.text('Jahr', c.j, y + 5); doc.text('Alter', c.a, y + 5);
    doc.text('Nominal (mtl.)', c.n, y + 5); doc.text('Kaufkraft (mtl.)', c.r, y + 5);
    doc.text('Verlust (mtl.)', c.v, y + 5); doc.text('Verlust %', c.p, y + 5);
    y += 9;

    const proj = r.inflationsVerlauf;
    const rows = proj.filter((_, i) => i === 0 || i === proj.length - 1 || (i + 1) % 5 === 0);

    rows.forEach((p, i) => {
      if (y > 260) return;
      if (i % 2 === 0) { doc.setFillColor(...this.c.bg); doc.rect(this.M, y - 1.5, this.CW, 6.5, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...this.c.text);
      doc.text(`${p.jahr}`, c.j, y + 3); doc.text(`${p.alter}`, c.a, y + 3);
      doc.text(this.eur(p.nominalMonatlich), c.n, y + 3);
      const last = i === rows.length - 1;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(last ? this.c.danger : this.c.text));
      doc.text(this.eur(p.realMonatlich), c.r, y + 3);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...this.c.textSec);
      doc.text(`\u2013 ${this.eur(p.kaufkraftVerlust)}`, c.v, y + 3);
      const vp = p.nominalMonatlich > 0 ? ((p.kaufkraftVerlust / p.nominalMonatlich) * 100).toFixed(1) : '0.0';
      doc.text(`\u2013 ${vp} %`, c.p, y + 3);
      y += 6.5;
    });
    y += 3;

    const last = proj[proj.length - 1];
    if (last) {
      const h = 14;
      this.card(doc, this.M, y, this.CW, h, this.c.warningBg);
      this.accentStrip(doc, this.M, y, h, this.c.warning);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...this.c.warning);
      doc.text(`Nach ${proj.length} Jahren: ${this.eur(r.nettoMonatlich)} haben nur noch ${this.eur(last.realMonatlich)} Kaufkraft`, this.MID, y + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...this.c.textSec);
      const vp = ((last.kaufkraftVerlust / last.nominalMonatlich) * 100).toFixed(1);
      doc.text(`Kaufkraftverlust: ${this.eur(last.kaufkraftVerlust)} /Monat (${vp} %)`, this.MID, y + 11.5, { align: 'center' });
      y += h + 6;
    }
    return y;
  }

  /* ═══════════════════════════════════════════════════════════
     PAGE 3 — savings, tips, disclaimer
     ═══════════════════════════════════════════════════════════ */

  private savingsComparison(doc: jsPDF, y: number, r: PensionResult): number {
    if (r.rentenluecke <= 0 || r.jahresBisRente <= 0) return y;

    y = this.heading(doc, y, 'Sparplan-Vergleich',
      `Zwei Wege, Ihre L\u00fccke von ${this.eur(r.rentenluecke)} / Monat zu schlie\u00dfen \u2014 w\u00e4hlen Sie einen:`);

    const etfM = Math.round(this.savingsService.calculateRequiredMonthlySavings(r.rentenluecke, DEFAULT_ANNUAL_ETF_RETURN, r.jahresBisRente, DEFAULT_PAYOUT_YEARS));
    const savM = Math.round(this.savingsService.calculateRequiredMonthlySavings(r.rentenluecke, 0.015, r.jahresBisRente, DEFAULT_PAYOUT_YEARS));
    const etfP = this.savingsService.calculateFutureValue(etfM, DEFAULT_ANNUAL_ETF_RETURN, r.jahresBisRente, DEFAULT_PAYOUT_YEARS);
    const savP = this.savingsService.calculateFutureValue(savM, 0.015, r.jahresBisRente, DEFAULT_PAYOUT_YEARS);

    const gap = 14;
    const hw = (this.CW - gap) / 2;
    const ch = 48;

    /* ETF card */
    this.card(doc, this.M, y, hw, ch, this.c.successBg);
    doc.setFillColor(...this.c.success);
    doc.roundedRect(this.M + 1, y + 0.8, hw - 2, 2, 1, 1, 'F');
    let cx = this.M + hw / 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...this.c.success);
    doc.text('OPTION A', cx, y + 8, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('ETF-SPARPLAN (\u00d8 7 % P.A.)', cx, y + 13, { align: 'center' });
    doc.setFontSize(16);
    doc.text(this.eur(etfM), cx, y + 23, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...this.c.textSec);
    doc.text('pro Monat ben\u00f6tigt', cx, y + 28, { align: 'center' });
    doc.setFontSize(6.5); doc.setTextColor(...this.c.text);
    doc.text(`Endkapital: ${this.eur(etfP.endkapital)}`, cx, y + 35, { align: 'center' });
    doc.text(`Eigenanteil: ${this.eur(etfP.eigenanteil)}`, cx, y + 40, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...this.c.success);
    doc.text(`Rendite: +${this.eur(etfP.renditeErtrag)}`, cx, y + 45, { align: 'center' });

    /* ODER divider */
    const divX = this.M + hw + gap / 2;
    const divCy = y + ch / 2;
    doc.setDrawColor(...this.c.border); doc.setLineWidth(0.3);
    doc.line(divX, y + 6, divX, divCy - 6);
    doc.line(divX, divCy + 6, divX, y + ch - 6);
    doc.setFillColor(...this.c.navy);
    doc.circle(divX, divCy, 5.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...this.c.white);
    doc.text('ODER', divX, divCy + 1.5, { align: 'center' });

    /* Sparkonto card */
    const sx = this.M + hw + gap;
    this.card(doc, sx, y, hw, ch, this.c.warningBg);
    doc.setFillColor(...this.c.warning);
    doc.roundedRect(sx + 1, y + 0.8, hw - 2, 2, 1, 1, 'F');
    cx = sx + hw / 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5); doc.setTextColor(...this.c.warning);
    doc.text('OPTION B', cx, y + 8, { align: 'center' });
    doc.setFontSize(6.5);
    doc.text('SPARKONTO (\u00d8 1,5 % P.A.)', cx, y + 13, { align: 'center' });
    doc.setFontSize(16);
    doc.text(this.eur(savM), cx, y + 23, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...this.c.textSec);
    doc.text('pro Monat ben\u00f6tigt', cx, y + 28, { align: 'center' });
    doc.setFontSize(6.5); doc.setTextColor(...this.c.text);
    doc.text(`Endkapital: ${this.eur(savP.endkapital)}`, cx, y + 35, { align: 'center' });
    doc.text(`Eigenanteil: ${this.eur(savP.eigenanteil)}`, cx, y + 40, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...this.c.warning);
    doc.text(`Rendite: +${this.eur(savP.renditeErtrag)}`, cx, y + 45, { align: 'center' });

    y += ch + 3;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(6); doc.setTextColor(...this.c.muted);
    doc.text(`* Bei ${r.jahresBisRente} Jahren Ansparzeit und 25 Jahren Auszahlung. Keine Anlageberatung \u2014 historische Durchschnittswerte.`, this.MID, y, { align: 'center' });
    return y + 8;
  }

  private tipCards(doc: jsPDF, y: number, r: PensionResult, inp: PensionInput): number {
    y = this.heading(doc, y, 'Pers\u00f6nliche Tipps', 'Konkrete n\u00e4chste Schritte f\u00fcr Ihre Altersvorsorge');

    const tips: { letter: string; title: string; body: string; col: RGB }[] = [];
    if (r.rentenluecke > 0 && r.jahresBisRente > 0)
      tips.push({ letter: 'E', title: 'ETF-Sparplan starten',             body: `Mit einem monatlichen Sparplan k\u00f6nnen Sie den Zinseszinseffekt \u00fcber ${r.jahresBisRente} Jahre nutzen.`, col: this.c.success });
    if (r.jahresBisRente > 5)
      tips.push({ letter: 'Z', title: 'Zeit ist Ihr Verb\u00fcndeter',    body: `Sie haben noch ${r.jahresBisRente} Jahre \u2014 jeder Monat fr\u00fcher spart sp\u00e4ter tausende Euro.`, col: this.c.accent });
    if (r.rentenluecke > 500)
      tips.push({ letter: 'S', title: 'Staatliche F\u00f6rderung pr\u00fcfen', body: 'Bei gr\u00f6\u00dferen L\u00fccken lohnen sich Riester-/R\u00fcrup-Vertr\u00e4ge mit Steuervorteilen.', col: this.c.navy });
    if (r.deckungsquote < 50)
      tips.push({ letter: '!', title: 'Beratung empfohlen',               body: `Mit nur ${r.deckungsquote.toFixed(0)} % Deckung ist eine individuelle Beratung sinnvoll.`, col: this.c.danger });
    if (inp.hatKinder)
      tips.push({ letter: 'K', title: 'Kindererziehungszeiten pr\u00fcfen', body: 'F\u00fcr Kindererziehung k\u00f6nnen bis zu 3 Rentenpunkte pro Kind (ca. +111 \u20ac/Monat) gutgeschrieben werden. Antrag per Formular V0800 bei der DRV.', col: this.c.accent });
    tips.push({ letter: '+', title: '1\u20132 Jahre l\u00e4nger arbeiten', body: 'Jedes Extra-Arbeitsjahr erh\u00f6ht die Rente und verk\u00fcrzt die Bezugsdauer \u2014 doppelter Effekt.', col: this.c.warning });

    const th = 14, tg = 3, max = Math.min(tips.length, 5);
    for (let i = 0; i < max; i++) {
      if (y + th > 235) break;
      const t = tips[i], ty = y + i * (th + tg);
      this.card(doc, this.M, ty, this.CW, th);
      /* icon circle */
      doc.setFillColor(...t.col);
      doc.circle(this.M + 11, ty + th / 2, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...this.c.white);
      doc.text(t.letter, this.M + 11, ty + th / 2 + 1.8, { align: 'center' });
      /* text */
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...this.c.navy);
      doc.text(t.title, this.M + 22, ty + 5.5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...this.c.textSec);
      doc.text(t.body, this.M + 22, ty + 10.5, { maxWidth: this.CW - 28 });
    }

    y += max * (th + tg);

    /* advisory note */
    doc.setFont('helvetica', 'italic'); doc.setFontSize(6); doc.setTextColor(...this.c.muted);
    doc.text('F\u00fcr individuelle Beratung wenden Sie sich an einen qualifizierten Steuer- oder Rentenberater.', this.MID, y + 2, { align: 'center' });

    return y + 8;
  }

  /**
   * Affiliate CTA box — only shown when user has a pension gap.
   * Labeled as "Anzeige" per German UWG/TMG requirements.
   */
  private affiliateBox(doc: jsPDF, y: number, result: PensionResult): number {
    if (result.rentenluecke <= 0) return y;
    if (y > 235) { doc.addPage(); y = this.headerBar(doc, false, 'Nächste Schritte'); }

    const h = 22;
    this.card(doc, this.M, y, this.CW, h, [245, 249, 255] as RGB);

    // "Anzeige" label
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5);
    doc.setTextColor(...this.c.muted);
    doc.text('Anzeige', this.M + 4, y + 4);

    // Icon — draw a small depot icon (jsPDF can't render emoji)
    const ix = this.M + 5;
    const iy = y + 8;
    doc.setFillColor(...this.c.accent);
    doc.roundedRect(ix, iy, 8, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text('\u20ac', ix + 2.8, iy + 5.5);

    // Text
    const tx = this.M + 16;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.setTextColor(...this.c.navy);
    doc.text('N\u00e4chster Schritt: Kostenloses Depot er\u00f6ffnen', tx, y + 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    doc.setTextColor(...this.c.textSec);
    doc.text('Starten Sie Ihren ETF-Sparplan \u2014 bei vielen Anbietern dauerhaft geb\u00fchrenfrei.', tx, y + 14.5);

    // CTA URL
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...this.c.accent);
    const url = 'https://refnocode.trade.re/xmgb600n';
    doc.textWithLink('Jetzt Depot er\u00f6ffnen \u2192', tx, y + 19, { url });

    return y + h + 4;
  }

  private disclaimer(doc: jsPDF, y: number): number {
    if (y > 210) { doc.addPage(); y = this.headerBar(doc, false, 'Rechtliche Hinweise'); }

    y = this.heading(doc, y, 'Rechtliche Hinweise', 'Bitte lesen Sie die folgenden Hinweise sorgf\u00e4ltig');

    const h = 52;
    this.card(doc, this.M, y, this.CW, h, this.c.bg);
    this.accentStrip(doc, this.M, y, h, this.c.navy);

    const tx = this.M + 10;
    const tw = this.CW - 16;
    let ty = y + 7;

    /* block 1 — general */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
    doc.setTextColor(...this.c.navy);
    doc.text('Allgemeiner Hinweis', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...this.c.textSec);
    doc.text('Dieser Report wurde von RentenCheck+ erstellt und dient ausschlie\u00dflich der allgemeinen Information.', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('Er stellt keine individuelle Steuer-, Finanz- oder Rechtsberatung dar.', tx, ty, { maxWidth: tw });
    ty += 5;

    /* block 2 — legal basis */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...this.c.navy);
    doc.text('Berechnungsgrundlagen', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...this.c.textSec);
    doc.text('\u00a732a EStG 2025/2026, KVdR-Beitragss\u00e4tze (GKV-Spitzenverband), \u00a722 Nr. 1 EStG', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('(Besteuerungsanteil, Wachstumschancengesetz), \u00a755 SGB XI (Pflegeversicherung).', tx, ty, { maxWidth: tw });
    ty += 5;

    /* block 3 — exclusions */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...this.c.navy);
    doc.text('Nicht ber\u00fccksichtigt', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...this.c.textSec);
    doc.text('Ehegatten-Splitting, weitere Eink\u00fcnfte, Kirchensteuer, PKV, Grundrentenzuschlag,', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('Schwerbehinderung, regionale Zusatzbeitr\u00e4ge. Ergebnisse sind Orientierungswerte.', tx, ty, { maxWidth: tw });
    ty += 5;

    /* block 4 — investment disclaimer */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5); doc.setTextColor(...this.c.navy);
    doc.text('Renditehinweis', tx, ty);
    ty += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...this.c.textSec);
    doc.text('Renditeangaben (7 % / 1,5 % p.a.) sind historische Durchschnittswerte und keine Garantie f\u00fcr', tx, ty, { maxWidth: tw });
    ty += 3;
    doc.text('zuk\u00fcnftige Ertr\u00e4ge. Kapitalanlagen unterliegen Risiken einschlie\u00dflich Totalverlust.', tx, ty, { maxWidth: tw });

    return y + h + 4;
  }

  /* ═══════════════════════════════════════════════════════════
     FORMATTERS
     ═══════════════════════════════════════════════════════════ */

  private eur(v: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  }
  private eurShort(v: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
  }
  private hexToRgb(hex: string): RGB {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
  }
}









