import { TestBed } from '@angular/core/testing';
import { PdfReportService } from './pdf-report.service';
import { PensionInput, DEFAULT_PENSION_INPUT } from '../models/pension-input.model';
import { PensionResult, DeductionItem } from '../models/pension-result.model';
import { PensionCalculatorService } from './pension-calculator.service';
import { jsPDF } from 'jspdf';

// ── Helpers ───────────────────────────────────────────────

/**
 * Prevent actual file downloads during tests.
 * jsPDF v4 save() creates an <a> element, sets href to a blob URL, and clicks it.
 * We intercept both URL.createObjectURL and anchor.click.
 */
let renderedTexts: string[] = [];
let savedFilename: string | undefined;

function preventDownloads(): void {
  renderedTexts = [];
  savedFilename = undefined;

  // Intercept URL.createObjectURL to prevent blob creation
  spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');
  spyOn(URL, 'revokeObjectURL');

  // Intercept the <a>.click() to capture the filename and prevent navigation
  const origCreate = document.createElement.bind(document);
  spyOn(document, 'createElement').and.callFake((tag: string, options?: ElementCreationOptions) => {
    const el = origCreate(tag, options);
    if (tag.toLowerCase() === 'a') {
      spyOn(el as HTMLAnchorElement, 'click');
      // Capture the download filename via setAttribute
      const origSetAttr = el.setAttribute.bind(el);
      spyOn(el, 'setAttribute').and.callFake((name: string, value: string) => {
        if (name === 'download') savedFilename = value;
        origSetAttr(name, value);
      });
      // Also intercept direct property assignment: el.download = '...'
      const anchor = el as HTMLAnchorElement;
      Object.defineProperty(anchor, 'download', {
        configurable: true,
        get() { return savedFilename ?? ''; },
        set(v: string) { savedFilename = v; },
      });
    }
    return el;
  });
}

/**
 * Capture all text rendered to the PDF by spying on the service's
 * protected `createDoc()` factory method. Each jsPDF instance returned
 * has its `text()` and `textWithLink()` wrapped to push strings into
 * the module-level `renderedTexts` array.
 */
function installTextCapture(service: PdfReportService): void {
  spyOn(service as any, 'createDoc').and.callFake(() => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Wrap text()
    const origText: Function = doc.text.bind(doc);
    doc.text = function (...args: any[]) {
      if (typeof args[0] === 'string') renderedTexts.push(args[0]);
      return origText(...args);
    } as any;

    // Wrap textWithLink() if present
    const origTWL = (doc as any).textWithLink;
    if (origTWL) {
      const boundTWL: Function = origTWL.bind(doc);
      (doc as any).textWithLink = function (...twlArgs: any[]) {
        if (typeof twlArgs[0] === 'string') renderedTexts.push(twlArgs[0]);
        return boundTWL(...twlArgs);
      };
    }

    return doc;
  });
}

function createMockInput(overrides: Partial<PensionInput> = {}): PensionInput {
  return { ...DEFAULT_PENSION_INPUT, ...overrides };
}

function createMockResult(overrides: Partial<PensionResult> = {}): PensionResult {
  return {
    bruttoJaehrlich: 18000,
    bruttoMonatlich: 1500,
    besteuerungsanteil: 1.0,
    zuVersteuerndesEinkommen: 18000,
    rentenfreibetrag: 0,
    einkommensteuer: 1200,
    solidaritaetszuschlag: 0,
    kvdrBeitragMonatlich: 123.75,
    pflegeBeitragMonatlich: 54,
    gesamtAbzuegeMonatlich: 277.75,
    nettoMonatlich: 1222.25,
    realeKaufkraftMonatlich: 800,
    rentenluecke: 1700,
    deckungsquote: 32,
    jahresBisRente: 32,
    abzuege: [
      { label: 'Einkommensteuer', betrag: 100, prozent: 6.7, farbe: '#e74c3c', typ: 'steuer' },
      { label: 'Krankenversicherung (KVdR)', betrag: 123.75, prozent: 8.3, farbe: '#e67e22', typ: 'sozial' },
      { label: 'Pflegeversicherung', betrag: 54, prozent: 3.6, farbe: '#f39c12', typ: 'sozial' },
      { label: 'Inflationsverlust', betrag: 422.25, prozent: 28.2, farbe: '#8e44ad', typ: 'inflation' },
    ],
    inflationsVerlauf: Array.from({ length: 31 }, (_, i) => ({
      jahr: 2058 + i,
      alter: 67 + i,
      nominalMonatlich: 1222.25,
      realMonatlich: Math.round(1222.25 * Math.pow(0.98, i) * 100) / 100,
      kaufkraftVerlust: Math.round(1222.25 * (1 - Math.pow(0.98, i)) * 100) / 100,
    })),
    ...overrides,
  };
}

