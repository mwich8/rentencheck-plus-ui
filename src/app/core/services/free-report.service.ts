import { Injectable } from '@angular/core';
import { PensionResult } from '../models/pension-result.model';
import { RentenScore } from './renten-score.service';
import { environment } from '@env/environment';

export interface FreeReportResponse {
  sent: boolean;
  error?: string;
}

/**
 * Service for sending the free report summary email.
 * Calls the `send-free-report` Netlify function to capture the lead
 * and deliver the user's Renten-Score + key metrics via email.
 */
@Injectable({ providedIn: 'root' })
export class FreeReportService {

  async sendFreeReport(
    email: string,
    result: PensionResult,
    score: RentenScore,
  ): Promise<FreeReportResponse> {
    const baseUrl = environment.production
      ? environment.siteUrl
      : '';

    try {
      const response = await fetch(`${baseUrl}/.netlify/functions/send-free-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          score: score.score,
          grade: score.grade,
          label: score.label,
          percentile: score.percentile,
          nettoMonatlich: result.nettoMonatlich,
          rentenluecke: result.rentenluecke,
          deckungsquote: result.deckungsquote,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { sent: false, error: data.error || 'Unbekannter Fehler' };
      }

      return { sent: true };
    } catch (err) {
      console.error('[FreeReportService] Send error:', err);
      return { sent: false, error: 'Netzwerkfehler. Bitte versuchen Sie es erneut.' };
    }
  }
}

