import { Component, input, computed, inject, output } from '@angular/core';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionResult } from '../../../core/models/pension-result.model';
import { SavingsCalculatorService } from '../../../core/services/savings-calculator.service';

interface ActionTip {
  icon: string;
  title: string;
  description: string;
  highlight: string;
  type: 'savings' | 'strategy' | 'info' | 'warning';
}

/**
 * Personalized action tips based on the user's specific pension gap.
 * Shows concrete, actionable steps to close the gap — major free-tier value.
 */
@Component({
  selector: 'app-action-tips',
  standalone: true,
  imports: [EuroPipe],
  template: `
    <div class="tips-section">
      <h3 class="tips-title">
        <span class="icon">🎯</span> Ihre persönlichen Handlungsempfehlungen
      </h3>
      <p class="tips-subtitle">
        @if (result().rentenluecke > 0) {
          Basierend auf Ihrer Rentenlücke von <strong>{{ result().rentenluecke | euro }}</strong>/Monat
        } @else {
          Ihre Rente deckt Ihren Wunsch — hier sind Tipps zur Optimierung
        }
      </p>

      <!-- Free tips (first 2) -->
      <div class="tips-grid">
        @for (tip of freeTips(); track tip.title) {
          <div class="tip-card" [attr.data-type]="tip.type">
            <div class="tip-icon-wrap" [attr.data-type]="tip.type">
              <span class="tip-icon">{{ tip.icon }}</span>
            </div>
            <div class="tip-content">
              <h4 class="tip-title">{{ tip.title }}</h4>
              <p class="tip-description">{{ tip.description }}</p>
              <div class="tip-highlight" [attr.data-type]="tip.type">
                {{ tip.highlight }}
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Locked tips (remaining) -->
      @if (lockedTips().length > 0) {
        <div class="locked-tips-section">
          <div class="locked-tips-header">
            <span class="locked-tips-icon">🔒</span>
            <span>{{ lockedTips().length }} weitere Empfehlungen im PDF-Report</span>
          </div>
          <div class="locked-tips-grid">
            @for (tip of lockedTips(); track tip.title) {
              <div class="tip-card locked" [attr.data-type]="tip.type">
                <div class="tip-icon-wrap" [attr.data-type]="tip.type">
                  <span class="tip-icon">{{ tip.icon }}</span>
                </div>
                <div class="tip-content">
                  <h4 class="tip-title">{{ tip.title }}</h4>
                  <p class="tip-description">{{ tip.description }}</p>
                  <div class="tip-highlight" [attr.data-type]="tip.type">
                    {{ tip.highlight }}
                  </div>
                </div>
              </div>
            }
            <div class="locked-tips-overlay">
              <div class="locked-tips-overlay-content">
                <span class="locked-overlay-badge">🔒 Im PDF-Report enthalten</span>
                <button class="locked-tips-cta" (click)="unlock.emit('report')">
                  Alle Empfehlungen freischalten →
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (result().rentenluecke > 0) {
        <div class="savings-comparison">
          <h4 class="comparison-title">💡 ETF-Sparplan vs. Sparkonto im Vergleich</h4>
          <div class="comparison-grid">
            <div class="comparison-card etf">
              <div class="comparison-label">ETF-Sparplan (7% p.a.)</div>
              <div class="comparison-amount">{{ etfMonthly() | euro }}<span class="per-month">/Monat</span></div>
              <div class="comparison-detail">
                → {{ etfProjection().endkapital | euro }} Endkapital
              </div>
              <div class="comparison-payout">
                = {{ etfProjection().monatlicheAuszahlung | euro }}/Monat Auszahlung
              </div>
            </div>
            <div class="comparison-vs">vs.</div>
            <div class="comparison-card savings">
              <div class="comparison-label">Sparkonto (1,5% p.a.)</div>
              <div class="comparison-amount">{{ savingsMonthly() | euro }}<span class="per-month">/Monat</span></div>
              <div class="comparison-detail">
                → {{ savingsProjection().endkapital | euro }} Endkapital
              </div>
              <div class="comparison-payout">
                = {{ savingsProjection().monatlicheAuszahlung | euro }}/Monat Auszahlung
              </div>
            </div>
          </div>
          <p class="comparison-note">
            * Bei {{ result().jahresBisRente }} Jahren Ansparzeit und 25 Jahren Auszahlungsdauer.
            Keine Anlageberatung — nur zur Orientierung.
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .tips-section {
      padding: 2rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .tips-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .icon { font-size: 1.3rem; }

    .tips-subtitle {
      font-size: 0.88rem;
      color: var(--color-text-light);
      margin-bottom: 1.5rem;
    }

    .tips-subtitle strong {
      color: var(--color-danger);
      font-weight: 700;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .tip-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .tip-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .tip-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .tip-icon-wrap[data-type="savings"] { background: rgba(39, 174, 96, 0.1); }
    .tip-icon-wrap[data-type="strategy"] { background: rgba(15, 52, 96, 0.1); }
    .tip-icon-wrap[data-type="info"] { background: rgba(52, 152, 219, 0.1); }
    .tip-icon-wrap[data-type="warning"] { background: rgba(243, 156, 18, 0.1); }

    .tip-icon { font-size: 1.3rem; }

    .tip-content { flex: 1; min-width: 0; }

    .tip-title {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.3rem;
    }

    .tip-description {
      font-size: 0.82rem;
      color: var(--color-text-light);
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }

    .tip-highlight {
      font-size: 0.82rem;
      font-weight: 700;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      display: inline-block;
    }

    .tip-highlight[data-type="savings"] { background: rgba(39,174,96,0.08); color: var(--color-success); }
    .tip-highlight[data-type="strategy"] { background: rgba(15,52,96,0.06); color: var(--color-accent); }
    .tip-highlight[data-type="info"] { background: rgba(52,152,219,0.08); color: #2980b9; }
    .tip-highlight[data-type="warning"] { background: rgba(243,156,18,0.08); color: #e67e22; }

    /* Savings comparison */
    .savings-comparison {
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc, #f0f9ff);
      border-radius: var(--radius-md);
      border: 1px solid #bae6fd;
    }

    .comparison-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 1.25rem;
      text-align: center;
    }

    .comparison-grid {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .comparison-card {
      flex: 1;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      text-align: center;
    }

    .comparison-card.etf {
      background: rgba(39, 174, 96, 0.06);
      border: 1px solid rgba(39, 174, 96, 0.2);
    }

    .comparison-card.savings {
      background: rgba(243, 156, 18, 0.06);
      border: 1px solid rgba(243, 156, 18, 0.2);
    }

    .comparison-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-light);
      margin-bottom: 0.5rem;
    }

    .comparison-amount {
      font-size: 1.5rem;
      font-weight: 900;
      color: var(--color-primary);
      line-height: 1.2;
    }

    .per-month {
      font-size: 0.78rem;
      font-weight: 400;
      color: var(--color-text-light);
    }

    .comparison-detail {
      font-size: 0.8rem;
      color: var(--color-text-light);
      margin-top: 0.35rem;
    }

    .comparison-payout {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-success);
      margin-top: 0.25rem;
    }

    .comparison-vs {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-light);
      flex-shrink: 0;
    }

    .comparison-note {
      font-size: 0.72rem;
      color: var(--color-text-light);
      text-align: center;
      margin-top: 1rem;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .tips-grid { grid-template-columns: 1fr; }
      .comparison-grid { flex-direction: column; }
      .comparison-vs { transform: rotate(90deg); }
      .comparison-card { width: 100%; }
      .locked-tips-grid { grid-template-columns: 1fr; }
    }

    /* Locked tips section */
    .locked-tips-section {
      margin-top: 1rem;
      margin-bottom: 1.75rem;
    }

    .locked-tips-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: rgba(15, 52, 96, 0.04);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--color-accent);
    }

    .locked-tips-icon {
      font-size: 1rem;
    }

    .locked-tips-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      position: relative;
    }

    .tip-card.locked {
      filter: blur(4px);
      opacity: 0.5;
      pointer-events: none;
      user-select: none;
    }

    .locked-tips-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      background: rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(1px);
      border-radius: var(--radius-md);
    }

    .locked-tips-overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.95);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      text-align: center;
    }

    .locked-overlay-badge {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .locked-tips-cta {
      padding: 0.65rem 1.5rem;
      background: linear-gradient(135deg, #0f3460, #1a5276);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .locked-tips-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(15, 52, 96, 0.3);
    }
  `],
})
export class ActionTipsComponent {
  private readonly savingsService = inject(SavingsCalculatorService);

