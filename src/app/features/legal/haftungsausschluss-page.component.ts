import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Haftungsausschluss (Disclaimer) — full legal disclaimer page.
 * Important for a financial calculator to clarify that this is not financial advice.
 */
@Component({
  selector: 'app-haftungsausschluss-page',
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
        <h1>Haftungsausschluss</h1>
        <p class="legal-meta">Stand: März 2026</p>

        <div class="disclaimer-banner">
          <span class="banner-icon">⚖️</span>
          <div>
            <strong>Wichtiger Hinweis:</strong> RentenCheck+ ist ein reines Informationstool
            und ersetzt keine individuelle Steuer-, Finanz- oder Rechtsberatung.
          </div>
        </div>

        <section>
          <h2>1. Keine Finanz- oder Steuerberatung</h2>
          <p>
            Die auf dieser Website bereitgestellten Berechnungen, Informationen und Darstellungen
            dienen ausschließlich der allgemeinen Information und Orientierung. Sie stellen
            <strong>keine</strong> individuelle Steuerberatung, Finanzberatung, Anlageberatung
            oder sonstige professionelle Beratung dar.
          </p>
          <p>
            RentenCheck+ ist weder als Steuerberater, Finanzberater noch als Versicherungsvermittler
            zugelassen. Die Nutzung der Website begründet kein Beratungsverhältnis.
          </p>
        </section>

        <section>
          <h2>2. Keine Gewähr für Richtigkeit</h2>
          <p>
            Die Berechnungen basieren auf den uns zum Zeitpunkt der Entwicklung bekannten
            gesetzlichen Grundlagen, insbesondere:
          </p>
          <ul>
            <li>Einkommensteuergesetz (§ 32a EStG) — Tarif 2025/2026</li>
            <li>Krankenversicherung der Rentner (KVdR) — Beitragssätze des GKV-Spitzenverbands</li>
            <li>Besteuerungsanteil der Rente (§ 22 Nr. 1 Satz 3 Buchst. a Doppelbuchst. aa EStG)</li>
            <li>Pflegeversicherung (§ 55 SGB XI)</li>
            <li>Wachstumschancengesetz — Anpassung der Besteuerungsanteile</li>
          </ul>
          <p>
            <strong>Es wird keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität
            der Berechnungen und Informationen übernommen.</strong> Gesetzliche Regelungen
            können sich jederzeit ändern. Die tatsächliche steuerliche Belastung hängt von
            zahlreichen individuellen Faktoren ab, die in einem vereinfachten Online-Rechner
            nicht vollständig abgebildet werden können.
          </p>
        </section>

        <section>
          <h2>3. Vereinfachungen und Einschränkungen</h2>
          <p>Der Rechner berücksichtigt unter anderem <strong>nicht</strong>:</p>
          <ul>
            <li>Ehegatten-Splitting und Zusammenveranlagung</li>
            <li>Weitere Einkünfte neben der gesetzlichen Rente (Betriebsrente, Mieteinnahmen, Kapitalerträge etc.)</li>
            <li>Kirchensteuer</li>
            <li>Individuelle Freibeträge und Sonderausgaben über die Pauschalen hinaus</li>
            <li>Private Krankenversicherung (PKV)</li>
            <li>Regionale Unterschiede bei Zusatzbeiträgen der Krankenkassen</li>
            <li>Rentenanpassungen und Rentenerhöhungen</li>
            <li>Grundrentenzuschlag</li>
            <li>Schwerbehinderung und Behindertenpauschbeträge</li>
          </ul>
          <p>
            Die Ergebnisse sind daher als <strong>Orientierungswerte</strong> zu verstehen
            und können von Ihrer tatsächlichen Situation erheblich abweichen.
          </p>
        </section>

        <section>
          <h2>4. Inflationsprognose</h2>
          <p>
            Die Inflationsberechnung basiert auf einer vom Benutzer gewählten konstanten
            jährlichen Inflationsrate. Die tatsächliche Inflationsentwicklung ist nicht
            vorhersehbar und kann erheblich von der angenommenen Rate abweichen. Die
            dargestellten Kaufkraftverluste sind hypothetische Szenarien und keine Prognosen.
          </p>
        </section>

        <section>
          <h2>5. Sparplan- und Renditeannahmen</h2>
          <p>
            Die im Bereich „Handlungsempfehlungen" genannten Renditeangaben (z.&nbsp;B. 7% p.a.
            für ETF-Sparpläne) sind historische Durchschnittswerte und stellen
            <strong>keine Garantie für zukünftige Erträge</strong> dar. Kapitalanlagen
            unterliegen Risiken, einschließlich des möglichen Verlusts des eingesetzten Kapitals.
          </p>
          <p>
            Die genannten Berechnungen berücksichtigen keine Steuern auf Kapitalerträge
            (Abgeltungsteuer), Transaktionskosten, Fondsgebühren (TER) oder andere Kosten.
          </p>
        </section>

        <section>
          <h2>6. Renten-Score</h2>
          <p>
            Der „Renten-Score" und die Benchmark-Vergleiche („Besser als X% der Deutschen")
            sind vereinfachte Modellrechnungen auf Basis von Durchschnittswerten. Sie dienen
            der Veranschaulichung und stellen keine wissenschaftlich fundierte Analyse dar.
          </p>
        </section>

        <section>
          <h2>7. Empfehlung zur professionellen Beratung</h2>
          <p>
            Wir empfehlen dringend, für Ihre individuelle Rentensituation einen qualifizierten
            Steuerberater, Rentenberater oder unabhängigen Finanzberater zu konsultieren.
            Insbesondere bei:
          </p>
          <ul>
            <li>Komplexen Einkommensverhältnissen</li>
            <li>Betrieblicher Altersvorsorge</li>
            <li>Riester- und Rürup-Verträgen</li>
            <li>Immobilien als Altersvorsorge</li>
            <li>Vorsorgevollmacht und Patientenverfügung</li>
          </ul>
        </section>

        <section>
          <h2>8. Haftungsbeschränkung</h2>
          <p>
            Die Nutzung von RentenCheck+ erfolgt auf eigenes Risiko. Wir haften nicht für
            Schäden, die aus der Nutzung oder Nichtnutzung der bereitgestellten Informationen
            und Berechnungen entstehen, es sei denn, es liegt Vorsatz oder grobe Fahrlässigkeit
            vor.
          </p>
          <p>
            Insbesondere haften wir nicht für finanzielle Entscheidungen, die auf Grundlage
            der Berechnungsergebnisse getroffen werden.
          </p>
        </section>

        <section>
          <h2>9. Änderungen</h2>
          <p>
            Wir behalten uns vor, diesen Haftungsausschluss jederzeit zu ändern. Die jeweils
            aktuelle Fassung finden Sie stets auf dieser Seite. Es gilt die zum Zeitpunkt
            der Nutzung veröffentlichte Version.
          </p>
        </section>
      </article>
    </main>

    <footer class="legal-footer">
      <div class="container">
        <div class="footer-links">
          <a routerLink="/">Startseite</a>
          <a routerLink="/impressum">Impressum</a>
          <a routerLink="/datenschutz">Datenschutz</a>
          <a routerLink="/haftungsausschluss" class="active">Haftungsausschluss</a>
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

    .disclaimer-banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #fff5f5, #fee2e2);
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      margin-bottom: 2.5rem;
      font-size: 0.95rem;
      line-height: 1.7;
      color: var(--color-text);
    }

    .banner-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
      line-height: 1;
      margin-top: 2px;
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
export class HaftungsausschlussPageComponent {
  readonly currentYear = new Date().getFullYear();
}

