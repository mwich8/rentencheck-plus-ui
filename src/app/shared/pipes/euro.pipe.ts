import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a number as a German EUR currency string.
 * Uses German locale: 1.234,56 €
 */
@Pipe({
  name: 'euro',
  standalone: true,
})
export class EuroPipe implements PipeTransform {
  private readonly formatter: Intl.NumberFormat = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0,00 €';
    }
    return this.formatter.format(value);
  }
}

