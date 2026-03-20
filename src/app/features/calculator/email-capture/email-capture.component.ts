import { Component, input, output, signal, inject } from '@angular/core';
import { FreeReportService } from '@core/services/free-report.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { PensionResult } from '@core/models/pension-result.model';
import { RentenScore } from '@core/services/renten-score.service';

/**
 * Inline email capture form for the free PDF report flow.
 * Collects the user's email to send a branded report summary,
 * capturing a lead while delivering value.
 *
 * Emits (completed) when the user either submits their email or skips.
 */
@Component({
  selector: 'app-email-capture',
  standalone: true,
  templateUrl: './email-capture.component.html',
  styleUrls: ['./email-capture.component.scss'],
})
export class EmailCaptureComponent {
  private readonly freeReportService = inject(FreeReportService);
  private readonly analytics = inject(AnalyticsService);

  readonly result = input.required<PensionResult>();
  readonly score = input.required<RentenScore>();

  /** Emits when the flow completes (email sent or skipped) */
  readonly completed = output<void>();

  readonly email = signal('');
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly error = signal<string | null>(null);

  readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  get isValidEmail(): boolean {
    return this.EMAIL_REGEX.test(this.email().trim());
  }

  onEmailInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.email.set(target.value);
    this.error.set(null);
  }

  async submitEmail(): Promise<void> {
    const emailVal = this.email().trim().toLowerCase();
    if (!this.isValidEmail) {
      this.error.set('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }

    this.sending.set(true);
    this.error.set(null);

    const response = await this.freeReportService.sendFreeReport(
      emailVal,
      this.result(),
      this.score(),
    );

    this.sending.set(false);

    if (response.sent) {
      this.sent.set(true);
      this.analytics.trackEvent('free_report_email_capture', { score: this.score().score });
      // Auto-continue after short delay so user sees the success message
      setTimeout(() => this.completed.emit(), 1500);
    } else {
      this.error.set(response.error || 'E-Mail konnte nicht gesendet werden.');
    }
  }

  skip(): void {
    this.analytics.trackEvent('free_report_email_skip');
    this.completed.emit();
  }
}

