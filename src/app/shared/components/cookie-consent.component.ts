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
  template: `
    @if (visible()) {
      <div class="consent-backdrop">
        <div class="consent-banner" role="dialog" aria-label="Cookie-Einstellungen">
          <div class="consent-content">
            <div class="consent-icon">🍪</div>
            <div class="consent-text">
              <h3>Datenschutz-Einstellungen</h3>
              <p>
                Wir verwenden nur technisch notwendige Cookies, um die Funktion
                dieser Website sicherzustellen. Ihre Berechnungsdaten verlassen
                niemals Ihren Browser.
                <a routerLink="/datenschutz" (click)="visible.set(false)">Mehr erfahren</a>
              </p>
            </div>
          </div>
          <div class="consent-actions">
            <button class="btn-accept" (click)="accept('all')">
              Alle akzeptieren
            </button>
            <button class="btn-necessary" (click)="accept('necessary')">
              Nur notwendige
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .consent-backdrop {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      padding: 1rem;
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .consent-banner {
      max-width: 720px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .consent-content {
      flex: 1;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      min-width: 280px;
    }

    .consent-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .consent-text h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f3460;
      margin-bottom: 0.25rem;
    }

    .consent-text p {
      font-size: 0.82rem;
      color: #6c757d;
      line-height: 1.5;
      margin: 0;
    }

    .consent-text a {
      color: #2980b9;
      text-decoration: underline;
    }

    .consent-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .btn-accept {
      background: linear-gradient(135deg, #2980b9, #0f3460);
      color: white;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-accept:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 10px rgba(15, 52, 96, 0.3);
    }

    .btn-necessary {
      background: #f1f5f9;
      color: #6c757d;
      border: 1px solid #dee2e6;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-necessary:hover {
      background: #e9ecef;
    }

    @media (max-width: 600px) {
      .consent-banner {
        flex-direction: column;
        text-align: center;
      }

      .consent-content {
        flex-direction: column;
        align-items: center;
      }

      .consent-actions {
        width: 100%;
        flex-direction: column;
      }

      .btn-accept, .btn-necessary {
        width: 100%;
      }
    }
  `],
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

