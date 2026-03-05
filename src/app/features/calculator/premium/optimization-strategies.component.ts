import { Component, input, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionInput } from '../../../core/models/pension-input.model';
import { PensionResult } from '../../../core/models/pension-result.model';
import { PensionCalculatorService } from '../../../core/services/pension-calculator.service';
import { SavingsCalculatorService } from '../../../core/services/savings-calculator.service';
import { OptimizationSuggestion } from '../../../core/models/scenario.model';

/**
 * Optimierungsvorschläge & Strategievergleich — personalized, quantified
 * recommendations for closing the pension gap with different strategies.
 */
@Component({
  selector: 'app-optimization-strategies',
  standalone: true,
  imports: [EuroPipe, DecimalPipe],
  template: `
    <div class="optimization-section">
      <h3 class="section-title">
        <span class="icon">🎯</span> Optimierungsvorschläge
      </h3>
      <p class="section-subtitle">
        Personalisierte Empfehlungen basierend auf Ihrer Situation — sortiert nach größtem Effekt.
      </p>

      @if (suggestions().length > 0) {
        <div class="suggestions-list">
          @for (s of suggestions(); track s.title; let i = $index) {
            <div class="suggestion-card" [class.highlight-card]="i === 0">
              @if (i === 0) {
                <div class="top-pick-badge">💡 Top-Empfehlung</div>
              }
              <div class="suggestion-main">
                <div class="suggestion-left">
                  <div class="suggestion-rank">#{{ i + 1 }}</div>
                  <div class="suggestion-icon">{{ s.icon }}</div>
                </div>
                <div class="suggestion-content">
                  <h4>{{ s.title }}</h4>
                  <p>{{ s.description }}</p>
                  @if (s.actionStep) {
                    <div class="action-step">
                      <span class="action-icon">→</span> {{ s.actionStep }}
                    </div>
                  }
                </div>
                <div class="suggestion-impact" [class.positive]="s.impact > 0" [class.negative]="s.impact < 0">
                  <span class="impact-value">{{ s.impact > 0 ? '+' : '' }}{{ s.impact.toLocaleString('de-DE') }} €</span>
                  <small>{{ s.impactLabel || '/Monat' }}</small>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="no-suggestions">
          <span class="no-icon">🎉</span>
          <p>Ihre Rente deckt Ihr Wunscheinkommen — keine Optimierung nötig!</p>
        </div>
      }

      <!-- Strategy Comparison -->
      @if (baselineResult().rentenluecke > 0 && baselineResult().jahresBisRente > 0) {
        <div class="strategy-section">
          <h3 class="section-title" style="margin-top: 2rem;">
            <span class="icon">⚖️</span> Strategievergleich zur Lückendeckung
          </h3>
          <p class="section-subtitle">
            So viel müssten Sie monatlich sparen, um Ihre Rentenlücke von
            <strong>{{ baselineResult().rentenluecke | euro }}</strong>/Monat zu schließen
            — bei {{ baselineResult().jahresBisRente }} Jahren Ansparzeit.
          </p>

          <div class="strategy-grid">
            @for (s of strategies(); track s.label; let i = $index) {
              <div class="strategy-card" [style.border-top-color]="s.color" [class.best-strategy]="i === 0">
                @if (i === 0) {
                  <div class="best-strategy-badge">Empfohlen</div>
                }
                <div class="strategy-icon">{{ s.icon }}</div>
                <h4 class="strategy-label">{{ s.label }}</h4>
                <div class="strategy-rate">{{ s.rateLabel }}</div>

                <div class="strategy-monthly">
                  {{ s.monthlyRequired | euro }}
                  <small>/Monat</small>
                </div>

                <div class="strategy-details">
                  <div class="detail-row">
                    <span>Endkapital</span>
                    <strong>{{ s.projection.endkapital | euro }}</strong>
                  </div>
                  <div class="detail-row">
                    <span>davon Eigenanteil</span>
                    <strong>{{ s.projection.eigenanteil | euro }}</strong>
                  </div>
                  <div class="detail-row highlight-row">
                    <span>davon Rendite</span>
                    <strong class="text-success">{{ s.projection.renditeErtrag | euro }}</strong>
                  </div>
                  <div class="detail-row highlight-row">
                    <span>Auszahlung (25 J.)</span>
                    <strong>{{ s.projection.monatlicheAuszahlung | euro }}/M</strong>
                  </div>
                </div>

                <div class="strategy-ratio">
                  Rendite-Anteil: <strong>{{ s.renditeAnteil | number:'1.0-0' }}%</strong>
                </div>
              </div>
            }
          </div>

          <p class="strategy-note">
            * Berechnung basierend auf {{ baselineResult().jahresBisRente }} Jahren Ansparzeit
            und 25 Jahren Auszahlung mit gleichbleibender Rendite. Keine Anlageberatung.
            Historische Renditen sind keine Garantie für zukünftige Ergebnisse.
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .optimization-section {
      padding: 2rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .section-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .icon { font-size: 1.3rem; }

    .section-subtitle {
      font-size: 0.88rem;
      color: var(--color-text-light);
      margin-bottom: 1.5rem;
    }

    .section-subtitle strong {
      color: var(--color-danger);
      font-weight: 700;
    }

    /* No suggestions */
    .no-suggestions {
      text-align: center;
      padding: 2rem;
      background: rgba(39, 174, 96, 0.04);
      border: 1px dashed rgba(39, 174, 96, 0.3);
      border-radius: var(--radius-md);
    }

    .no-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }

    .no-suggestions p {
      color: var(--color-success);
      font-weight: 600;
      font-size: 0.95rem;
    }

    /* Suggestions */
    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .suggestion-card {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }

    .suggestion-card:hover {
      transform: translateX(4px);
      box-shadow: var(--shadow-sm);
    }

    .suggestion-card.highlight-card {
      border-color: var(--color-accent);
      background: linear-gradient(135deg, rgba(15, 52, 96, 0.02), rgba(41, 128, 185, 0.03));
    }

    .top-pick-badge {
      position: absolute;
      top: -10px;
      right: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      background: var(--color-accent);
      color: white;
      border-radius: 4px;
    }

    .suggestion-main {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .suggestion-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .suggestion-rank {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-text-light);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border-radius: 50%;
    }

    .suggestion-icon {
      font-size: 1.4rem;
    }

    .suggestion-content {
      flex: 1;
      min-width: 0;
    }

    .suggestion-content h4 {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.2rem;
    }

    .suggestion-content p {
      font-size: 0.8rem;
      color: var(--color-text-light);
      line-height: 1.5;
      margin-bottom: 0.3rem;
    }

    .action-step {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-accent);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .action-icon {
      font-weight: 800;
    }

    .suggestion-impact {
      text-align: right;
      flex-shrink: 0;
      min-width: 90px;
    }

    .impact-value {
      display: block;
      font-size: 1.1rem;
      font-weight: 900;
      color: var(--color-primary);
    }

    .suggestion-impact.positive .impact-value {
      color: var(--color-success);
    }

    .suggestion-impact.negative .impact-value {
      color: var(--color-danger);
    }

    .suggestion-impact small {
      font-size: 0.68rem;
      font-weight: 500;
      color: var(--color-text-light);
    }

    /* Strategy comparison */
    .strategy-section {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--color-border);
    }

    .strategy-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .strategy-card {
      padding: 1.5rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      border-top: 4px solid #dee2e6;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }

    .strategy-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }

    .strategy-card.best-strategy {
      border-color: var(--color-success);
      background: rgba(39, 174, 96, 0.02);
    }

    .best-strategy-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      background: rgba(39, 174, 96, 0.1);
      color: var(--color-success);
      border-radius: 4px;
    }

    .strategy-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .strategy-label {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
    }

    .strategy-rate {
      font-size: 0.78rem;
      color: var(--color-text-light);
      margin-bottom: 1rem;
    }

    .strategy-monthly {
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--color-primary);
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .strategy-monthly small {
      font-size: 0.78rem;
      font-weight: 400;
      color: var(--color-text-light);
    }

    .strategy-details {
      border-top: 1px solid var(--color-border);
      padding-top: 0.75rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 0;
      font-size: 0.78rem;
    }

    .detail-row span {
      color: var(--color-text-light);
    }

    .detail-row strong {
      color: var(--color-primary);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .highlight-row strong {
      font-weight: 800;
    }

    .text-success { color: var(--color-success) !important; }

    .strategy-ratio {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--color-border);
      font-size: 0.75rem;
      color: var(--color-text-light);
    }

    .strategy-ratio strong {
      color: var(--color-primary);
      font-weight: 800;
    }

    .strategy-note {
      text-align: center;
      font-size: 0.72rem;
      color: var(--color-text-light);
      font-style: italic;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .strategy-grid { grid-template-columns: 1fr; }
      .suggestion-main { flex-wrap: wrap; }
      .suggestion-impact { width: 100%; text-align: left; margin-top: 0.5rem; }
    }
  `],
})
export class OptimizationStrategiesComponent {
  private readonly calcService = inject(PensionCalculatorService);
  private readonly savingsService = inject(SavingsCalculatorService);

