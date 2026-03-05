import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-problem-section',
  standalone: true,
  imports: [ScrollAnimateDirective, CountUpDirective],
  template: `
    <section class="problem-section" id="so-funktionierts">
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="section-tag">⚠️ Das Problem</span>
          <h2 class="section-title">Warum Sie Ihre Rente <span class="text-danger-gradient">jetzt prüfen</span> müssen</h2>
          <p class="section-subtitle">
            Die meisten Deutschen verlassen sich auf ihre gesetzliche Rente — ohne zu wissen,
            wie viel nach allen Abzügen tatsächlich übrig bleibt.
          </p>
        </div>

        <div class="problem-grid">
          <div class="problem-card" appScrollAnimate appScrollAnimateDelay="delay-1">
            <div class="problem-icon-wrap danger">
              <span class="problem-icon">📉</span>
            </div>
            <h3 class="problem-card-title">Inflation frisst Ihre Rente</h3>
            <p class="problem-card-text">
              Bei nur 2% Inflation verliert Ihre Rente in 30 Jahren fast die Hälfte ihrer Kaufkraft.
              Aus 1.500€ werden real nur noch ~830€.
            </p>
            <div class="problem-stat">
              <span class="stat-big" [appCountUp]="48" countUpSuffix="%" [countUpDuration]="2500"></span>
              <span class="stat-desc">Kaufkraftverlust in 30 Jahren</span>
            </div>
          </div>

          <div class="problem-card" appScrollAnimate appScrollAnimateDelay="delay-2">
            <div class="problem-icon-wrap warning">
              <span class="problem-icon">🏛️</span>
            </div>
            <h3 class="problem-card-title">Steuern & Sozialabgaben</h3>
            <p class="problem-card-text">
              Von Ihrer Bruttorente gehen noch Einkommensteuer (<a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG</a>), Krankenversicherung (<a href="https://www.gkv-spitzenverband.de" target="_blank" rel="noopener">KVdR</a>)
              und Pflegeversicherung ab.
            </p>
            <div class="problem-stat">
              <span class="stat-big" [appCountUp]="22" countUpSuffix="%" [countUpDuration]="2500"></span>
              <span class="stat-desc">durchschnittliche Abzüge</span>
            </div>
          </div>

          <div class="problem-card" appScrollAnimate appScrollAnimateDelay="delay-3">
            <div class="problem-icon-wrap accent">
              <span class="problem-icon">🕳️</span>
            </div>
            <h3 class="problem-card-title">Die versteckte Rentenlücke</h3>
            <p class="problem-card-text">
              Die Differenz zwischen dem gewünschten Lebensstandard und der realen Rente
              ist bei den meisten Deutschen alarmierend groß.
            </p>
            <div class="problem-stat">
              <span class="stat-big" [appCountUp]="780" countUpPrefix="~" countUpSuffix="€" [countUpDuration]="2500"></span>
              <span class="stat-desc">monatliche Lücke im Schnitt</span>
            </div>
          </div>
        </div>

        <!-- Visual comparison -->
        <div class="comparison-bar" appScrollAnimate>
          <div class="comparison-header">
            <h3>Was Sie erwarten vs. was Sie bekommen</h3>
          </div>
          <div class="comparison-visual">
            <div class="bar-group">
              <div class="bar-label">Bruttorente</div>
              <div class="bar-track">
                <div class="bar-fill full" style="width: 100%">
                  <span>1.500 €</span>
                </div>
              </div>
            </div>
            <div class="bar-group">
              <div class="bar-label">Nach Steuern & Abgaben</div>
              <div class="bar-track">
                <div class="bar-fill medium" style="width: 78%">
                  <span>1.170 €</span>
                </div>
              </div>
            </div>
            <div class="bar-group">
              <div class="bar-label">Reale Kaufkraft (30 J.)</div>
              <div class="bar-track">
                <div class="bar-fill low" style="width: 45%">
                  <span>~680 €</span>
                </div>
              </div>
            </div>
          </div>
          <p class="comparison-note">
            * Beispielrechnung: Bruttorente 1.500€, Renteneintritt 2040, Alleinstehend, 2% Inflation
          </p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .problem-section {
      padding: 6rem 0;
      background: var(--color-bg);
      position: relative;
    }

    .section-header {
      text-align: center;
      max-width: 700px;
      margin: 0 auto 4rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(233, 69, 96, 0.08);
      color: var(--color-danger);
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

    .text-danger-gradient {
      background: linear-gradient(135deg, #e94560, #f39c12);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: var(--color-text-light);
      line-height: 1.7;
    }

    .problem-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .problem-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .problem-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-lg);
    }

    .problem-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .problem-icon-wrap.danger { background: rgba(233, 69, 96, 0.1); }
    .problem-icon-wrap.warning { background: rgba(243, 156, 18, 0.1); }
    .problem-icon-wrap.accent { background: rgba(15, 52, 96, 0.1); }

    .problem-icon {
      font-size: 1.75rem;
    }

    .problem-card-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
    }

    .problem-card-text {
      font-size: 0.92rem;
      color: var(--color-text-light);
      line-height: 1.7;
      margin-bottom: 1.25rem;
    }

    .problem-card-text a {
      color: var(--color-accent);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .problem-card-text a:hover {
      color: var(--color-primary);
    }

    .problem-stat {
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .stat-big {
      font-size: 2rem;
      font-weight: 900;
      color: var(--color-danger);
      display: block;
      line-height: 1.2;
    }

    .stat-desc {
      font-size: 0.8rem;
      color: var(--color-text-light);
    }

    /* Comparison bar */
    .comparison-bar {
      background: white;
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      box-shadow: var(--shadow-md);
      max-width: 700px;
      margin: 0 auto;
    }

    .comparison-header h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .comparison-visual {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .bar-group {
      display: grid;
      grid-template-columns: 200px 1fr;
      align-items: center;
      gap: 1rem;
    }

    .bar-label {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--color-text);
      text-align: right;
    }

    .bar-track {
      background: #f1f5f9;
      border-radius: 8px;
      height: 40px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 1rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: white;
      transition: width 1.5s ease-out;
    }

    .bar-fill.full { background: linear-gradient(135deg, var(--color-accent), #1a5276); }
    .bar-fill.medium { background: linear-gradient(135deg, var(--color-warning), #e67e22); }
    .bar-fill.low { background: linear-gradient(135deg, var(--color-danger), #c0392b); }

    .comparison-note {
      font-size: 0.78rem;
      color: var(--color-text-light);
      text-align: center;
      margin-top: 1.25rem;
      font-style: italic;
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
      .problem-grid {
        grid-template-columns: 1fr;
      }

      .bar-group {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }

      .bar-label {
        text-align: left;
        font-size: 0.8rem;
      }

      .comparison-bar {
        padding: 1.5rem;
      }
    }
  `]
})
export class ProblemSectionComponent {}

