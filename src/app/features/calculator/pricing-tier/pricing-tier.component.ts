import { Component, output } from '@angular/core';

export type PricingTier = 'free' | 'report' | 'premium';

/**
 * Pricing tier cards for monetization.
 * Three tiers: Free (shock moment), Report (€14.90), Premium (€29.90).
 */
@Component({
  selector: 'app-pricing-tier',
  standalone: true,
  template: `
    <div class="pricing-section">
      <h2 class="pricing-title">
        <span class="icon">💡</span> Handeln Sie jetzt
      </h2>
      <p class="pricing-subtitle">
        Verstehen Sie Ihre Rentenlücke im Detail — und schließen Sie sie.
      </p>

      <div class="pricing-grid">
        <!-- Free Tier -->
        <div class="pricing-card free">
          <div class="tier-badge">KOSTENLOS</div>
          <h3 class="tier-name">Schnell-Check</h3>
          <div class="tier-price">
            <span class="price-amount">0 €</span>
          </div>
          <ul class="tier-features">
            <li class="included">✓ Reale Kaufkraft berechnen</li>
            <li class="included">✓ Rentenlücke anzeigen</li>
            <li class="included">✓ Steuer- & Abzugsübersicht</li>
            <li class="excluded">✗ Detaillierter PDF-Report</li>
            <li class="excluded">✗ Multi-Szenario-Vergleich</li>
          </ul>
          <button class="tier-button free-btn" disabled>
            Aktiv
          </button>
        </div>

        <!-- Report Tier -->
        <div class="pricing-card report featured">
          <div class="popular-badge">BELIEBT</div>
          <div class="tier-badge report-badge">EINMAL-REPORT</div>
          <h3 class="tier-name">Detail-Analyse</h3>
          <div class="tier-price">
            <span class="price-amount">14,90 €</span>
            <span class="price-period">einmalig</span>
          </div>
          <ul class="tier-features">
            <li class="included">✓ Alles aus Schnell-Check</li>
            <li class="included">✓ Detaillierter PDF-Report</li>
            <li class="included">✓ Steuerberechnung nach §32a</li>
            <li class="included">✓ 30-Jahre-Inflationsprognose</li>
            <li class="excluded">✗ Multi-Szenario-Vergleich</li>
          </ul>
          <button class="tier-button report-btn" (click)="tierSelected.emit('report')">
            Report kaufen →
          </button>
        </div>

        <!-- Premium Tier -->
        <div class="pricing-card premium">
          <div class="tier-badge premium-badge">PREMIUM</div>
          <h3 class="tier-name">Renten-Strategie</h3>
          <div class="tier-price">
            <span class="price-amount">29,90 €</span>
            <span class="price-period">einmalig</span>
          </div>
          <ul class="tier-features">
            <li class="included">✓ Alles aus Detail-Analyse</li>
            <li class="included">✓ Multi-Szenario-Modellierung</li>
            <li class="included">✓ Was-wäre-wenn-Szenarien</li>
            <li class="included">✓ Optimierungsvorschläge</li>
            <li class="included">✓ Vergleich verschiedener Strategien</li>
          </ul>
          <button class="tier-button premium-btn" (click)="tierSelected.emit('premium')">
            Premium freischalten →
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pricing-section {
      text-align: center;
      margin-top: 3rem;
      padding-top: 3rem;
      border-top: 2px solid var(--color-border);
    }

    .pricing-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .icon {
      font-size: 1.75rem;
    }

    .pricing-subtitle {
      font-size: 1rem;
      color: var(--color-text-light);
      margin-bottom: 2.5rem;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
    }

    .pricing-card {
      background: var(--color-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem 1.5rem;
      text-align: center;
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .pricing-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .pricing-card.featured {
      border-color: var(--color-accent);
      box-shadow: var(--shadow-lg);
      transform: scale(1.04);
    }

    .pricing-card.featured:hover {
      transform: scale(1.04) translateY(-4px);
      box-shadow: var(--shadow-xl);
    }

    .popular-badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--color-accent), var(--color-danger));
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.3rem 1rem;
      border-radius: 20px;
      letter-spacing: 0.1em;
    }

    .tier-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-light);
      margin-bottom: 0.5rem;
    }

    .tier-badge.report-badge {
      color: var(--color-accent);
    }

    .tier-badge.premium-badge {
      color: #8e44ad;
    }

    .tier-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 1rem;
    }

    .tier-price {
      margin-bottom: 1.5rem;
    }

    .price-amount {
      font-size: 2.5rem;
      font-weight: 900;
      color: var(--color-primary);
      font-variant-numeric: tabular-nums;
    }

    .price-period {
      display: block;
      font-size: 0.85rem;
      color: var(--color-text-light);
      margin-top: 0.25rem;
    }

    .tier-features {
      list-style: none;
      text-align: left;
      margin-bottom: 1.5rem;
      padding: 0;
    }

    .tier-features li {
      padding: 0.4rem 0;
      font-size: 0.88rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .tier-features li:last-child {
      border-bottom: none;
    }

    .tier-features li.included {
      color: var(--color-text);
    }

    .tier-features li.excluded {
      color: var(--color-text-light);
      opacity: 0.6;
    }

    .tier-button {
      width: 100%;
      padding: 0.85rem 1.5rem;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.02em;
    }

    .tier-button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .free-btn {
      background: #f1f5f9;
      color: var(--color-text-light);
      cursor: default;
    }

    .report-btn {
      background: linear-gradient(135deg, var(--color-accent), #1a5276);
      color: white;
    }

    .report-btn:hover {
      box-shadow: 0 4px 15px rgba(15, 52, 96, 0.4);
      transform: translateY(-1px);
    }

    .premium-btn {
      background: linear-gradient(135deg, #8e44ad, #6c3483);
      color: white;
    }

    .premium-btn:hover {
      box-shadow: 0 4px 15px rgba(142, 68, 173, 0.4);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .pricing-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      .pricing-card.featured {
        transform: none;
        order: -1;
      }

      .pricing-card.featured:hover {
        transform: translateY(-4px);
      }
    }
  `],
})
export class PricingTierComponent {
  readonly tierSelected = output<PricingTier>();
}



