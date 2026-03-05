import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  template: `
    <section class="features-section">
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="section-tag">✨ Unsere Leistungen</span>
          <h2 class="section-title">Das bieten wir Ihnen — <span class="text-success-gradient">vieles davon kostenlos</span></h2>
          <p class="section-subtitle">
            RentenCheck+ gibt Ihnen die Werkzeuge, um Ihre Rentensituation klar zu verstehen
            und die richtigen Entscheidungen zu treffen.
          </p>
        </div>

        <!-- Free features highlight -->
        <div class="free-banner" appScrollAnimate>
          <div class="free-banner-inner">
            <span class="free-badge">KOSTENLOS</span>
            <h3>Schnell-Check — sofort & gratis</h3>
            <p>Keine Anmeldung. Keine E-Mail. Einfach berechnen.</p>
          </div>
        </div>

        <div class="features-grid">
          <div class="feature-card" appScrollAnimate appScrollAnimateDelay="delay-1">
            <div class="feature-icon-wrap green">
              <span class="feature-icon">💰</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">Reale Kaufkraft berechnen</h3>
            <p class="feature-desc">
              Sehen Sie sofort, wie viel Ihre Rente in heutigen Euro wirklich wert sein wird —
              nach Inflation über den gesamten Rentenzeitraum.
            </p>
          </div>

          <div class="feature-card" appScrollAnimate appScrollAnimateDelay="delay-2">
            <div class="feature-icon-wrap green">
              <span class="feature-icon">📊</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">Rentenlücke anzeigen</h3>
            <p class="feature-desc">
              Erfahren Sie die exakte monatliche Differenz zwischen Ihrem Wunscheinkommen
              und Ihrer realen Rentenleistung.
            </p>
          </div>

          <div class="feature-card" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="feature-icon-wrap green">
              <span class="feature-icon">🧾</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">Steuer- & Abzugsübersicht</h3>
            <p class="feature-desc">
              Detaillierte Aufschlüsselung: Einkommensteuer (<a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG</a>),
              <a href="https://www.gkv-spitzenverband.de" target="_blank" rel="noopener">KVdR</a>-Beitrag, Pflegeversicherung — alles auf einen Blick.
            </p>
          </div>

          <div class="feature-card premium-feature" appScrollAnimate appScrollAnimateDelay="delay-1">
            <div class="feature-icon-wrap blue">
              <span class="feature-icon">📄</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">PDF Detail-Analyse</h3>
            <p class="feature-desc">
              Ihr personalisierter Report zum Ausdrucken oder Weiterleiten an Ihren
              Finanzberater — mit 30-Jahre-Inflationsprognose.
            </p>
          </div>

          <div class="feature-card premium-feature" appScrollAnimate appScrollAnimateDelay="delay-2">
            <div class="feature-icon-wrap blue">
              <span class="feature-icon">📘</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">ETF-Sparplan erklärt</h3>
            <p class="feature-desc">
              Verständlich erklärt: Was ETFs sind, warum sie langfristig funktionieren —
              mit Ihrem persönlichen Vermögensaufbau-Rechner.
            </p>
          </div>

          <div class="feature-card premium-feature" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="feature-icon-wrap purple">
              <span class="feature-icon">🔮</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">Multi-Szenario-Vergleich</h3>
            <p class="feature-desc">
              Verschiedene Renteneintrittsalter und Gehaltsverläufe
              im direkten Vergleich — Ihre beste Option auf einen Blick.
            </p>
          </div>

          <div class="feature-card premium-feature" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="feature-icon-wrap purple">
              <span class="feature-icon">🗓️</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">Renten-Zeitstrahl</h3>
            <p class="feature-desc">
              Ihr persönlicher Zeitstrahl: Meilensteine, Handlungsfenster
              und Kaufkraftentwicklung von heute bis zum Ruhestand.
            </p>
          </div>

          <div class="feature-card premium-feature" appScrollAnimate appScrollAnimateDelay="delay-4">
            <div class="feature-icon-wrap purple">
              <span class="feature-icon">🎯</span>
            </div>
            <div class="feature-label free-label">Kostenlos</div>
            <h3 class="feature-title">Optimierungsvorschläge</h3>
            <p class="feature-desc">
              Individuelle Empfehlungen, wie Sie Ihre Rentenlücke schließen können —
              mit konkreten Spar- und Anlagestrategien.
            </p>
          </div>
        </div>

        <div class="features-cta" appScrollAnimate>
          <a routerLink="/rechner" class="cta-primary">
            Kostenlos starten →
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .features-section {
      padding: 6rem 0;
      background: linear-gradient(180deg, var(--color-bg) 0%, white 100%);
    }

    .section-header {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 2rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(39, 174, 96, 0.08);
      color: var(--color-success);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 900;
      color: var(--color-primary);
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .text-success-gradient {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: var(--color-text-light);
      line-height: 1.7;
    }

    /* Free banner */
    .free-banner {
      max-width: 600px;
      margin: 0 auto 3rem;
    }

    .free-banner-inner {
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.08), rgba(46, 204, 113, 0.05));
      border: 2px dashed rgba(39, 174, 96, 0.3);
      border-radius: var(--radius-lg);
      padding: 1.5rem 2rem;
      text-align: center;
    }

    .free-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--color-success);
      color: white;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }

    .free-banner-inner h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.35rem;
    }

    .free-banner-inner p {
      font-size: 0.92rem;
      color: var(--color-text-light);
    }

    /* Features grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 2rem;
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .premium-feature {
      border-color: rgba(15, 52, 96, 0.15);
    }

    .feature-icon-wrap {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .feature-icon-wrap.green { background: rgba(39, 174, 96, 0.1); }
    .feature-icon-wrap.blue { background: rgba(15, 52, 96, 0.1); }
    .feature-icon-wrap.purple { background: rgba(142, 68, 173, 0.1); }

    .feature-icon {
      font-size: 1.5rem;
    }

    .feature-label {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .free-label {
      background: rgba(39, 174, 96, 0.1);
      color: var(--color-success);
    }

    .paid-label {
      background: rgba(15, 52, 96, 0.08);
      color: var(--color-accent);
    }

    .feature-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .feature-desc {
      font-size: 0.88rem;
      color: var(--color-text-light);
      line-height: 1.7;
    }

    .feature-desc a {
      color: var(--color-accent);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .feature-desc a:hover {
      color: var(--color-primary);
    }

    .features-cta {
      text-align: center;
    }

    .cta-primary {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #e94560, #c73e54);
      color: white;
      font-size: 1.1rem;
      font-weight: 700;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(233, 69, 96, 0.3);
    }

    .cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(233, 69, 96, 0.45);
    }

    /* Scroll animations */
    :host ::ng-deep .animate-on-scroll {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.7s ease-out, transform 0.7s ease-out;
    }

    :host ::ng-deep .animate-on-scroll.animate-visible {
      opacity: 1;
      transform: translateY(0);
    }

    :host ::ng-deep .delay-1 { transition-delay: 0.1s; }
    :host ::ng-deep .delay-2 { transition-delay: 0.25s; }
    :host ::ng-deep .delay-3 { transition-delay: 0.4s; }

    @media (max-width: 768px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FeaturesSectionComponent {}

