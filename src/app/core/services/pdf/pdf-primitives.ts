import { RGB, PDF_COLORS, PDF_LAYOUT, PdfDoc } from './pdf-design-tokens';

const { M, PW, PH } = PDF_LAYOUT;
const c = PDF_COLORS;

/**
 * Low-level reusable drawing primitives for the PDF report.
 * Every method is static and side-effect-free (operates on the passed jsPDF doc).
 */
export class PdfPrimitives {

  /** Rounded card with a 0.5 mm offset shadow. */
  static card(doc: PdfDoc, x: number, y: number, w: number, h: number, fill: RGB = c.card): void {
    doc.setFillColor(228, 230, 234);
    doc.roundedRect(x + 0.5, y + 0.7, w, h, 3, 3, 'F');
    doc.setFillColor(...fill);
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 3, 3, 'FD');
  }

  /** Coloured accent strip on the left edge of a card. */
  static accentStrip(doc: PdfDoc, x: number, y: number, h: number, color: RGB): void {
    doc.setFillColor(...color);
    doc.roundedRect(x + 0.6, y + 1, 2.2, h - 2, 1, 1, 'F');
  }

  /** Section heading: accent dot · title · subtitle. Returns new Y position. */
  static heading(doc: PdfDoc, y: number, title: string, sub: string): number {
    doc.setFillColor(...c.accent);
    doc.circle(M + 2.5, y + 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.navy);
    doc.text(title, M + 8, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...c.textSec);
    doc.text(sub, M + 8, y + 10);
    return y + 16;
  }

  /** Semi-circle arc built from triangle pairs (used for the gauge). */
  static arc(doc: PdfDoc, cx: number, cy: number,
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

  /** Navy header bar with brand name. Returns new Y position below the bar. */
  static headerBar(doc: PdfDoc, main: boolean, subtitle?: string, reportId?: string): number {
    const h = main ? 42 : 16;

    doc.setFillColor(...c.navy);
    doc.rect(0, 0, PW, h, 'F');
    if (main) { doc.setFillColor(...c.navyLight); doc.rect(0, h - 5, PW, 5, 'F'); }
    doc.setFillColor(...c.danger);
    doc.rect(0, h, PW, 1, 'F');

    /* brand */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(main ? 22 : 10);
    doc.setTextColor(...c.white);
    const by = main ? 18 : 11;
    doc.text('RentenCheck', M, by);
    doc.setTextColor(...c.danger);
    doc.text('+', M + doc.getTextWidth('RentenCheck'), by);

    if (main) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(190, 200, 215);
      doc.text('Ihre pers\u00f6nliche Rentenanalyse', M, 27);
      const ds = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
      doc.setFontSize(8); doc.setTextColor(160, 175, 195);
      doc.text(ds, PW - M, 18, { align: 'right' });

      /* Report-ID on page 1 header — for purchase recovery */
      if (reportId) {
        doc.setFontSize(6); doc.setTextColor(130, 150, 175);
        doc.text(`Report-ID: ${reportId}`, PW - M, 24, { align: 'right' });
      }

      doc.setFontSize(6.5); doc.setTextColor(130, 150, 175);
      doc.text('\u00a732a EStG 2026  \u00b7  KVdR-konform  \u00b7  100 % Datenschutz', M, 35);
    } else if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(190, 200, 215);
      doc.text(subtitle, PW - M, 11, { align: 'right' });
    }

    return h + 8;
  }

  /** Page footer with branding, report ID and page number. */
  static footer(doc: PdfDoc, reportId?: string): void {
    const fy = PH - 10;
    doc.setDrawColor(...c.border); doc.setLineWidth(0.3);
    doc.line(M, fy - 3, PW - M, fy - 3);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(5.5); doc.setTextColor(...c.muted);

    const footerLeft = reportId
      ? `RentenCheck+  \u00b7  rentencheckplus.de  \u00b7  Report-ID: ${reportId}`
      : 'RentenCheck+  \u00b7  rentencheckplus.de  \u00b7  Alle Berechnungen gem\u00e4\u00df \u00a732a EStG  \u00b7  Keine Finanz- oder Steuerberatung';
    doc.text(footerLeft, M, fy);

    const pn = (doc as unknown as { internal: { getCurrentPageInfo(): { pageNumber: number } } }).internal.getCurrentPageInfo().pageNumber;
    const tp = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages();
    doc.text(`Seite ${pn} von ${tp}`, PW - M, fy, { align: 'right' });
  }
}

