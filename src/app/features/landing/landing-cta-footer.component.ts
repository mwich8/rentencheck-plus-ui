import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-landing-cta-footer',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  template: `
    <!-- Final CTA -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-inner" appScrollAnimate>
          <h2 class="cta-title">
            Bereit, die Wahrheit<br>
            <span class="cta-highlight">über Ihre Rente</span> zu erfahren?
          </h2>
          <p class="cta-desc">
            In weniger als 60 Sekunden wissen Sie, wie groß Ihre Rentenlücke wirklich ist.
            Kostenlos und ohne Registrierung.
          </p>
          <a routerLink="/rechner" class="cta-button">
            <span>Jetzt kostenlos berechnen</span>
            <span class="cta-arrow">→</span>
          </a>
          <div class="cta-badges">
            <span>✓ 100% kostenloser Schnell-Check</span>
            <span>✓ Keine E-Mail nötig</span>
            <span>✓ Sofort-Ergebnis</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="container footer-content">
        <div class="footer-grid">
          <div class="footer-col">
            <h3 class="footer-brand">RentenCheck<span class="brand-plus">+</span></h3>
            <p class="footer-tagline">
              Die brutale Wahrheit über Ihre Rente — basierend auf offiziellen deutschen Steuer- und Sozialversicherungsdaten.
            </p>
          </div>
          <div class="footer-col">
            <h4>Rechtsgrundlagen</h4>
            <ul>
              <li>§32a EStG 2025/2026</li>
              <li>KVdR-Beitragssätze (GKV)</li>
              <li>§22 Nr. 1 EStG</li>
              <li>§55 SGB XI</li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Rechtliches</h4>
            <ul>
              <li><a href="#">Datenschutz</a></li>
              <li><a href="#">Impressum</a></li>
              <li><a href="#">Haftungsausschluss</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© {{ currentYear }} RentenCheck+ — Alle Rechte vorbehalten. Keine Steuer- oder Finanzberatung.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* Final CTA Section */
    .cta-section {
      padding: 6rem 0;
      background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%);
      position: relative;
      overflow: hidden;
    }

    .cta-section::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(233, 69, 96, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }

    .cta-inner {
      text-align: center;
      position: relative;
      z-index: 2;
      max-width: 700px;
      margin: 0 auto;
    }

    .cta-title {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 900;
      color: white;
      line-height: 1.2;
      margin-bottom: 1.25rem;
    }

    .cta-highlight {
      background: linear-gradient(135deg, #e94560, #f39c12);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .cta-desc {
      font-size: 1.15rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.7;
      margin-bottom: 2.5rem;
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.15rem 3rem;
      background: linear-gradient(135deg, #e94560, #c73e54);
      color: white;
      font-size: 1.2rem;
      font-weight: 700;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 25px rgba(233, 69, 96, 0.4);
      position: relative;
      overflow: hidden;
    }

    .cta-button::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent, rgba(255,255,255,0.15));
      opacity: 0;
      transition: opacity 0.3s;
    }

    .cta-button:hover::after {
      opacity: 1;
    }

    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 40px rgba(233, 69, 96, 0.5);
    }

    .cta-arrow {
      font-size: 1.3rem;
      transition: transform 0.3s;
    }

    .cta-button:hover .cta-arrow {
      transform: translateX(4px);
    }

    .cta-badges {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1.75rem;
      flex-wrap: wrap;
    }

    .cta-badges span {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.5);
    }

    /* Footer */
    .landing-footer {
      background: #0a0a14;
      color: rgba(255, 255, 255, 0.7);
      padding: 3rem 0 1.5rem;
    }

    .footer-content {
      max-width: 1000px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 3rem;
      margin-bottom: 2.5rem;
    }

    .footer-brand {
      font-size: 1.5rem;
      font-weight: 900;
      color: white;
      margin-bottom: 0.75rem;
    }

    .brand-plus {
      color: #e94560;
    }

    .footer-tagline {
      font-size: 0.88rem;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.45);
    }

    .footer-col h4 {
      font-size: 0.9rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-col ul {
      list-style: none;
      padding: 0;
    }

    .footer-col li {
      padding: 0.3rem 0;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.45);
    }

    .footer-col a {
      color: rgba(255, 255, 255, 0.45);
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-col a:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.25rem;
      text-align: center;
    }

    .footer-bottom p {
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.3);
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

    @media (max-width: 768px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .cta-badges {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class LandingCtaFooterComponent {
  readonly currentYear = new Date().getFullYear();
}

