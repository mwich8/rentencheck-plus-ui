import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Impressum (Legal Notice) — required by §5 TMG and §18 Abs. 2 MStV.
 * Must contain: Name, address, contact, registration, VAT-ID.
 */
@Component({
  selector: 'app-impressum-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="legal-navbar">
      <div class="container nav-inner">
        <a routerLink="/" class="nav-brand">RentenCheck<span class="brand-plus">+</span></a>
        <a routerLink="/" class="nav-back">← Zurück zur Startseite</a>
      </div>
    </nav>

    <main class="legal-page container">
      <article class="legal-content">
        <h1>Impressum</h1>
        <p class="legal-meta">Angaben gemäß § 5 TMG | § 18 Abs. 2 MStV</p>

        <section>
          <h2>Diensteanbieter</h2>
          <address class="legal-address">
            <strong>Marten Wichmann</strong><br>
            Colloredostr. 1c<br>
            84453 Mühldorf<br>
            Deutschland
          </address>
        </section>

        <section>
          <h2>Kontakt</h2>
          <div class="contact-grid">
            <div class="contact-item">
              <span class="contact-label">Telefon:</span>
              <span>0176/87843870</span>
            </div>
            <div class="contact-item">
              <span class="contact-label">E-Mail:</span>
              <a href="mailto:marten.wichmann@gmail.com">marten.wichmann&#64;gmail.com</a>
            </div>
            <div class="contact-item">
              <span class="contact-label">Website:</span>
              <a href="https://rentencheck-plus.netlify.app">https://rentencheck-plus.netlify.app</a>
            </div>
          </div>
        </section>

        <section>
          <h2>Vertretungsberechtigte Person(en)</h2>
          <p>Marten Wichmann (Einzelunternehmer)</p>
        </section>

        <section>
          <h2>Registereintrag</h2>
          <p>
            Einzelunternehmer ohne Handelsregistereintrag.
          </p>
        </section>

        <section>
          <h2>Umsatzsteuer-ID</h2>
          <p>
            Kleinunternehmer gemäß § 19 UStG — keine Umsatzsteuer-Identifikationsnummer vorhanden.
          </p>
        </section>

        <section>
          <h2>Redaktionell Verantwortlicher</h2>
          <p>
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
          </p>
          <address class="legal-address">
            <strong>Marten Wichmann</strong><br>
            Colloredostr. 1c<br>
            84453 Mühldorf
          </address>
        </section>

        <section>
          <h2>EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
            bereit:
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener">
              https://ec.europa.eu/consumers/odr/</a>.
          </p>
          <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
        </section>

        <section>
          <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section>
          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
            Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir
            als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
            Informationen zu überwachen.
          </p>
          <p>
            <strong>RentenCheck+ ist ein Informationstool und ersetzt keine individuelle
            Steuer- oder Finanzberatung.</strong> Die Berechnungen basieren auf den aktuellen
            gesetzlichen Grundlagen und können von Ihrer tatsächlichen Situation abweichen.
            Keine Gewähr für die Richtigkeit der Berechnungen.
          </p>
        </section>

        <section>
          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte
            wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der
            jeweilige Anbieter verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
            Verlinkung auf mögliche Rechtsverstöße überprüft. Bei Bekanntwerden von
            Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>
        </section>

        <section>
          <h2>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
            Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
            bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
          <p>
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
            Gebrauch gestattet.
          </p>
        </section>
      </article>
    </main>

    <footer class="legal-footer">
      <div class="container">
        <div class="footer-links">
          <a routerLink="/">Startseite</a>
          <a routerLink="/impressum" class="active">Impressum</a>
          <a routerLink="/datenschutz">Datenschutz</a>
          <a routerLink="/haftungsausschluss">Haftungsausschluss</a>
        </div>
        <p class="footer-copy">© {{ currentYear }} RentenCheck+ — Alle Rechte vorbehalten</p>
      </div>
    </footer>
  `,
  styles: [`
    .legal-navbar {
      background: var(--color-primary);
      padding: 0.85rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      font-size: 1.3rem;
      font-weight: 900;
      color: white;
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .brand-plus { color: #e94560; }

    .nav-back {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      transition: color 0.2s;
    }

    .nav-back:hover { color: white; }

    .legal-page {
      max-width: 820px;
      padding-top: 3rem;
      padding-bottom: 4rem;
    }

    .legal-content h1 {
      font-size: 2.25rem;
      font-weight: 900;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }

    .legal-meta {
      font-size: 0.85rem;
      color: var(--color-text-light);
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--color-border);
    }

    .legal-content section {
      margin-bottom: 2.25rem;
    }

    .legal-content h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
      padding-top: 0.5rem;
    }

    .legal-content p {
      font-size: 0.92rem;
      line-height: 1.8;
      color: var(--color-text);
      margin-bottom: 0.75rem;
    }

    .legal-content a {
      color: var(--color-accent);
      text-decoration: underline;
      text-decoration-color: rgba(15, 52, 96, 0.3);
      text-underline-offset: 2px;
      transition: text-decoration-color 0.2s;
    }

    .legal-content a:hover {
      text-decoration-color: var(--color-accent);
    }

    .legal-address {
      background: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      font-style: normal;
      font-size: 0.92rem;
      line-height: 1.8;
      margin: 0.75rem 0 1rem;
    }

    .legal-notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: var(--radius-sm);
      padding: 0.75rem 1rem;
      font-size: 0.82rem !important;
      color: #92400e !important;
    }

    .legal-hint {
      font-size: 0.82rem !important;
      color: var(--color-text-light) !important;
      margin-top: 0.25rem;
    }

    .contact-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin: 0.75rem 0 1rem;
    }

    .contact-item {
      display: flex;
      gap: 0.75rem;
      font-size: 0.92rem;
      line-height: 1.6;
    }

    .contact-label {
      font-weight: 600;
      color: var(--color-text);
      min-width: 100px;
      flex-shrink: 0;
    }

    .legal-footer {
      background: var(--color-primary);
      padding: 1.5rem 0;
      text-align: center;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .footer-links a {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-links a:hover,
    .footer-links a.active {
      color: rgba(255, 255, 255, 0.9);
    }

    .footer-copy {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 768px) {
      .legal-content h1 { font-size: 1.75rem; }
      .legal-page { padding-top: 2rem; }
    }
  `],
})
export class ImpressumPageComponent {
  readonly currentYear = new Date().getFullYear();
}