  readonly result = input.required<PensionResult>();
  readonly hatKinder = input<boolean>(false);
  readonly unlocked = input<boolean>(false);
  readonly unlock = output<string>();

  /** Show first 2 tips for free, gate the rest (unless unlocked) */
  private readonly FREE_TIP_COUNT = 2;

  readonly freeTips = computed(() =>
    this.unlocked() ? this.tips() : this.tips().slice(0, this.FREE_TIP_COUNT)
  );
  readonly lockedTips = computed(() =>
    this.unlocked() ? [] : this.tips().slice(this.FREE_TIP_COUNT)
  );

  readonly etfMonthly = computed(() => {
    const r = this.result();
    if (r.rentenluecke <= 0 || r.jahresBisRente <= 0) return 0;
    return Math.round(this.savingsService.calculateRequiredMonthlySavings(r.rentenluecke, 0.07, r.jahresBisRente, 25));
  });

  readonly savingsMonthly = computed(() => {
    const r = this.result();
    if (r.rentenluecke <= 0 || r.jahresBisRente <= 0) return 0;
    return Math.round(this.savingsService.calculateRequiredMonthlySavings(r.rentenluecke, 0.015, r.jahresBisRente, 25));
  });

  readonly etfProjection = computed(() => {
    const r = this.result();
    return this.savingsService.calculateFutureValue(this.etfMonthly(), 0.07, r.jahresBisRente, 25);
  });

