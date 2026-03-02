import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Datenschutzerklärung (Privacy Policy) — required by DSGVO (Art. 13/14 DSGVO).
 * Since this app runs 100% client-side with no data collection,
 * the policy is straightforward but still legally required.
 */
@Component({
  selector: 'app-datenschutz-page',
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
        <h1>Datenschutzerklärung</h1>
        <p class="legal-meta">Stand: März 2026</p>

        <section>
          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer
            nationaler Datenschutzgesetze sowie sonstiger datenschutzrechtlicher Bestimmungen ist:
          </p>
          <address class="legal-address">
            <strong>Marten Wichmann</strong><br>
            Colloredostr. 1c<br>
            84453 Mühldorf<br>
            Deutschland<br><br>
            E-Mail: <a href="mailto:marten.wichmann@gmail.com">marten.wichmann&#64;gmail.com</a>
          </address>
        </section>

        <section>
          <h2>2. Grundsatz: Keine Datenerhebung</h2>
          <p>
            RentenCheck+ ist ein reines Client-Side-Tool. <strong>Alle Berechnungen werden
            ausschließlich in Ihrem Browser (lokal auf Ihrem Gerät) durchgeführt.</strong>
            Es werden keine personenbezogenen Daten an unsere Server übermittelt.
          </p>
          <p>
            Die von Ihnen eingegebenen Rentendaten (Bruttorente, Alter, gewünschtes Einkommen etc.)
            verlassen zu keinem Zeitpunkt Ihren Browser und werden nicht gespeichert, protokolliert
            oder an Dritte weitergegeben.
          </p>
        </section>

        <section>
          <h2>3. Hosting und technische Bereitstellung</h2>
          <p>
            Diese Website wird gehostet bei:
          </p>
          <address class="legal-address">
            <strong>Netlify, Inc.</strong><br>
            512 2nd Street, Suite 200<br>
            San Francisco, CA 94107, USA
          </address>
          <p>
            Der Hosting-Anbieter erhebt in sogenannten Server-Logfiles folgende Daten,
            die Ihr Browser automatisch übermittelt:
          </p>
          <ul>
            <li>IP-Adresse (wird ggf. anonymisiert)</li>
            <li>Datum und Uhrzeit der Anfrage</li>
            <li>Browsertyp und -version</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer-URL</li>
            <li>Übertragene Datenmenge</li>
          </ul>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
            an der sicheren und effizienten Bereitstellung der Website).
          </p>
          <p>
            Die Server-Logfiles werden maximal 7 Tage gespeichert und danach automatisch gelöscht.
          </p>
        </section>

        <section>
          <h2>4. Cookies und lokaler Speicher</h2>
          <h3>4.1 Technisch notwendige Cookies</h3>
          <p>
            Diese Website verwendet keine Cookies für Tracking oder Werbezwecke.
            Es können technisch notwendige Cookies eingesetzt werden, die für den
            Betrieb der Website erforderlich sind (z.&nbsp;B. Session-Cookies).
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO; § 25 Abs. 2 TDDDG
            (technisch erforderliche Cookies sind von der Einwilligungspflicht ausgenommen).
          </p>

          <h3>4.2 LocalStorage</h3>
          <p>
            Die Website kann den LocalStorage Ihres Browsers verwenden, um Benutzereinstellungen
            lokal auf Ihrem Gerät zu speichern. Diese Daten werden nicht an Server übertragen
            und können jederzeit durch Löschen der Browser-Daten entfernt werden.
          </p>
        </section>

        <section>
          <h2>5. Keine Analyse- und Tracking-Tools</h2>
          <p>
            Diese Website verwendet <strong>keine</strong> Analyse-Tools wie Google Analytics,
            Matomo oder vergleichbare Dienste. Es findet kein Tracking Ihres Nutzungsverhaltens statt.
          </p>
        </section>

        <section>
          <h2>6. Externe Dienste</h2>
          <h3>6.1 Google Fonts</h3>
          <p>
            Diese Website nutzt die Schriftart „Inter" von Google Fonts. Beim Aufruf der Website
            wird eine Verbindung zu den Servern von Google LLC (1600 Amphitheatre Parkway,
            Mountain View, CA 94043, USA) hergestellt, um die Schriftart zu laden.
          </p>
          <p>
            Dabei wird Ihre IP-Adresse an Google übermittelt. Google verarbeitet diese Daten
            gemäß der
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">
              Google-Datenschutzerklärung</a>.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
            an einer ansprechenden Darstellung der Website).
          </p>
          <p>
            <em>Hinweis: Um die Datenübertragung an Google zu vermeiden, können die Fonts
            alternativ lokal gehostet werden.</em>
          </p>
        </section>

        <section>
          <h2>7. Zahlungsabwicklung</h2>
          <p>
            Für kostenpflichtige Leistungen (Detail-Analyse, Premium-Paket) wird die
            Zahlungsabwicklung über einen externen Zahlungsdienstleister durchgeführt.
            Die Verarbeitung der Zahlungsdaten erfolgt ausschließlich durch den jeweiligen
            Anbieter. Wir erhalten keine vollständigen Kreditkarten- oder Kontodaten.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>
        </section>

        <section>
          <h2>8. Ihre Rechte als betroffene Person</h2>
          <p>Sie haben gemäß DSGVO folgende Rechte:</p>
          <ul>
            <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO) — Recht auf Auskunft über die verarbeiteten Daten</li>
            <li><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO) — Recht auf Korrektur unrichtiger Daten</li>
            <li><strong>Löschungsrecht</strong> (Art. 17 DSGVO) — Recht auf Löschung Ihrer Daten</li>
            <li><strong>Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
            <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
            <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO)</li>
            <li><strong>Widerruf der Einwilligung</strong> (Art. 7 Abs. 3 DSGVO)</li>
          </ul>
          <p>
            Da wir keine personenbezogenen Daten erheben oder speichern, sind diese Rechte
            in der Praxis nicht anwendbar. Sollten Sie dennoch Fragen haben, wenden Sie sich
            bitte an die oben genannte E-Mail-Adresse.
          </p>
        </section>

        <section>
          <h2>9. Beschwerderecht bei einer Aufsichtsbehörde</h2>
          <p>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung
            Ihrer personenbezogenen Daten zu beschweren. Die zuständige Aufsichtsbehörde richtet
            sich nach Ihrem Wohnsitz bzw. dem Sitz des Verantwortlichen:
          </p>
          <p>
            <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener">
              Bundesbeauftragter für den Datenschutz und die Informationsfreiheit (BfDI)
            </a>
          </p>
        </section>

        <section>
          <h2>10. Aktualität und Änderung dieser Datenschutzerklärung</h2>
          <p>
            Diese Datenschutzerklärung hat den Stand März 2026. Wir behalten uns vor,
            die Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder bei
            Änderungen des Dienstes anzupassen. Die jeweils aktuelle Fassung finden Sie
            stets auf dieser Seite.
          </p>
        </section>
      </article>
    </main>

    <footer class="legal-footer">
      <div class="container">
        <div class="footer-links">
          <a routerLink="/">Startseite</a>
          <a routerLink="/impressum">Impressum</a>
          <a routerLink="/datenschutz" class="active">Datenschutz</a>
          <a routerLink="/haftungsausschluss">Haftungsausschluss</a>
        </div>
        <p class="footer-copy">© {{ currentYear }} RentenCheck+ — Alle Rechte vorbehalten</p>
      </div>
    </footer>
  `,
  styles: [`
    /* ==========================================
       Shared Legal Page Styles
       ========================================== */
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

    .legal-content h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 0.5rem;
      margin-top: 1.25rem;
    }

    .legal-content p {
      font-size: 0.92rem;
      line-height: 1.8;
      color: var(--color-text);
      margin-bottom: 0.75rem;
    }

    .legal-content ul {
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }

    .legal-content li {
      font-size: 0.92rem;
      line-height: 1.8;
      color: var(--color-text);
      margin-bottom: 0.25rem;
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

    /* Footer */
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
export class DatenschutzPageComponent {
  readonly currentYear = new Date().getFullYear();
}

