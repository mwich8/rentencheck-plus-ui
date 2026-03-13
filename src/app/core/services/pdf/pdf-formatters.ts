import { RGB } from './pdf-design-tokens';

/**
 * Pure formatting utilities for the PDF report.
 * Stateless, no DI — can be used anywhere.
 */
export class PdfFormatters {

  /** Format a number as EUR currency (e.g. "1.234,56 €"). */
  static eur(v: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(v);
  }

  /** Format a number as EUR without decimals (e.g. "1.235 €"). */
  static eurShort(v: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v);
  }

  /** Convert a hex colour string (e.g. "#e74c3c") to an RGB tuple. */
  static hexToRgb(hex: string): RGB {
    const h = hex.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ];
  }
}

