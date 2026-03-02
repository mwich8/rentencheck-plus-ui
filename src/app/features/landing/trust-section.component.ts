import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-trust-section',
  standalone: true,
  imports: [ScrollAnimateDirective],
  template: `
    <section class="trust-section">
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="section-tag">🔒 Vertrauenswürdig & Transparent</span>
          <h2 class="section-title">Basiert auf <span class="text-accent-gradient">offiziellen Daten</span></h2>
          <p class="section-subtitle">
            Unsere Berechnungen verwenden ausschließlich die aktuellen gesetzlichen Grundlagen —
            transparent und nachvollziehbar.
          </p>
        </div>

        <div class="trust-grid">
          <div class="trust-card" appScrollAnimate appScrollAnimateDelay="delay-1">
            <div class="trust-icon">⚖️</div>
            <h3>§32a EStG</h3>
            <p>Einkommensteuerberechnung nach aktuellem Einkommensteuergesetz 2025/2026</p>
          </div>

          <div class="trust-card" appScrollAnimate appScrollAnimateDelay="delay-2">
            <div class="trust-icon">🏥</div>
            <h3>KVdR-Sätze</h3>
            <p>Aktuelle Beitragssätze der Krankenversicherung der Rentner (GKV-Spitzenverband)</p>
          </div>

          <div class="trust-card" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="trust-icon">📋</div>
            <h3>§22 Nr. 1 EStG</h3>
            <p>Besteuerungsanteil gemäß Wachstumschancengesetz korrekt berücksichtigt</p>
          </div>

          <div class="trust-card" appScrollAnimate appScrollAnimateDelay="delay-1">
            <div class="trust-icon">🛡️</div>
            <h3>DSGVO-konform</h3>
            <p>Alle Berechnungen laufen lokal in Ihrem Browser — keine Daten werden gesendet</p>
          </div>

          <div class="trust-card" appScrollAnimate appScrollAnimateDelay="delay-2">
            <div class="trust-icon">⚡</div>
            <h3>Echtzeit-Berechnung</h3>
            <p>Sofortige Ergebnisse dank Client-Side-Berechnung — kein Server-Roundtrip nötig</p>
          </div>

          <div class="trust-card" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="trust-icon">🔄</div>
            <h3>Immer aktuell</h3>
            <p>Steuertabellen und Sozialversicherungssätze werden regelmäßig aktualisiert</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .trust-section {
      padding: 6rem 0;
      background: linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%);
      color: white;
    }

    .section-header {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 4rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 900;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .text-accent-gradient {
      background: linear-gradient(135deg, #3498db, #2ecc71);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.7;
    }

    .trust-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .trust-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      padding: 2rem;
      text-align: center;
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
    }

    .trust-card:hover {
      transform: translateY(-4px);
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .trust-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .trust-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: white;
    }

    .trust-card p {
      font-size: 0.88rem;
      color: rgba(255, 255, 255, 0.55);
      line-height: 1.6;
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
      .trust-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TrustSectionComponent {}

