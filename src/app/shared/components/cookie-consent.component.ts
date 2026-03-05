import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';

const CONSENT_KEY = 'rentencheck_cookie_consent';

/**
 * DSGVO-compliant cookie consent banner.
 * Persists choice in localStorage.
 * Plausible is cookie-free but we still respect user choice.
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
  readonly visible = signal(!this.hasConsent());

  ngOnInit(): void {
    // If user already accepted, initialize analytics immediately
    const consent = this.readConsent();
    if (consent?.level === 'all') {
      this.analytics.init();
    }
  }

  accept(level: 'all' | 'necessary'): void {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
    }));
    this.visible.set(false);

    if (level === 'all') {
      this.analytics.init();
    }
  }

  private hasConsent(): boolean {
    return !!localStorage.getItem(CONSENT_KEY);
  }

  private readConsent(): { level: string; timestamp: string } | null {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
