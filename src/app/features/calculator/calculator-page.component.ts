import { Component, inject, computed, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InputPanelComponent } from './input-panel/input-panel.component';
import { ResultPanelComponent } from './result-panel/result-panel.component';
import { WaterfallChartComponent } from '../chart/waterfall-chart.component';
import { ProjectionChartComponent } from '../chart/projection-chart.component';
import { PricingTierComponent } from './pricing-tier/pricing-tier.component';
import { ActionTipsComponent } from './action-tips/action-tips.component';
import { PremiumTeaserComponent } from './premium-teaser/premium-teaser.component';
import { PensionCalculatorService } from '../../core/services/pension-calculator.service';
import { DEFAULT_PENSION_INPUT } from '../../core/models/pension-input.model';

/**
 * Calculator page — the main pension calculator tool.
 * Previously the root AppComponent, now lazy-loaded at /rechner.
 */
@Component({
  selector: 'app-calculator-page',
  standalone: true,
  imports: [
    RouterLink,
    InputPanelComponent,
    ResultPanelComponent,
    WaterfallChartComponent,
    ProjectionChartComponent,
    PricingTierComponent,
    ActionTipsComponent,
    PremiumTeaserComponent,
  ],
  template: `
    <!-- Compact Navbar -->
    <nav class="calc-navbar">
      <div class="container nav-inner">
        <a routerLink="/" class="nav-brand">
          RentenCheck<span class="brand-plus">+</span>
        </a>
        <div class="nav-badges">
          <span class="nav-badge">✓ Kostenlos</span>
          <span class="nav-badge">✓ §32a EStG-konform</span>
        </div>
      </div>
    </nav>

    <!-- Hero Header -->
    <header class="hero bg-gradient-dark">
      <div class="container hero-content">
        <h1 class="hero-title">
          Die brutale Wahrheit<br>
          <span class="hero-highlight">über Ihre Rente</span>
        </h1>
        <p class="hero-subtitle">
          Erfahren Sie, was von Ihrer gesetzlichen Rente wirklich übrig bleibt —
          nach Steuern, Sozialabgaben und Inflation.
        </p>
        <div class="hero-cta">
          <span class="hero-badge">✓ Kostenlos</span>
          <span class="hero-badge">✓ Sofort-Ergebnis</span>
          <span class="hero-badge">✓ §32a EStG-konform</span>
        </div>
        <a href="#rechner" class="scroll-cta" aria-label="Zum Rechner scrollen">
          <span class="scroll-arrow">↓</span>
        </a>
      </div>
    </header>

    <!-- Main Calculator Grid -->
    <main class="container calculator-section" id="rechner">
      <div class="calculator-grid">
        <!-- Left Column: Input -->
        <div class="card input-card animate-fade-in-up">
          <app-input-panel />
        </div>

        <!-- Right Column: Results -->
        <div class="card result-card animate-fade-in-up" style="animation-delay: 0.15s">
          <app-result-panel [result]="pensionResult()" [gewuenschteRente]="gewuenschteRente()" />
        </div>
      </div>

      <!-- Action Tips Section -->
      @if (pensionResult().rentenluecke > 0) {
        <div class="action-tips-section animate-fade-in-up" style="animation-delay: 0.25s">
          <app-action-tips [result]="pensionResult()" />
        </div>
      }

      <!-- Charts Section -->
      <div class="charts-section animate-fade-in-up" style="animation-delay: 0.3s">
        <div class="card chart-card">
          <app-waterfall-chart [result]="pensionResult()" />
        </div>
        <div class="card chart-card">
          <app-projection-chart [result]="pensionResult()" />
        </div>
      </div>

      <!-- Premium Teasers -->
      <div class="premium-teaser-section animate-fade-in-up" style="animation-delay: 0.4s">
        <app-premium-teaser (unlock)="onTierSelected($event)" />
      </div>

      <!-- Pricing Section -->
      <app-pricing-tier (tierSelected)="onTierSelected($event)" />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-content">
        <div class="footer-disclaimer">
          <h4>⚖️ Haftungsausschluss</h4>
          <p>
            RentenCheck+ ist ein Informationstool und ersetzt keine individuelle Steuer- oder
            Finanzberatung. Die Berechnungen basieren auf den aktuellen gesetzlichen Grundlagen
            (§32a EStG, KVdR-Sätze 2026) und können von Ihrer tatsächlichen steuerlichen
            Situation abweichen. Keine Gewähr für die Richtigkeit der Berechnungen.
          </p>
        </div>
        <div class="footer-sources">
          <h4>📚 Datenquellen</h4>
          <ul>
            <li>Einkommensteuer: §32a EStG 2025/2026</li>
            <li>KVdR-Beitragssätze: GKV-Spitzenverband</li>
            <li>Besteuerungsanteil: §22 Nr. 1 EStG (Wachstumschancengesetz)</li>
            <li>Pflegeversicherung: §55 SGB XI</li>
          </ul>
        </div>
        <div class="footer-bottom">
          <div class="footer-legal-links">
            <a routerLink="/impressum">Impressum</a>
            <span class="footer-dot">·</span>
            <a routerLink="/datenschutz">Datenschutz</a>
            <span class="footer-dot">·</span>
            <a routerLink="/haftungsausschluss">Haftungsausschluss</a>
          </div>
          <p>© {{ currentYear }} RentenCheck+ — Alle Rechte vorbehalten</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* ==========================================
       Navbar
       ========================================== */
    .calc-navbar {
      background: var(--color-primary);
      padding: 0.75rem 0;
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

    .brand-plus {
      color: #e94560;
    }

    .nav-badges {
      display: flex;
      gap: 0.75rem;
    }

    .nav-badge {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    /* ==========================================
       Hero Section
       ========================================== */
    .hero {
      padding: 4rem 0 3.5rem;
      text-align: center;
      color: white;
    }

    .hero-content {
      max-width: 700px;
    }

    .hero-title {
      font-size: 2.75rem;
      font-weight: 900;
      line-height: 1.15;
      margin-bottom: 1.25rem;
      letter-spacing: -0.02em;
    }

    .hero-highlight {
      background: linear-gradient(135deg, #e94560, #f39c12);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.85);
      max-width: 550px;
      margin: 0 auto 1.75rem;
      font-weight: 400;
    }

    .hero-cta {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.45rem 1rem;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
    }

    .scroll-cta {
      display: inline-block;
      margin-top: 2rem;
      text-decoration: none;
    }

    .scroll-arrow {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.8);
      font-size: 1.25rem;
      animation: bounceDown 2s ease-in-out infinite;
      transition: border-color 0.2s, color 0.2s;
    }

    .scroll-cta:hover .scroll-arrow {
      border-color: rgba(255, 255, 255, 0.6);
      color: white;
    }

    @keyframes bounceDown {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(6px); }
    }

    /* ==========================================
       Calculator Section
       ========================================== */
    .calculator-section {
      margin-top: -2rem;
      position: relative;
      z-index: 1;
      padding-bottom: 3rem;
    }

    .calculator-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
      margin-bottom: 1.75rem;
    }

    .input-card {
      position: sticky;
      top: 1.5rem;
      align-self: start;
    }

    .result-card {
      min-height: 400px;
    }

    /* ==========================================
       Charts Section
       ========================================== */
    .charts-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
      margin-bottom: 1.75rem;
    }

    .chart-card {
      overflow: hidden;
    }

    /* ==========================================
       Action Tips Section
       ========================================== */
    .action-tips-section {
      margin-bottom: 1.75rem;
    }

    /* ==========================================
       Premium Teaser Section
       ========================================== */
    .premium-teaser-section {
      margin-bottom: 1.75rem;
    }

    /* ==========================================
       Footer
       ========================================== */
    .footer {
      background: var(--color-primary);
      color: rgba(255, 255, 255, 0.85);
      padding: 3rem 0 1.5rem;
      margin-top: 3rem;
    }

    .footer-content {
      max-width: 800px;
    }

    .footer-disclaimer, .footer-sources {
      margin-bottom: 2rem;
    }

    .footer-disclaimer h4, .footer-sources h4 {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.75rem;
    }

    .footer-disclaimer p {
      font-size: 0.85rem;
      line-height: 1.8;
      color: rgba(255, 255, 255, 0.72);
    }

    .footer-sources ul {
      list-style: none;
      padding: 0;
    }

    .footer-sources li {
      font-size: 0.85rem;
      padding: 0.3rem 0;
      color: rgba(255, 255, 255, 0.68);
    }

    .footer-sources li::before {
      content: '›';
      margin-right: 0.5rem;
      color: var(--color-danger);
      font-weight: 700;
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 1.25rem;
      text-align: center;
    }

    .footer-legal-links {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .footer-legal-links a {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-legal-links a:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    .footer-dot {
      color: rgba(255, 255, 255, 0.25);
      font-size: 0.8rem;
    }

    .footer-bottom p {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.45);
    }

    /* ==========================================
       Responsive
       ========================================== */
    @media (max-width: 1024px) {
      .calculator-grid {
        grid-template-columns: 1fr;
      }

      .input-card {
        position: static;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 0 2.5rem;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .hero-cta {
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .calculator-section {
        margin-top: -1.5rem;
      }

      .nav-badges {
        display: none;
      }
    }
  `],
})
export class CalculatorPageComponent {
  private readonly calculatorService = inject(PensionCalculatorService);
  private readonly inputPanel = viewChild(InputPanelComponent);

  readonly currentYear = new Date().getFullYear();

  /** Default result used before the input panel viewChild is resolved */
  private readonly defaultResult = this.calculatorService.calculate(DEFAULT_PENSION_INPUT);

  /** Expose gewuenschte Rente for the RentenScore */
  readonly gewuenschteRente = computed(() => {
    const panel = this.inputPanel();
    return panel ? panel.pensionInput().gewuenschteMonatlicheRente : DEFAULT_PENSION_INPUT.gewuenschteMonatlicheRente;
  });

  /**
   * Reactive pension result — recomputes instantly whenever any input signal changes.
   */
  readonly pensionResult = computed(() => {
    const panel = this.inputPanel();
    if (!panel) {
      return this.defaultResult;
    }
    return this.calculatorService.calculate(panel.pensionInput());
  });

  onTierSelected(tier: string): void {
    console.log(`Tier selected: ${tier}`);
    alert(`Das ${tier === 'report' ? 'Detail-Analyse' : 'Premium'}-Paket wird bald verfügbar sein! 🚀`);
  }
}

