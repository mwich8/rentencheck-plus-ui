import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const CONSENT_KEY = 'rentencheck_cookie_consent';

/**
 * DSGVO-compliant cookie consent banner.
 * Persists choice in localStorage. Only "necessary" cookies are used
 * in the current version (no analytics yet), but we need the banner
 * to be legally compliant for when analytics are added.
 */
@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss'],
})
export class CookieConsentComponent {
  readonly visible = signal(!this.hasConsent());

  accept(level: 'all' | 'necessary'): void {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
    }));
    this.visible.set(false);
  }

  private hasConsent(): boolean {
    return !!localStorage.getItem(CONSENT_KEY);
  }
}

