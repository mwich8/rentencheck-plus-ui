import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-landing-pricing',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  template: `
    <section class="pricing-section">
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="section-tag">💎 Transparente Preise</span>
          <h2 class="section-title">Wählen Sie Ihren <span class="text-gradient">Plan</span></h2>
          <p class="section-subtitle">
            Der Schnell-Check ist und bleibt kostenlos. Für tiefere Einblicke
            bieten wir faire Einmalpreise — kein Abo, keine versteckten Kosten.
          </p>
        </div>

        <div class="pricing-grid">
          <!-- Free Tier -->
          <div class="pricing-card" appScrollAnimate appScrollAnimateDelay="delay-1">
            <div class="tier-header">
              <span class="tier-badge free-badge">KOSTENLOS</span>
              <h3 class="tier-name">Schnell-Check</h3>
              <div class="tier-price">
                <span class="price-amount">0 €</span>
              </div>
              <p class="tier-desc">Sofort starten, keine Anmeldung</p>
            </div>
            <ul class="tier-features">
              <li class="included"><span class="check">✓</span> Reale Kaufkraft berechnen</li>
              <li class="included"><span class="check">✓</span> Rentenlücke anzeigen</li>
              <li class="included"><span class="check">✓</span> Steuer- & Abzugsübersicht</li>
              <li class="included"><span class="check">✓</span> Wasserfall-Diagramm</li>
              <li class="included"><span class="check">✓</span> Projektionsgrafik</li>
              <li class="excluded"><span class="cross">✗</span> PDF Detail-Report</li>
              <li class="excluded"><span class="cross">✗</span> Multi-Szenario-Vergleich</li>
              <li class="excluded"><span class="cross">✗</span> Optimierungsvorschläge</li>
            </ul>
            <a routerLink="/rechner" class="tier-button free-btn">
              Jetzt kostenlos starten →
            </a>
          </div>

          <!-- Report Tier -->
          <div class="pricing-card featured" appScrollAnimate appScrollAnimateDelay="delay-2">
            <div class="popular-ribbon">BELIEBT</div>
            <div class="tier-header">
              <span class="tier-badge report-badge">EINMAL-REPORT</span>
              <h3 class="tier-name">Detail-Analyse</h3>
              <div class="tier-price">
                <span class="price-amount">0 €</span>
                <span class="price-period">aktuell kostenlos</span>
              </div>
              <p class="tier-desc">Ihr persönlicher Renten-Report</p>
            </div>
            <ul class="tier-features">
              <li class="included"><span class="check">✓</span> Alles aus Schnell-Check</li>
              <li class="included highlight"><span class="check">✓</span> Detaillierter PDF-Report</li>
              <li class="included highlight"><span class="check">✓</span> Steuerberechnung nach §32a</li>
              <li class="included highlight"><span class="check">✓</span> 30-Jahre-Inflationsprognose</li>
              <li class="included highlight"><span class="check">✓</span> Persönliche Handlungsempfehlungen</li>
              <li class="included"><span class="check">✓</span> Zum Ausdrucken & Teilen</li>
              <li class="excluded"><span class="cross">✗</span> Multi-Szenario-Vergleich</li>
              <li class="excluded"><span class="cross">✗</span> Optimierungsvorschläge</li>
              <li class="excluded"><span class="cross">✗</span> Strategievergleich</li>
            </ul>
            <button class="tier-button report-btn">
              Kostenlos herunterladen →
            </button>
          </div>

          <!-- Premium Tier -->
          <div class="pricing-card" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="tier-header">
              <span class="tier-badge premium-badge">PREMIUM</span>
              <h3 class="tier-name">Renten-Strategie</h3>
              <div class="tier-price">
                <span class="price-amount">0 €</span>
                <span class="price-period">aktuell kostenlos</span>
              </div>
              <p class="tier-desc">Ihr kompletter Renten-Fahrplan</p>
            </div>
            <ul class="tier-features">
              <li class="included"><span class="check">✓</span> Alles aus Detail-Analyse</li>
              <li class="included highlight"><span class="check">✓</span> Multi-Szenario-Modellierung</li>
              <li class="included highlight"><span class="check">✓</span> Was-wäre-wenn-Szenarien</li>
              <li class="included highlight"><span class="check">✓</span> Optimierungsvorschläge</li>
              <li class="included highlight"><span class="check">✓</span> Strategievergleich</li>
              <li class="included"><span class="check">✓</span> Unbegrenzte Neuberechnung</li>
              <li class="included"><span class="check">✓</span> E-Mail-Support</li>
              <li class="included"><span class="check">✓</span> Zukünftige Updates inklusive</li>
            </ul>
            <button class="tier-button premium-btn">
              Kostenlos freischalten →
            </button>
          </div>
        </div>

        <p class="pricing-guarantee" appScrollAnimate>
          🔒 30-Tage-Geld-zurück-Garantie · Sichere Bezahlung · Kein Abo
        </p>
      </div>
    </section>
  `,
  styles: [`
    .pricing-section {
      padding: 6rem 0;
      background: var(--color-bg);
    }

    .section-header {
      text-align: center;
      max-width: 650px;
      margin: 0 auto 4rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(142, 68, 173, 0.08);
      color: #8e44ad;
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

    .text-gradient {
      background: linear-gradient(135deg, var(--color-accent), #8e44ad);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: var(--color-text-light);
      line-height: 1.7;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.75rem;
      max-width: 1050px;
      margin: 0 auto;
      align-items: start;
    }

    .pricing-card {
      background: white;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 2.5rem 2rem;
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .pricing-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-xl);
    }

    .pricing-card.featured {
      border-color: var(--color-accent);
      box-shadow: var(--shadow-lg), 0 0 0 1px rgba(15, 52, 96, 0.1);
      transform: scale(1.05);
      z-index: 2;
    }

    .pricing-card.featured:hover {
      transform: scale(1.05) translateY(-6px);
      box-shadow: var(--shadow-xl), 0 0 40px rgba(15, 52, 96, 0.15);
    }

    .popular-ribbon {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--color-accent), var(--color-danger));
      color: white;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 0.35rem 1.25rem;
      border-radius: 20px;
      letter-spacing: 0.12em;
      box-shadow: 0 4px 12px rgba(15, 52, 96, 0.3);
    }

    .tier-header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }

    .tier-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      display: inline-block;
      margin-bottom: 0.5rem;
    }

    .free-badge { color: var(--color-success); }
    .report-badge { color: var(--color-accent); }
    .premium-badge { color: #8e44ad; }

    .tier-name {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
    }

    .tier-price {
      margin-bottom: 0.5rem;
    }

    .price-amount {
      font-size: 3rem;
      font-weight: 900;
      color: var(--color-primary);
      line-height: 1;
    }

    .price-cents {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .price-period {
      display: block;
      font-size: 0.85rem;
      color: var(--color-text-light);
      margin-top: 0.25rem;
    }

    .tier-desc {
      font-size: 0.88rem;
      color: var(--color-text-light);
    }

    .tier-features {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
    }

    .tier-features li {
      padding: 0.5rem 0;
      font-size: 0.88rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tier-features li.included { color: var(--color-text); }
    .tier-features li.excluded { color: var(--color-text-light); opacity: 0.55; }

    .tier-features li.highlight {
      font-weight: 600;
    }

    .check {
      color: var(--color-success);
      font-weight: 700;
      flex-shrink: 0;
    }

    .cross {
      color: var(--color-text-light);
      flex-shrink: 0;
    }

    .tier-button {
      display: block;
      width: 100%;
      padding: 0.95rem 1.5rem;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      text-decoration: none;
    }

    .tier-button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .free-btn {
      background: linear-gradient(135deg, var(--color-success), #2ecc71);
      color: white;
      box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
    }

    .free-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
    }

    .report-btn {
      background: linear-gradient(135deg, var(--color-accent), #1a5276);
      color: white;
      box-shadow: 0 4px 15px rgba(15, 52, 96, 0.3);
    }

    .report-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(15, 52, 96, 0.4);
    }

    .premium-btn {
      background: linear-gradient(135deg, #8e44ad, #6c3483);
      color: white;
      box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
    }

    .premium-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
    }

    .coming-soon {
      opacity: 0.6;
      cursor: not-allowed;
      background: #adb5bd !important;
      box-shadow: none !important;
    }

    .coming-soon:hover {
      transform: none !important;
      box-shadow: none !important;
    }

    a.tier-button {
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .pricing-guarantee {
      text-align: center;
      margin-top: 2.5rem;
      font-size: 0.88rem;
      color: var(--color-text-light);
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
      .pricing-grid {
        grid-template-columns: 1fr;
        max-width: 400px;
      }

      .pricing-card.featured {
        transform: none;
        order: -1;
      }

      .pricing-card.featured:hover {
        transform: translateY(-6px);
      }
    }
  `]
})
export class LandingPricingComponent {}