/** Run generateReport and collect rendered texts */
function generateAndCapture(
  service: PdfReportService,
  input: PensionInput,
  result: PensionResult,
): string[] {
  renderedTexts = [];
  service.generateReport(input, result);
  return [...renderedTexts];
}

describe('PdfReportService', () => {
  let service: PdfReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfReportService);
    preventDownloads();
    installTextCapture(service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ──────────────────────────────────────────────
  // Smoke tests — generateReport must not throw
  // ──────────────────────────────────────────────

  describe('Smoke tests (no throw)', () => {
    it('should generate report without throwing for default input + mock result', () => {
      expect(() => service.generateReport(createMockInput(), createMockResult())).not.toThrow();
    });

    it('should generate report without throwing for real pipeline result', () => {
      const calcService = TestBed.inject(PensionCalculatorService);
      const result = calcService.calculate(DEFAULT_PENSION_INPUT);
      expect(() => service.generateReport(DEFAULT_PENSION_INPUT, result)).not.toThrow();
    });

    it('should not throw for \u20ac0 gross pension', () => {
      const input = createMockInput({ bruttoMonatlicheRente: 0 });
      const result = createMockResult({
        bruttoJaehrlich: 0, bruttoMonatlich: 0, nettoMonatlich: 0,
        realeKaufkraftMonatlich: 0, gesamtAbzuegeMonatlich: 0,
        einkommensteuer: 0, rentenluecke: 2500, deckungsquote: 0, abzuege: [],
      });
      expect(() => service.generateReport(input, result)).not.toThrow();
    });

    it('should not throw for very high pension (\u20ac10,000/month)', () => {
      const calcService = TestBed.inject(PensionCalculatorService);
      const input = createMockInput({ bruttoMonatlicheRente: 10000 });
      expect(() => service.generateReport(input, calcService.calculate(input))).not.toThrow();
    });

    it('should not throw when rentenluecke is 0 (no gap)', () => {
      expect(() => service.generateReport(createMockInput(), createMockResult({ rentenluecke: 0, deckungsquote: 150 }))).not.toThrow();
    });

    it('should not throw for already-retired user (0 years to retirement)', () => {
      expect(() => service.generateReport(createMockInput({ aktuellesAlter: 67 }), createMockResult({ jahresBisRente: 0 }))).not.toThrow();
    });

    it('should not throw with 0% inflation', () => {
      const calc = TestBed.inject(PensionCalculatorService);
      const input = createMockInput({ inflationsrate: 0 });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should not throw with hatKinder = false', () => {
      const calc = TestBed.inject(PensionCalculatorService);
      const input = createMockInput({ hatKinder: false });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should not throw with steuerJahr 2025', () => {
      const calc = TestBed.inject(PensionCalculatorService);
      const input = createMockInput({ steuerJahr: 2025 });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should not throw with empty abzuege array', () => {
      expect(() => service.generateReport(createMockInput(), createMockResult({ abzuege: [] }))).not.toThrow();
    });

    it('should not throw with empty inflationsVerlauf array', () => {
      expect(() => service.generateReport(createMockInput(), createMockResult({ inflationsVerlauf: [] }))).not.toThrow();
    });

    it('should not throw with single inflation projection data point', () => {
      const result = createMockResult({
        inflationsVerlauf: [{ jahr: 2058, alter: 67, nominalMonatlich: 1222.25, realMonatlich: 1222.25, kaufkraftVerlust: 0 }],
      });
      expect(() => service.generateReport(createMockInput(), result)).not.toThrow();
    });

    it('should not throw with very low deckungsquote', () => {
      expect(() => service.generateReport(createMockInput(), createMockResult({ deckungsquote: 5, rentenluecke: 2400 }))).not.toThrow();
    });

    it('should not throw with deckungsquote > 100%', () => {
      expect(() => service.generateReport(createMockInput(), createMockResult({ deckungsquote: 150, rentenluecke: 0 }))).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // PDF structure
  // ──────────────────────────────────────────────

  describe('PDF structure', () => {
    it('should save with correct filename format', () => {
      service.generateReport(createMockInput(), createMockResult());
      expect(savedFilename).toBeDefined();
      expect(savedFilename).toMatch(/^RentenCheck-Plus-Report_\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should save with today\'s date in the filename', () => {
      service.generateReport(createMockInput(), createMockResult());
      const today = new Date().toISOString().slice(0, 10);
      expect(savedFilename).toContain(today);
    });

    it('should not throw with many deduction items', () => {
      const manyAbzuege: DeductionItem[] = Array.from({ length: 10 }, (_, i) => ({
        label: `Abzug ${i}`, betrag: 50 + i * 10, prozent: 3 + i, farbe: '#e74c3c', typ: 'steuer' as const,
      }));
      expect(() => service.generateReport(createMockInput(), createMockResult({ abzuege: manyAbzuege }))).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // Conditional sections
  // ──────────────────────────────────────────────

  describe('Conditional sections', () => {
    it('should include gap banner when rentenluecke > 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 1500 }));
      expect(texts.some(t => t.includes('Rentenl\u00fccke'))).toBeTrue();
    });

    it('should include success banner when rentenluecke is 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 0 }));
      expect(texts.some(t => t.includes('Keine Rentenl\u00fccke'))).toBeTrue();
    });

    it('should skip savings comparison when rentenluecke is 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 0 }));
      expect(texts.some(t => t.includes('Sparplan-Vergleich'))).toBeFalse();
    });

    it('should include savings comparison when rentenluecke > 0 and years > 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 1500, jahresBisRente: 30 }));
      expect(texts.some(t => t.includes('Sparplan-Vergleich'))).toBeTrue();
    });

    it('should skip savings comparison when jahresBisRente is 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 1500, jahresBisRente: 0 }));
      expect(texts.some(t => t.includes('Sparplan-Vergleich'))).toBeFalse();
    });

    it('should include Kindererziehungszeiten tip when hatKinder is true', () => {
      const texts = generateAndCapture(service, createMockInput({ hatKinder: true }), createMockResult());
      expect(texts.some(t => t.includes('Kindererziehungszeiten'))).toBeTrue();
    });

    it('should not include Kindererziehungszeiten tip when hatKinder is false', () => {
      const texts = generateAndCapture(service, createMockInput({ hatKinder: false }), createMockResult());
      expect(texts.some(t => t.includes('Kindererziehungszeiten'))).toBeFalse();
    });

    it('should include Beratung tip when deckungsquote < 50', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ deckungsquote: 30 }));
      expect(texts.some(t => t.includes('Beratung empfohlen'))).toBeTrue();
    });

    it('should not include Beratung tip when deckungsquote >= 50', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ deckungsquote: 80, rentenluecke: 500 }));
      expect(texts.some(t => t.includes('Beratung empfohlen'))).toBeFalse();
    });

    it('should include affiliate box when rentenluecke > 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 1000 }));
      expect(texts.some(t => t === 'Anzeige')).toBeTrue();
    });

    it('should not include affiliate box when rentenluecke is 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 0 }));
      expect(texts.some(t => t === 'Anzeige')).toBeFalse();
    });

    it('should include Staatliche F\u00f6rderung tip when rentenluecke > 500', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 800 }));
      expect(texts.some(t => t.includes('Staatliche F'))).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────
  // Content correctness
  // ──────────────────────────────────────────────

  describe('Content correctness', () => {
    it('should render input values in the report', () => {
      const texts = generateAndCapture(service, createMockInput({ aktuellesAlter: 40 }), createMockResult());
      expect(texts.some(t => t.includes('40 Jahre'))).toBeTrue();
    });

    it('should include Kinder: Ja when hatKinder is true', () => {
      const texts = generateAndCapture(service, createMockInput({ hatKinder: true }), createMockResult());
      expect(texts.some(t => t === 'Ja')).toBeTrue();
    });

    it('should include Kinder: Nein when hatKinder is false', () => {
      const texts = generateAndCapture(service, createMockInput({ hatKinder: false }), createMockResult());
      expect(texts.some(t => t.includes('Nein'))).toBeTrue();
    });

    it('should include the RentenCheck+ brand name', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => t === 'RentenCheck')).toBeTrue();
    });

    it('should include disclaimer section', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => t.includes('Rechtliche Hinweise'))).toBeTrue();
    });

    it('should include \u00a732a EStG reference', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => t.includes('32a EStG'))).toBeTrue();
    });

    it('should include score gauge section', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => t.includes('Renten-Score'))).toBeTrue();
    });

    it('should include inflation table section', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => t.includes('Inflationstabelle'))).toBeTrue();
    });

    it('should include deduction table header', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => t.includes('Abzugsposten'))).toBeTrue();
    });

    it('should render all deduction labels', () => {
      const result = createMockResult();
      const texts = generateAndCapture(service, createMockInput(), result);
      for (const abzug of result.abzuege) {
        expect(texts.some(t => t === abzug.label))
          .withContext(`Missing deduction label: ${abzug.label}`).toBeTrue();
      }
    });

    it('should include page numbers', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult());
      expect(texts.some(t => /Seite \d+ von \d+/.test(t))).toBeTrue();
    });
  });

  // ──────────────────────────────────────────────
  // Edge case inputs via real calculator pipeline
  // ──────────────────────────────────────────────

  describe('Edge cases with real pipeline', () => {
    let calc: PensionCalculatorService;
    beforeEach(() => { calc = TestBed.inject(PensionCalculatorService); });

    it('should handle minimum valid input', () => {
      const input = createMockInput({ bruttoMonatlicheRente: 200, gewuenschteMonatlicheRente: 1000, aktuellesAlter: 18, inflationsrate: 0 });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should handle maximum pension with no gap', () => {
      const input = createMockInput({ bruttoMonatlicheRente: 4000, gewuenschteMonatlicheRente: 1000, aktuellesAlter: 66 });
      const result = calc.calculate(input);
      expect(() => service.generateReport(input, result)).not.toThrow();
      expect(result.rentenluecke).toBe(0);
    });

    it('should handle young user with long time horizon', () => {
      const input = createMockInput({ aktuellesAlter: 18, rentenbeginnJahr: 2075 });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should handle childless user (higher Pflege)', () => {
      const input = createMockInput({ hatKinder: false });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should handle max inflation rate', () => {
      const input = createMockInput({ inflationsrate: 0.15 });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });

    it('should handle retirement year 2025', () => {
      const input = createMockInput({ rentenbeginnJahr: 2025, aktuellesAlter: 66, steuerJahr: 2025 });
      expect(() => service.generateReport(input, calc.calculate(input))).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // Tip generation logic
  // ──────────────────────────────────────────────

  describe('Tip card generation', () => {
    it('should always include "1\u20132 Jahre l\u00e4nger arbeiten" tip', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 0, jahresBisRente: 0 }));
      expect(texts.some(t => t.includes('nger arbeiten'))).toBeTrue();
    });

    it('should include ETF tip when gap > 0 and years > 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 1000, jahresBisRente: 20 }));
      expect(texts.some(t => t.includes('ETF-Sparplan starten'))).toBeTrue();
    });

    it('should not include ETF tip when gap is 0', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ rentenluecke: 0, jahresBisRente: 30 }));
      expect(texts.some(t => t.includes('ETF-Sparplan starten'))).toBeFalse();
    });

    it('should include "Zeit ist Ihr Verb\u00fcndeter" when years > 5', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ jahresBisRente: 20 }));
      expect(texts.some(t => t.includes('Zeit ist Ihr Verb'))).toBeTrue();
    });

    it('should not include "Zeit" tip when years <= 5', () => {
      const texts = generateAndCapture(service, createMockInput(), createMockResult({ jahresBisRente: 3 }));
      expect(texts.some(t => t.includes('Zeit ist Ihr Verb'))).toBeFalse();
    });

    it('should not throw with all tips triggered', () => {
      const input = createMockInput({ hatKinder: true });
      const result = createMockResult({ rentenluecke: 1000, jahresBisRente: 30, deckungsquote: 30 });
      expect(() => service.generateReport(input, result)).not.toThrow();
    });
  });

  // ──────────────────────────────────────────────
  // Full pipeline integration
  // ──────────────────────────────────────────────

  describe('Full pipeline integration', () => {
    let calc: PensionCalculatorService;
    beforeEach(() => { calc = TestBed.inject(PensionCalculatorService); });

    it('should produce valid report for every age from 18 to 66', () => {
      for (let age = 18; age <= 66; age += 12) {
        const input = createMockInput({ aktuellesAlter: age });
        expect(() => service.generateReport(input, calc.calculate(input)))
          .withContext(`Failed for age ${age}`).not.toThrow();
      }
    });

    it('should produce valid report for various brutto values', () => {
      for (const brutto of [200, 500, 1000, 1500, 2500, 4000]) {
        const input = createMockInput({ bruttoMonatlicheRente: brutto });
        expect(() => service.generateReport(input, calc.calculate(input)))
          .withContext(`Failed for brutto ${brutto}`).not.toThrow();
      }
    });

    it('should produce valid report for various inflation rates', () => {
      for (const rate of [0, 0.01, 0.02, 0.05, 0.10]) {
        const input = createMockInput({ inflationsrate: rate });
        expect(() => service.generateReport(input, calc.calculate(input)))
          .withContext(`Failed for inflation ${rate}`).not.toThrow();
      }
    });
  });
});