  readonly savingsProjection = computed(() => {
    const r = this.result();
    return this.savingsService.calculateFutureValue(this.savingsMonthly(), 0.015, r.jahresBisRente, 25);
  });

  readonly tips = computed<ActionTip[]>(() => {
    const r = this.result();
    const tips: ActionTip[] = [];

    if (r.rentenluecke > 0 && r.jahresBisRente > 0) {
      tips.push({
        icon: '📈',
        title: 'ETF-Sparplan starten',
        description: `Um Ihre Rentenlücke vollständig zu schließen, bräuchten Sie einen monatlichen ETF-Sparplan bei durchschnittlich 7% Rendite p.a.`,
        highlight: `${this.etfMonthly().toLocaleString('de-DE')} € / Monat`,
        type: 'savings',
      });
    } else if (r.rentenluecke <= 0) {
      tips.push({
        icon: '🎉',
        title: 'Hervorragende Ausgangslage',
        description: `Ihre gesetzliche Rente übersteigt Ihren Wunsch. Nutzen Sie den Überschuss für Rücklagen oder vorzeitigen Ruhestand.`,
        highlight: `Rente deckt ${r.deckungsquote.toFixed(0)}% Ihres Wunschs`,
        type: 'info',
      });
    }

    if (r.jahresBisRente > 5) {
      tips.push({
        icon: '⏰',
        title: 'Zeit ist Ihr größter Verbündeter',
        description: `Sie haben noch ${r.jahresBisRente} Jahre bis zur Rente. Jeder Monat früher zählt — der Zinseszinseffekt macht den Unterschied.`,
        highlight: `${r.jahresBisRente} Jahre Ansparzeit`,
        type: 'info',
      });
    }

    if (r.rentenluecke > 500) {
      tips.push({
        icon: '🏛️',
        title: 'Staatliche Förderung nutzen',
        description: `Bei einer Lücke über 500€/Monat lohnen sich Riester- oder Rürup-Verträge mit Steuervorteilen besonders.`,
        highlight: `Bis zu ${Math.round(r.rentenluecke * 0.3).toLocaleString('de-DE')} € Steuervorteil/Jahr`,
        type: 'strategy',
      });
    } else if (r.rentenluecke > 0 && r.rentenluecke <= 500) {
      tips.push({
        icon: '✅',
        title: 'Lücke ist schließbar',
        description: `Ihre Rentenlücke ist moderat. Schon ein kleiner monatlicher Betrag kann den Unterschied machen.`,
        highlight: `Relativ geringe Lücke`,
        type: 'savings',
      });
    }

    if (r.deckungsquote < 50) {
      tips.push({
        icon: '⚠️',
        title: 'Dringender Handlungsbedarf',
        description: `Ihre Rente deckt weniger als die Hälfte Ihres Wunscheinkommens. Ziehen Sie professionelle Beratung in Betracht.`,
        highlight: `Nur ${r.deckungsquote.toFixed(0)}% Deckung`,
        type: 'warning',
      });
    } else if (r.deckungsquote >= 80) {
      tips.push({
        icon: '🌟',
        title: 'Gute Ausgangsposition',
        description: `Mit ${r.deckungsquote.toFixed(0)}% Deckungsquote stehen Sie besser da als die meisten Deutschen.`,
        highlight: `${r.deckungsquote.toFixed(0)}% Deckungsquote`,
        type: 'info',
      });
    }

    if (r.jahresBisRente > 2) {
      const extraYearsGain = r.bruttoMonatlich * 0.05;
      tips.push({
        icon: '🔧',
        title: '1–2 Jahre länger arbeiten',
        description: `Jedes zusätzliche Arbeitsjahr erhöht Ihre Rente und verkürzt die Bezugsdauer. Doppelter Effekt.`,
        highlight: `ca. +${Math.round(extraYearsGain).toLocaleString('de-DE')} € / Monat pro Jahr`,
        type: 'strategy',
      });
    }

    if (this.hatKinder()) {
      tips.push({
        icon: '👶',
        title: 'Kindererziehungszeiten prüfen',
        description: `Für Kindererziehung können bis zu 3 Rentenpunkte pro Kind gutgeschrieben werden — das sind ca. 111 €/Monat mehr Rente. Falls noch nicht beantragt, stellen Sie den Antrag mit dem Formular V0800 bei der Deutschen Rentenversicherung.`,
        highlight: `Formular V0800 bei der DRV anfordern`,
        type: 'strategy',
      });
    }

    return tips.slice(0, 5);
  });
}