  readonly pensionInput = input.required<PensionInput>();
  readonly baselineResult = input.required<PensionResult>();

  readonly suggestions = computed<OptimizationSuggestion[]>(() => {
    const inp = this.pensionInput();
    const base = this.baselineResult();
    const suggestions: OptimizationSuggestion[] = [];

    // 1. Work 2 years longer — always relevant and usually highest impact
    if (base.jahresBisRente > 2) {
      const laterInput: PensionInput = {
        ...inp,
        rentenbeginnJahr: inp.rentenbeginnJahr + 2,
        bruttoMonatlicheRente: Math.round(inp.bruttoMonatlicheRente * 1.1),
      };
      const laterResult = this.calcService.calculate(laterInput);
      const impactKaufkraft = laterResult.realeKaufkraftMonatlich - base.realeKaufkraftMonatlich;
      const impactNetto = laterResult.nettoMonatlich - base.nettoMonatlich;
      suggestions.push({
        icon: '🔧',
        title: '2 Jahre länger arbeiten',
        description: `Rentenbeginn ${laterInput.rentenbeginnJahr} statt ${inp.rentenbeginnJahr}: ca. +10% Bruttorente und ${Math.abs(Math.round(impactKaufkraft - impactNetto)).toLocaleString('de-DE')} € weniger Inflationsverlust.`,
        impact: Math.round(impactKaufkraft),
        impactLabel: '/Monat Kaufkraft',
        category: 'pension',
        actionStep: 'Nutzen Sie den Renten-Zeitstrahl, um die Auswirkung verschiedener Renteneintritte auf einen Blick zu sehen.',
      });
    }

    // 2. Private Vorsorge mit ETF
    if (base.rentenluecke > 0 && base.jahresBisRente > 0) {
      const etfMonthly = this.savingsService.calculateRequiredMonthlySavings(
        base.rentenluecke, 0.07, base.jahresBisRente, 25
      );
      const etfProjection = this.savingsService.calculateFutureValue(
        Math.round(etfMonthly), 0.07, base.jahresBisRente, 25
      );
      suggestions.push({
        icon: '📈',
        title: 'ETF-Sparplan starten',
        description: `Mit nur ${Math.round(etfMonthly).toLocaleString('de-DE')} €/Monat in einen breit gestreuten ETF (z.B. MSCI World) könnten Sie Ihre Lücke vollständig schließen. Sie zahlen ${etfProjection.eigenanteil.toLocaleString('de-DE', { maximumFractionDigits: 0 })} € ein und erhalten durch den Zinseszins insgesamt ${etfProjection.endkapital.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €.`,
        impact: Math.round(base.rentenluecke),
        impactLabel: '/Monat Lücke geschlossen',
        category: 'savings',
        actionStep: 'Eröffnen Sie ein Depot bei einer Direktbank und richten Sie einen automatischen Sparplan ein.',
      });
    }

    // 3. Freiwillige Einzahlungen in die gesetzliche Rentenversicherung
    if (base.rentenluecke > 0 && base.jahresBisRente > 5) {
      const einzahlungMonat = 100;
      // 100€/Monat freiwillig → ca. 0.5 Rentenpunkte/Jahr → ca. 18.50€ mehr Rente/Monat pro Jahr
      const zusatzPunkteProJahr = (einzahlungMonat * 12) / 8_024; // Beitragsbemessungsgrenze ca. 8024€/Monat
      const zusatzRenteProJahr = zusatzPunkteProJahr * 39.32; // aktueller Rentenwert
      const gesamtZusatz = Math.round(zusatzRenteProJahr * Math.min(base.jahresBisRente, 30));
      suggestions.push({
        icon: '🏛️',
        title: 'Freiwillige Einzahlung in die DRV',
        description: `Bereits ${einzahlungMonat} €/Monat freiwillige Beiträge zur Deutschen Rentenversicherung können Ihre Rente um ca. ${gesamtZusatz} €/Monat erhöhen. Diese Beiträge sind zudem steuerlich absetzbar (Sonderausgabenabzug).`,
        impact: gesamtZusatz,
        impactLabel: '/Monat mehr Rente',
        category: 'pension',
        actionStep: 'Antrag auf freiwillige Versicherung (Formular V0060, deutsche-rentenversicherung.de) bei der DRV stellen.',
      });
    }

    // 4. Betriebliche Altersvorsorge (bAV)
    if (base.rentenluecke > 0 && base.jahresBisRente > 5) {
      // Annahme: 200€/Monat Entgeltumwandlung, ~30% Steuer-/SV-Ersparnis
      const bruttoEinsatz = 200;
      const nettoKosten = Math.round(bruttoEinsatz * 0.7); // ca. 140€ netto
      const bAVprojection = this.savingsService.calculateFutureValue(bruttoEinsatz, 0.03, base.jahresBisRente, 25);
      suggestions.push({
        icon: '🏢',
        title: 'Betriebliche Altersvorsorge (bAV)',
        description: `200 €/Monat Entgeltumwandlung kosten Sie netto nur ca. ${nettoKosten} €/Monat dank Steuer- und Sozialversicherungsersparnis. Bei 3% Rendite ergibt das eine Zusatzrente von ca. ${Math.round(bAVprojection.monatlicheAuszahlung)} €/Monat.`,
        impact: Math.round(bAVprojection.monatlicheAuszahlung),
        impactLabel: '/Monat Zusatzrente',
        category: 'savings',
        actionStep: 'Fragen Sie Ihren Arbeitgeber nach dem Angebot zur Entgeltumwandlung.',
      });
    }

    // 5. Riester-Rente mit Zulagen
    if (base.rentenluecke > 0) {
      const grundzulage = 175;
      const kinderzulage = inp.hatKinder ? 300 : 0;
      const jahreszulage = grundzulage + kinderzulage;
      // Eigenbeitrag für volle Zulage: 4% des Bruttogehalts (geschätzt) abzgl. Zulagen, min. 60€
      const geschaetztesBrutto = inp.bruttoMonatlicheRente * 1.5 * 12; // grobe Schätzung Erwerbseinkommen
      const vollbeitrag = Math.max(60, Math.round(geschaetztesBrutto * 0.04) - jahreszulage);
      const eigenMonatlich = Math.round(vollbeitrag / 12);
      // Projection: Eigenbeitrag + Zulagen bei 2% Rendite
      const riesterMonatlich = eigenMonatlich + Math.round(jahreszulage / 12);
      const riesterProjection = this.savingsService.calculateFutureValue(riesterMonatlich, 0.02, base.jahresBisRente, 25);
      suggestions.push({
        icon: '🎁',
        title: 'Riester-Rente mit staatlicher Förderung',
        description: `Sie erhalten ${grundzulage} € Grundzulage${inp.hatKinder ? ` + ${kinderzulage} € Kinderzulage` : ''} = ${jahreszulage} €/Jahr vom Staat geschenkt. Ihr Eigenbeitrag: ca. ${eigenMonatlich} €/Monat für die volle Zulage.`,
        impact: Math.round(riesterProjection.monatlicheAuszahlung),
        impactLabel: '/Monat Zusatzrente',
        category: 'tax',
        actionStep: 'Vergleichen Sie Riester-Angebote bei Ihrer Bank oder einem unabhängigen Berater.',
      });
    }

    // 6. Kindererziehungszeiten anrechnen lassen
    if (inp.hatKinder) {
      suggestions.push({
        icon: '👶',
        title: 'Kindererziehungszeiten prüfen & beantragen',
        description: 'Für jedes nach 1992 geborene Kind werden bis zu 3 Rentenpunkte gutgeschrieben — das sind ca. 111 €/Monat mehr Rente pro Kind. Diese Zeiten müssen aktiv beantragt werden und werden nicht automatisch berücksichtigt!',
        impact: 111,
        impactLabel: '/Monat pro Kind',
        category: 'pension',
        actionStep: 'Formular V0800 (deutsche-rentenversicherung.de) bei der DRV anfordern oder online ausfüllen.',
      });
    }

    // 7. Steueroptimierung im Ruhestand
    if (base.einkommensteuer > 0) {
      const steuerMonatlich = Math.round(base.einkommensteuer / 12);
      suggestions.push({
        icon: '📋',
        title: 'Steueroptimierung im Ruhestand',
        description: `Sie zahlen aktuell ca. ${steuerMonatlich} €/Monat Einkommensteuer auf Ihre Rente (Besteuerungsanteil: ${(base.besteuerungsanteil * 100).toFixed(0)}%). Durch geschickte Nutzung von Werbungskosten, Sonderausgaben und Freibeträgen lässt sich die Steuerlast oft senken.`,
        impact: Math.round(steuerMonatlich * 0.2), // konservative 20% Optimierung
        impactLabel: '/Monat Steuerersparnis',
        category: 'tax',
        actionStep: 'Lassen Sie Ihre Steuererklärung im Ruhestand von einem Steuerberater oder Lohnsteuerhilfeverein erstellen.',
      });
    }

    // Sort by absolute impact descending
    return suggestions
      .filter(s => s.impact > 0)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  });

  readonly strategies = computed(() => {
    const base = this.baselineResult();
    if (base.rentenluecke <= 0 || base.jahresBisRente <= 0) return [];

    const configs = [
      { label: 'ETF-Sparplan', icon: '📈', color: '#27ae60', rate: 0.07, rateLabel: '7% p.a. (MSCI World historisch)' },
      { label: 'Mischfonds', icon: '📊', color: '#f39c12', rate: 0.04, rateLabel: '4% p.a. (ausgewogen)' },
      { label: 'Sparkonto/Festgeld', icon: '🏦', color: '#e94560', rate: 0.015, rateLabel: '1,5% p.a. (konservativ)' },
    ];

    return configs.map(c => {
      const monthly = this.savingsService.calculateRequiredMonthlySavings(
        base.rentenluecke, c.rate, base.jahresBisRente, 25
      );
      const projection = this.savingsService.calculateFutureValue(
        Math.round(monthly), c.rate, base.jahresBisRente, 25
      );
      const renditeAnteil = projection.endkapital > 0
        ? (projection.renditeErtrag / projection.endkapital) * 100
        : 0;
      return {
        ...c,
        monthlyRequired: Math.round(monthly),
        projection,
        renditeAnteil,
      };
    });
  });
}


