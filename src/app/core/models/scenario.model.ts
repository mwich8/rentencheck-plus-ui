import { PensionInput } from './pension-input.model';
import { PensionResult } from './pension-result.model';

/**
 * A single scenario for comparison — a labelled PensionInput + its computed result.
 */
export interface Scenario {
  label: string;
  icon: string;
  color: string;
  input: PensionInput;
  result: PensionResult;
  isBaseline?: boolean;
}

/**
 * A personalized optimization suggestion with quantified impact.
 */
export interface OptimizationSuggestion {
  icon: string;
  title: string;
  description: string;
  /** Monthly impact in EUR (positive = more money) */
  impact: number;
  category: 'savings' | 'pension' | 'tax' | 'lifestyle';
  /** Concrete next step the user can take */
  actionStep?: string;
  /** Custom label for the impact value (e.g. '/Monat Kaufkraft') */
  impactLabel?: string;
}


