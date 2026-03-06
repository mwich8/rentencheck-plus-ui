import { PensionInput, DEFAULT_PENSION_INPUT } from './pension-input.model';

/**
 * Validation error with field name and message.
 */
export interface ValidationError {
  field: keyof PensionInput;
  message: string;
  /** The invalid value that was provided */
  value: unknown;
}

/**
 * Result of input validation — either valid with sanitized input, or invalid with errors.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  /** Sanitized input with clamped/corrected values (only meaningful when valid = true) */
  sanitizedInput: PensionInput;
}

/**
 * Constraints for PensionInput fields.
 * These define min/max boundaries to prevent garbage-in/garbage-out.
 */
export const INPUT_CONSTRAINTS = {
  bruttoMonatlicheRente: { min: 0, max: 10_000 },
  rentenbeginnJahr: { min: 2025, max: 2080 },
  aktuellesAlter: { min: 16, max: 100 },
  gewuenschteMonatlicheRente: { min: 0, max: 20_000 },
  inflationsrate: { min: 0, max: 0.15 },
  zusatzbeitragssatz: { min: 0, max: 0.05 },
  steuerJahr: { allowed: [2025, 2026] as const },
} as const;

/**
 * Validates and sanitizes PensionInput to prevent invalid/garbage data
 * from propagating through the calculation pipeline.
 *
 * Strategy:
 * - Numbers are checked for NaN/Infinity and clamped to valid ranges
 * - Logical cross-field constraints are enforced (e.g. age vs retirement year)
 * - Invalid boolean values are coerced
 * - Returns both validation errors and a sanitized (clamped) input
 */
export class PensionInputValidator {

  /**
   * Validate and sanitize a PensionInput object.
   * Returns a ValidationResult with errors and a sanitized copy.
   */
  static validate(input: PensionInput): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitized = { ...input };

    // ── Type & NaN checks ──────────────────────────────
    sanitized.bruttoMonatlicheRente = PensionInputValidator.sanitizeNumber(
      input.bruttoMonatlicheRente, 'bruttoMonatlicheRente', DEFAULT_PENSION_INPUT.bruttoMonatlicheRente, errors,
    );

    sanitized.rentenbeginnJahr = PensionInputValidator.sanitizeNumber(
      input.rentenbeginnJahr, 'rentenbeginnJahr', DEFAULT_PENSION_INPUT.rentenbeginnJahr, errors,
    );

    sanitized.aktuellesAlter = PensionInputValidator.sanitizeNumber(
      input.aktuellesAlter, 'aktuellesAlter', DEFAULT_PENSION_INPUT.aktuellesAlter, errors,
    );

    sanitized.gewuenschteMonatlicheRente = PensionInputValidator.sanitizeNumber(
      input.gewuenschteMonatlicheRente, 'gewuenschteMonatlicheRente', DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente, errors,
    );

    sanitized.inflationsrate = PensionInputValidator.sanitizeNumber(
      input.inflationsrate, 'inflationsrate', DEFAULT_PENSION_INPUT.inflationsrate, errors,
    );

    sanitized.zusatzbeitragssatz = PensionInputValidator.sanitizeNumber(
      input.zusatzbeitragssatz, 'zusatzbeitragssatz', DEFAULT_PENSION_INPUT.zusatzbeitragssatz, errors,
    );

    // ── Boolean coercion ────────────────────────────────
    // Runtime guard: input may come from untyped sources (JSON, query params)
    if ((input.hatKinder as unknown) !== true && (input.hatKinder as unknown) !== false) {
      errors.push({
        field: 'hatKinder',
        message: 'hatKinder must be a boolean',
        value: input.hatKinder,
      });
      sanitized.hatKinder = !!input.hatKinder;
    }

    // ── steuerJahr validation ───────────────────────────
    if (!INPUT_CONSTRAINTS.steuerJahr.allowed.includes(input.steuerJahr)) {
      errors.push({
        field: 'steuerJahr',
        message: `steuerJahr must be one of [${INPUT_CONSTRAINTS.steuerJahr.allowed.join(', ')}]`,
        value: input.steuerJahr,
      });
      sanitized.steuerJahr = DEFAULT_PENSION_INPUT.steuerJahr;
    }

