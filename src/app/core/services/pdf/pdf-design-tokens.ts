import { jsPDF } from 'jspdf';

/** RGB tuple type used across all PDF drawing utilities. */
export type RGB = [number, number, number];

/**
 * Shared design tokens for the PDF report.
 * Centralised so every page builder uses the same visual language.
 */
export const PDF_COLORS = {
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
} as const;

/** Page dimension constants (A4 portrait, mm). */
export const PDF_LAYOUT = {
  /** Page width */
  PW:  210,
  /** Page height */
  PH:  297,
  /** Margin */
  M:   20,
  /** Content width (PW − 2·M) */
  CW:  170,
  /** Horizontal midpoint (PW / 2) */
  MID: 105,
} as const;

/** Shorthand type for the jsPDF document instance. */
export type PdfDoc = jsPDF;

