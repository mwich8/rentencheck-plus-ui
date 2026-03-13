import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';

const CONSENT_KEY: string = 'rentencheck_cookie_consent';

/**
 * DSGVO-compliant cookie consent banner.
 * Persists choice in localStorage.
 * Umami is cookie-free but we still respect user choice.
 */
@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss'],
})
export class CookieConsentComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  readonly visible = signal<boolean>(!this.hasConsent());

  ngOnInit(): void {
    // If user already accepted, initialize analytics immediately
    const consent = this.readConsent();
    if (consent?.level === 'all') {
      this.analytics.init();
    }
  }

  accept(level: 'all' | 'necessary'): void {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        level,
        timestamp: new Date().toISOString(),
      }));
    } catch { /* private browsing — proceed without persistence */ }
    this.visible.set(false);

    if (level === 'all') {
      this.analytics.init();
    }
  }

  private hasConsent(): boolean {
    try {
      return !!localStorage.getItem(CONSENT_KEY);
    } catch {
      return false;
    }
  }

  private readConsent(): { level: string; timestamp: string } | null {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Guard against corrupted/tampered localStorage data
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.level === 'string') {
        return parsed as { level: string; timestamp: string };
      }
      return null;
    } catch {
      return null;
    }
  }
}