    // ── Range clamping ──────────────────────────────────
    const c = INPUT_CONSTRAINTS;

    sanitized.bruttoMonatlicheRente = PensionInputValidator.clampWithError(
      sanitized.bruttoMonatlicheRente, c.bruttoMonatlicheRente.min, c.bruttoMonatlicheRente.max,
      'bruttoMonatlicheRente', errors,
    );

    sanitized.rentenbeginnJahr = PensionInputValidator.clampWithError(
      sanitized.rentenbeginnJahr, c.rentenbeginnJahr.min, c.rentenbeginnJahr.max,
      'rentenbeginnJahr', errors,
    );

    // Ensure rentenbeginnJahr is an integer (year)
    sanitized.rentenbeginnJahr = Math.round(sanitized.rentenbeginnJahr);

    sanitized.aktuellesAlter = PensionInputValidator.clampWithError(
      sanitized.aktuellesAlter, c.aktuellesAlter.min, c.aktuellesAlter.max,
      'aktuellesAlter', errors,
    );

    // Ensure aktuellesAlter is an integer
    sanitized.aktuellesAlter = Math.round(sanitized.aktuellesAlter);

    sanitized.gewuenschteMonatlicheRente = PensionInputValidator.clampWithError(
      sanitized.gewuenschteMonatlicheRente, c.gewuenschteMonatlicheRente.min, c.gewuenschteMonatlicheRente.max,
      'gewuenschteMonatlicheRente', errors,
    );

    sanitized.inflationsrate = PensionInputValidator.clampWithError(
      sanitized.inflationsrate, c.inflationsrate.min, c.inflationsrate.max,
      'inflationsrate', errors,
    );

    sanitized.zusatzbeitragssatz = PensionInputValidator.clampWithError(
      sanitized.zusatzbeitragssatz, c.zusatzbeitragssatz.min, c.zusatzbeitragssatz.max,
      'zusatzbeitragssatz', errors,
    );

    // ── Cross-field validation ──────────────────────────

    // Retirement year should not imply retirement before the user was even born
    // or in an impossible timeframe. We only flag clearly impossible scenarios.
    const currentYear = new Date().getFullYear();
    const impliedRetirementAge = sanitized.rentenbeginnJahr - currentYear + sanitized.aktuellesAlter;
    if (impliedRetirementAge < 0) {
      errors.push({
        field: 'rentenbeginnJahr',
        message: 'Rentenbeginn year implies an impossible retirement age (before birth)',
        value: sanitized.rentenbeginnJahr,
      });
      // Fix: set retirement year so retirement age = 67
      sanitized.rentenbeginnJahr = currentYear + Math.max(0, 67 - sanitized.aktuellesAlter);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedInput: sanitized,
    };
  }

  /**
   * Quick check: is the input valid without full sanitization?
   */
  static isValid(input: PensionInput): boolean {
    return PensionInputValidator.validate(input).valid;
  }

  /**
   * Sanitize and return a safe PensionInput, falling back to defaults for invalid fields.
   * Use this when you want a guaranteed-safe input without caring about individual errors.
   */
  static sanitize(input: PensionInput): PensionInput {
    return PensionInputValidator.validate(input).sanitizedInput;
  }

  // ── Private helpers ───────────────────────────────────

  /**
   * Check if a value is a valid finite number. If not, record an error and return the fallback.
   */
  private static sanitizeNumber(
    value: unknown,
    field: keyof PensionInput,
    fallback: number,
    errors: ValidationError[],
  ): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push({
        field,
        message: `${field} must be a finite number`,
        value,
      });
      return fallback;
    }
    return value;
  }

  /**
   * Clamp a number to [min, max]. If clamping occurs, record a validation error.
   */
  private static clampWithError(
    value: number,
    min: number,
    max: number,
    field: keyof PensionInput,
    errors: ValidationError[],
  ): number {
    if (value < min) {
      errors.push({
        field,
        message: `${field} must be at least ${min} (was ${value})`,
        value,
      });
      return min;
    }
    if (value > max) {
      errors.push({
        field,
        message: `${field} must be at most ${max} (was ${value})`,
        value,
      });
      return max;
    }
    return value;
  }
}



