import { Component, output } from '@angular/core';

/**
 * Blurred premium feature previews that create desire to upgrade.
 * Shows locked previews of Multi-Szenario and PDF Report.
 */
@Component({
  selector: 'app-premium-teaser',
  standalone: true,
  template: `
    <div class="teaser-section">
      <h3 class="teaser-header">
        <span class="icon">🔒</span> Premium-Einblicke freischalten
      </h3>
      <p class="teaser-subtitle">
        Sehen Sie, was Ihnen die Premium-Version bietet — für fundierte Entscheidungen.
      </p>

      <div class="teaser-grid">
        <!-- Multi-Scenario Preview -->
        <div class="teaser-card">
          <div class="teaser-preview">
            <div class="blurred-content">
              <!-- Fake chart bars -->
              <div class="fake-chart">
                <div class="fake-bar" style="height: 70%; background: rgba(15,52,96,0.4);"></div>
                <div class="fake-bar" style="height: 85%; background: rgba(39,174,96,0.4);"></div>
                <div class="fake-bar" style="height: 55%; background: rgba(233,69,96,0.4);"></div>
                <div class="fake-bar" style="height: 92%; background: rgba(243,156,18,0.4);"></div>
                <div class="fake-bar" style="height: 65%; background: rgba(142,68,173,0.4);"></div>
              </div>
              <div class="fake-labels">
                <span>Szenario A</span>
                <span>Szenario B</span>
                <span>Szenario C</span>
                <span>Optimal</span>
                <span>Konservativ</span>
              </div>
            </div>
            <div class="lock-overlay">
              <div class="lock-badge">
                <span class="lock-icon">🔒</span>
                <span class="lock-text">Premium</span>
              </div>
            </div>
          </div>
          <div class="teaser-info">
            <h4>Multi-Szenario-Vergleich</h4>
            <p>Vergleichen Sie verschiedene Renteneintrittsalter, Gehaltsverläufe und Sparstrategien nebeneinander.</p>
            <ul class="teaser-features">
              <li>✓ Bis zu 5 Szenarien parallel</li>
              <li>✓ Was-wäre-wenn-Analyse</li>
              <li>✓ Optimale Strategie finden</li>
            </ul>
            <button class="teaser-cta premium" (click)="unlock.emit('premium')">
              Für 29,90 € freischalten →
            </button>
          </div>
        </div>

        <!-- PDF Report Preview -->
        <div class="teaser-card">
          <div class="teaser-preview">
            <div class="blurred-content">
              <!-- Fake document -->
              <div class="fake-document">
                <div class="fake-doc-header">
                  <div class="fake-logo"></div>
                  <div class="fake-text-block" style="width: 60%;"></div>
                </div>
                <div class="fake-text-block" style="width: 100%;"></div>
                <div class="fake-text-block" style="width: 90%;"></div>
                <div class="fake-text-block" style="width: 75%;"></div>
                <div class="fake-divider"></div>
                <div class="fake-table">
                  <div class="fake-row">
                    <div class="fake-text-block" style="width: 40%;"></div>
                    <div class="fake-text-block" style="width: 25%;"></div>
                  </div>
                  <div class="fake-row">
                    <div class="fake-text-block" style="width: 50%;"></div>
                    <div class="fake-text-block" style="width: 20%;"></div>
                  </div>
                  <div class="fake-row">
                    <div class="fake-text-block" style="width: 35%;"></div>
                    <div class="fake-text-block" style="width: 30%;"></div>
                  </div>
                </div>
                <div class="fake-divider"></div>
                <div class="fake-text-block" style="width: 85%;"></div>
                <div class="fake-text-block" style="width: 95%;"></div>
              </div>
            </div>
            <div class="lock-overlay">
              <div class="lock-badge">
                <span class="lock-icon">🔒</span>
                <span class="lock-text">Detail-Analyse</span>
              </div>
            </div>
          </div>
          <div class="teaser-info">
            <h4>Persönlicher PDF-Report</h4>
            <p>Ihr individueller Renten-Report — zum Ausdrucken, Teilen oder für den Finanzberater.</p>
            <ul class="teaser-features">
              <li>✓ 30-Jahre-Inflationsprognose</li>
              <li>✓ §32a-konforme Steuerberechnung</li>
              <li>✓ Professionelles Layout</li>
            </ul>
            <button class="teaser-cta report" (click)="unlock.emit('report')">
              Für 14,90 € freischalten →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teaser-section {
      margin-top: 1.75rem;
    }

    .teaser-header {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-primary);
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon { font-size: 1.4rem; }

    .teaser-subtitle {
      font-size: 0.92rem;
      color: var(--color-text-light);
      margin-bottom: 1.75rem;
    }

    .teaser-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.75rem;
    }

    .teaser-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      border: 1px solid var(--color-border);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .teaser-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    /* Blurred preview area */
    .teaser-preview {
      position: relative;
      height: 200px;
      overflow: hidden;
      background: linear-gradient(135deg, #f8fafc, #eef2ff);
    }

    .blurred-content {
      padding: 1.25rem;
      filter: blur(4px);
      opacity: 0.6;
      height: 100%;
    }

    /* Fake chart */
    .fake-chart {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
      height: 120px;
      padding: 0 1rem;
    }

    .fake-bar {
      flex: 1;
      border-radius: 4px 4px 0 0;
      transition: height 0.5s ease;
    }

    .fake-labels {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 1rem 0;
      font-size: 0.6rem;
      color: var(--color-text-light);
    }

    /* Fake document */
    .fake-document {
      padding: 0.5rem;
    }

    .fake-doc-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .fake-logo {
      width: 30px;
      height: 30px;
      background: rgba(15, 52, 96, 0.15);
      border-radius: 6px;
    }

    .fake-text-block {
      height: 8px;
      background: rgba(15, 52, 96, 0.1);
      border-radius: 4px;
      margin-bottom: 0.4rem;
    }

    .fake-divider {
      height: 1px;
      background: rgba(15, 52, 96, 0.08);
      margin: 0.5rem 0;
    }

    .fake-table {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .fake-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }

    /* Lock overlay */
    .lock-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(2px);
    }

    .lock-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      background: rgba(26, 26, 46, 0.9);
      color: white;
      border-radius: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .lock-icon { font-size: 1.1rem; }

    .lock-text {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    /* Info area */
    .teaser-info {
      padding: 1.5rem;
    }

    .teaser-info h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .teaser-info p {
      font-size: 0.88rem;
      color: var(--color-text-light);
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .teaser-features {
      list-style: none;
      padding: 0;
      margin-bottom: 1.25rem;
    }

    .teaser-features li {
      font-size: 0.82rem;
      color: var(--color-text);
      padding: 0.25rem 0;
      font-weight: 500;
    }

    .teaser-cta {
      width: 100%;
      padding: 0.85rem 1.5rem;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      color: white;
    }

    .teaser-cta.premium {
      background: linear-gradient(135deg, #8e44ad, #6c3483);
      box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
    }

    .teaser-cta.premium:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(142, 68, 173, 0.4);
    }

    .teaser-cta.report {
      background: linear-gradient(135deg, var(--color-accent), #1a5276);
      box-shadow: 0 4px 15px rgba(15, 52, 96, 0.3);
    }

    .teaser-cta.report:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(15, 52, 96, 0.4);
    }

    @media (max-width: 768px) {
      .teaser-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class PremiumTeaserComponent {
  readonly unlock = output<string>();
}

