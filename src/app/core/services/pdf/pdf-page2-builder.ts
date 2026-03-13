import { PDF_COLORS, PDF_LAYOUT, PdfDoc } from './pdf-design-tokens';
import { PdfPrimitives } from './pdf-primitives';
import { PdfFormatters } from './pdf-formatters';
import { PensionResult } from '../../models/pension-result.model';
import { RentenScore } from '../renten-score.service';

const { M, CW, MID } = PDF_LAYOUT;
const c = PDF_COLORS;

/**
 * Builds all sections for page 2 of the PDF report (score gauge & inflation).
 */
export class PdfPage2Builder {

  static scoreGauge(doc: PdfDoc, y: number, sc: RentenScore): number {
    y = PdfPrimitives.heading(doc, y, 'Ihr Renten-Score', 'Gesamtbewertung Ihrer Rentensituation');

    const cardH = 72;
    PdfPrimitives.card(doc, M, y, CW, cardH);

    const cx = MID, cy = y + 32;
    const oR = 28, iR = 20;
    const col = PdfFormatters.hexToRgb(sc.color);

    /* track + fill */
    PdfPrimitives.arc(doc, cx, cy, oR, iR, 180, 360, c.bg);
    const deg = (sc.score / 100) * 180;
    if (deg > 0) PdfPrimitives.arc(doc, cx, cy, oR, iR, 180, 180 + deg, col);

    /* needle tick mark */
    const needleAngle = (180 + deg) * Math.PI / 180;
    const midR = (oR + iR) / 2;
    doc.setFillColor(...c.text);
    doc.circle(cx + Math.cos(needleAngle) * midR, cy + Math.sin(needleAngle) * midR, 1.5, 'F');

    /* score text */
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(...col);
    doc.text(`${sc.score}`, cx, cy - 4, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...c.muted);
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
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...c.white);
    doc.text(`Note ${sc.grade} \u2014 ${sc.label}`, cx, by + 7, { align: 'center' });

    /* percentile */
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...c.textSec);
    doc.text(`Besser als ${sc.percentile} % der Deutschen (basierend auf Deckungsquote)`, cx, by + 17, { align: 'center' });

    return y + cardH + 6;
  }

  static inflationChart(doc: PdfDoc, y: number, r: PensionResult): number {
    y = PdfPrimitives.heading(doc, y, 'Kaufkraftverlauf', 'Wie Inflation Ihre Rente \u00fcber die Jahre entwertet');

    const proj = r.inflationsVerlauf;
    if (!proj.length) return y;

    const cx = M + 12, cw = CW - 24, ch = 45;
    PdfPrimitives.card(doc, M, y - 2, CW, ch + 16, c.card);

    const maxV = r.nettoMonatlich * 1.05;
    const minV = Math.min(...proj.map(p => p.realMonatlich)) * 0.92;
    const range = maxV - minV || 1;
    const projDivisor = proj.length > 1 ? proj.length - 1 : 1;

    /* grid */
    for (let i = 0; i <= 4; i++) {
      const gy = y + (i / 4) * ch;
      doc.setDrawColor(...c.border); doc.setLineWidth(0.12); doc.line(cx, gy, cx + cw, gy);
      const v = maxV - (i / 4) * range;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5); doc.setTextColor(...c.muted);
      doc.text(PdfFormatters.eurShort(v), cx - 2, gy + 1.5, { align: 'right' });
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
        doc.setDrawColor(...c.accent); doc.setLineWidth(0.5);
        doc.line(pnx, pny, px, ny);
        /* real line */
        doc.setDrawColor(...c.danger); doc.setLineWidth(0.9);
        doc.line(prx, pry, px, ry);
      }
      pnx = px; pny = ny; prx = px; pry = ry;
    });

    /* x-axis labels */
    [0, Math.floor(proj.length / 2), proj.length - 1].forEach(idx => {
      const lx = cx + (idx / projDivisor) * cw;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...c.muted);
      doc.text(`${proj[idx].jahr}`, lx, y + ch + 4, { align: 'center' });
    });

    /* legend */
    const ly = y + ch + 9;
    doc.setFillColor(...c.accent); doc.rect(M + 32, ly - 1, 8, 1.8, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(...c.textSec);
    doc.text('Nominale Rente', M + 42, ly);
    doc.setFillColor(...c.danger); doc.rect(M + 85, ly - 1, 8, 1.8, 'F');
    doc.text('Reale Kaufkraft', M + 95, ly);

    return ly + 8;
  }

  static inflationTable(doc: PdfDoc, y: number, r: PensionResult): number {
    y = PdfPrimitives.heading(doc, y, 'Inflationstabelle', 'Detaillierte Jahres\u00fcbersicht');

    const cols = {
      j: M + 4, a: M + 22, n: M + 40,
      r: M + 76, v: M + 112, p: M + 148,
    };

    doc.setFillColor(...c.navy);
    doc.roundedRect(M, y, CW, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(...c.white);
    doc.text('Jahr', cols.j, y + 5); doc.text('Alter', cols.a, y + 5);
    doc.text('Nominal (mtl.)', cols.n, y + 5); doc.text('Kaufkraft (mtl.)', cols.r, y + 5);
    doc.text('Verlust (mtl.)', cols.v, y + 5); doc.text('Verlust %', cols.p, y + 5);
    y += 9;

    const proj = r.inflationsVerlauf;
    const rows = proj.filter((_, i) => i === 0 || i === proj.length - 1 || (i + 1) % 5 === 0);

    rows.forEach((p, i) => {
      if (y > 260) return;
      if (i % 2 === 0) { doc.setFillColor(...c.bg); doc.rect(M, y - 1.5, CW, 6.5, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.text);
      doc.text(`${p.jahr}`, cols.j, y + 3); doc.text(`${p.alter}`, cols.a, y + 3);
      doc.text(PdfFormatters.eur(p.nominalMonatlich), cols.n, y + 3);
      const last = i === rows.length - 1;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...(last ? c.danger : c.text));
      doc.text(PdfFormatters.eur(p.realMonatlich), cols.r, y + 3);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...c.textSec);
      doc.text(`\u2013 ${PdfFormatters.eur(p.kaufkraftVerlust)}`, cols.v, y + 3);
      const vp = p.nominalMonatlich > 0 ? ((p.kaufkraftVerlust / p.nominalMonatlich) * 100).toFixed(1) : '0.0';
      doc.text(`\u2013 ${vp} %`, cols.p, y + 3);
      y += 6.5;
    });
    y += 3;

    const last = proj[proj.length - 1];
    if (last) {
      const h = 14;
      PdfPrimitives.card(doc, M, y, CW, h, c.warningBg);
      PdfPrimitives.accentStrip(doc, M, y, h, c.warning);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...c.warning);
      doc.text(`Nach ${proj.length} Jahren: ${PdfFormatters.eur(r.nettoMonatlich)} haben nur noch ${PdfFormatters.eur(last.realMonatlich)} Kaufkraft`, MID, y + 6, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...c.textSec);
      const vp = ((last.kaufkraftVerlust / last.nominalMonatlich) * 100).toFixed(1);
      doc.text(`Kaufkraftverlust: ${PdfFormatters.eur(last.kaufkraftVerlust)} /Monat (${vp} %)`, MID, y + 11.5, { align: 'center' });
      y += h + 6;
    }
    return y;
  }
}

