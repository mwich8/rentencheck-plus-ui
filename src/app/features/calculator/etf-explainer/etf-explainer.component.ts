import { Component, input, computed, signal, inject } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionResult } from '../../../core/models/pension-result.model';
import { SavingsCalculatorService } from '../../../core/services/savings-calculator.service';
import type { EChartsOption } from 'echarts';

/**
 * ETF Explainer — educational accordion section that explains ETFs
 * in plain German, shows personalized compound growth, and provides
 * a tasteful affiliate broker CTA.
 * Only shown when the user has a pension gap.
 */
@Component({
  selector: 'app-etf-explainer',
  standalone: true,
  imports: [NgxEchartsDirective, EuroPipe],
  template: `
    <div class="explainer-section">
      <div class="explainer-header">
        <h3 class="explainer-title">
          <span class="icon">📘</span> ETF-Sparplan einfach erklärt
        </h3>
        <p class="explainer-subtitle">
          In unseren Empfehlungen sprechen wir häufig von ETFs. Hier erfahren Sie,
          was das genau ist und warum Millionen Deutsche damit für die Rente vorsorgen.
        </p>
      </div>

      <!-- Personalized headline numbers -->
      <div class="hero-numbers">
        <div class="hero-number-card">
          <span class="hero-number-label">Ihre Rentenlücke</span>
          <span class="hero-number-value text-danger">{{ result().rentenluecke | euro }}/M</span>
        </div>
        <div class="hero-number-card">
          <span class="hero-number-label">Benötigter ETF-Sparplan</span>
          <span class="hero-number-value text-accent">{{ etfMonthly() | euro }}/M</span>
        </div>
        <div class="hero-number-card">
          <span class="hero-number-label">Davon Ihr Geld</span>
          <span class="hero-number-value">{{ etfProjection().eigenanteil | euro }}</span>
        </div>
        <div class="hero-number-card highlight">
          <span class="hero-number-label">Davon Rendite (geschenkt)</span>
          <span class="hero-number-value text-success">{{ etfProjection().renditeErtrag | euro }}</span>
        </div>
      </div>

      <!-- Accordion panels -->
      <div class="accordion">
        <!-- Panel 1: Was ist ein ETF? -->
        <div class="accordion-item" [class.open]="activePanel() === 0">
          <button class="accordion-header" (click)="togglePanel(0)">
            <span class="accordion-icon">📦</span>
            <span class="accordion-label">Was ist ein ETF?</span>
            <span class="accordion-chevron">{{ activePanel() === 0 ? '−' : '+' }}</span>
          </button>
          <div class="accordion-body">
            <div class="accordion-content">
              <p>
                Ein <strong>ETF</strong> (Exchange Traded Fund) ist ein Investmentfonds, der an der Börse gehandelt wird —
                wie eine Aktie, aber mit einem entscheidenden Vorteil: <strong>Ein einzelner ETF enthält hunderte
                oder sogar tausende Aktien gleichzeitig.</strong>
              </p>
              <div class="info-box">
                <span class="info-icon">💡</span>
                <div>
                  <strong>Einfach erklärt:</strong> Stellen Sie sich einen Obstkorb vor. Statt nur einen Apfel zu kaufen
                  (= eine einzelne Aktie), kaufen Sie einen ganzen Korb mit Äpfeln, Birnen, Orangen und Bananen.
                  Wenn eine Frucht schlecht wird, haben Sie noch viele andere.
                </div>
              </div>
              <div class="feature-pills">
                <div class="pill">
                  <span class="pill-icon">🌍</span>
                  <div>
                    <strong>Breit gestreut</strong>
                    <span>z.B. MSCI World = 1.500+ Unternehmen aus 23 Ländern</span>
                  </div>
                </div>
                <div class="pill">
                  <span class="pill-icon">💰</span>
                  <div>
                    <strong>Günstig</strong>
                    <span>Nur 0,1–0,3% Kosten/Jahr (vs. 1,5–2% bei aktiven Fonds)</span>
                  </div>
                </div>
                <div class="pill">
                  <span class="pill-icon">🔄</span>
                  <div>
                    <strong>Automatisch</strong>
                    <span>Sparplan ab 25 €/Monat einrichten und vergessen</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel 2: Warum langfristig sinnvoll? -->
        <div class="accordion-item" [class.open]="activePanel() === 1">
          <button class="accordion-header" (click)="togglePanel(1)">
            <span class="accordion-icon">📈</span>
            <span class="accordion-label">Warum sind ETFs langfristig sinnvoll?</span>
            <span class="accordion-chevron">{{ activePanel() === 1 ? '−' : '+' }}</span>
          </button>
          <div class="accordion-body">
            <div class="accordion-content">
              <p>
                Der MSCI World Index hat in den letzten <strong>50 Jahren durchschnittlich ca. 7% Rendite pro Jahr</strong>
                erzielt — trotz aller Krisen (Dotcom, Finanzkrise 2008, Corona).
              </p>

              <div class="stat-row">
                <div class="stat-card">
                  <span class="stat-big">~7%</span>
                  <span class="stat-desc">Ø Rendite p.a.<br>(MSCI World, 1975–2025)</span>
                </div>
                <div class="stat-card">
                  <span class="stat-big">0</span>
                  <span class="stat-desc">Verlustperioden<br>bei 15+ Jahren Haltedauer</span>
                </div>
                <div class="stat-card">
                  <span class="stat-big">{{ renditeAnteil() }}%</span>
                  <span class="stat-desc">Ihres Vermögens<br>wäre Rendite (nicht eingezahlt)</span>
                </div>
              </div>

              <!-- Personalized growth chart -->
              <h4 class="chart-label">Ihr persönlicher Vermögensaufbau über {{ result().jahresBisRente }} Jahre</h4>
              <div
                echarts
                [options]="chartOptions()"
                class="growth-chart"
              ></div>
              <p class="chart-note">
                Vergleich: {{ etfMonthly() | euro }}/Monat in einen MSCI-World-ETF (7% p.a.)
                vs. Sparkonto (1,5% p.a.) über {{ result().jahresBisRente }} Jahre.
              </p>
            </div>
          </div>
        </div>

        <!-- Panel 3: Sind ETFs nicht riskant? -->
        <div class="accordion-item" [class.open]="activePanel() === 2">
          <button class="accordion-header" (click)="togglePanel(2)">
            <span class="accordion-icon">🛡️</span>
            <span class="accordion-label">Sind ETFs nicht riskant?</span>
            <span class="accordion-chevron">{{ activePanel() === 2 ? '−' : '+' }}</span>
          </button>
          <div class="accordion-body">
            <div class="accordion-content">
              <p>
                Kurzfristig ja — Kurse schwanken. Aber langfristig sieht die Statistik überraschend klar aus:
              </p>
              <div class="risk-grid">
                <div class="risk-card positive">
                  <span class="risk-icon">✅</span>
                  <div>
                    <strong>15+ Jahre Haltedauer</strong>
                    <p>Wer den MSCI World 15 Jahre oder länger gehalten hat, hat in der
                      gesamten Geschichte <strong>nie Verlust</strong> gemacht — egal wann der Einstieg war.</p>
                  </div>
                </div>
                <div class="risk-card positive">
                  <span class="risk-icon">✅</span>
                  <div>
                    <strong>Sparplan-Effekt</strong>
                    <p>Durch monatliches Investieren kaufen Sie bei fallenden Kursen automatisch
                      günstiger ein (Cost-Average-Effekt). Krisen werden so zu Kaufgelegenheiten.</p>
                  </div>
                </div>
                <div class="risk-card neutral">
                  <span class="risk-icon">⚖️</span>
                  <div>
                    <strong>Das wahre Risiko: Nicht investieren</strong>
                    <p>Inflation frisst Ihr Geld auf dem Sparkonto auf. Bei 2% Inflation verlieren
                      10.000 € auf dem Tagesgeld in 20 Jahren ein Drittel ihrer Kaufkraft.</p>
                  </div>
                </div>
              </div>

              @if (result().jahresBisRente >= 15) {
                <div class="info-box success">
                  <span class="info-icon">🎯</span>
                  <div>
                    <strong>Ihr Zeitvorteil:</strong> Sie haben noch {{ result().jahresBisRente }} Jahre bis zur Rente —
                    deutlich mehr als die empfohlenen 15 Jahre Mindest-Haltedauer. Damit sind Sie
                    statistisch auf der sicheren Seite.
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Panel 4: Wie fange ich an? -->
        <div class="accordion-item" [class.open]="activePanel() === 3">
          <button class="accordion-header" (click)="togglePanel(3)">
            <span class="accordion-icon">🚀</span>
            <span class="accordion-label">Wie fange ich an? (3 einfache Schritte)</span>
            <span class="accordion-chevron">{{ activePanel() === 3 ? '−' : '+' }}</span>
          </button>
          <div class="accordion-body">
            <div class="accordion-content">
              <div class="steps">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>Depot eröffnen</h4>
                    <p>Bei einer Direktbank oder einem Online-Broker. Dauert ca. 10 Minuten und ist
                      in der Regel kostenlos. Bekannte Anbieter: Trade Republic, Scalable Capital, ING, comdirect.</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>ETF-Sparplan einrichten</h4>
                    <p>Suchen Sie nach <strong>"MSCI World"</strong> oder <strong>"FTSE All-World"</strong>.
                      Legen Sie Ihren monatlichen Betrag fest (z.B. {{ etfMonthly() | euro }}) und
                      wählen Sie ein Ausführungsdatum.</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>Laufen lassen</h4>
                    <p>Das ist der wichtigste Schritt: <strong>Nicht ständig reinschauen.</strong>
                      Der Sparplan läuft automatisch. In Krisen: durchhalten. Der Zinseszinseffekt
                      macht den Rest.</p>
                  </div>
                </div>
              </div>

              <!-- Affiliate CTA -->
              <div class="affiliate-section">
                <span class="affiliate-label">Anzeige</span>
                <div class="affiliate-card">
                  <div class="affiliate-content">
                    <div class="affiliate-icon">🏦</div>
                    <div class="affiliate-info">
                      <h4>Kostenloses Depot eröffnen</h4>
                      <p>Starten Sie in wenigen Minuten mit einem kostenlosen Depot.
                        ETF-Sparpläne sind bei vielen Anbietern dauerhaft gebührenfrei.</p>
                    </div>
                    <a class="affiliate-cta"
                       href="https://www.financeads.net/tc.php?t=41498C274449894T"
                       target="_blank"
                       rel="noopener sponsored"
                       (click)="onAffiliateClick()">
                      Depot eröffnen →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <p class="disclaimer">
        Keine Anlageberatung. Historische Renditen sind keine Garantie für zukünftige Ergebnisse.
        Kapitalanlagen sind mit Risiken verbunden. Die genannten Durchschnittswerte beziehen sich auf den
        MSCI World Net Total Return Index (1975–2025).
      </p>
    </div>
  `,
  styles: [`
    .explainer-section {
      padding: 2rem;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }

    .explainer-header { margin-bottom: 1.5rem; }

    .explainer-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.35rem;
    }

    .icon { font-size: 1.3rem; }

    .explainer-subtitle {
      font-size: 0.88rem;
      color: var(--color-text-light);
      line-height: 1.6;
    }

    /* Hero numbers */
    .hero-numbers {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .hero-number-card {
      padding: 1rem;
      border-radius: var(--radius-md);
      background: #f8fafc;
      border: 1px solid var(--color-border);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .hero-number-card.highlight {
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.04), rgba(39, 174, 96, 0.08));
      border-color: rgba(39, 174, 96, 0.2);
    }

    .hero-number-label {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-light);
    }

    .hero-number-value {
      font-size: 1.1rem;
      font-weight: 900;
      color: var(--color-primary);
      font-variant-numeric: tabular-nums;
    }

    .text-danger { color: var(--color-danger) !important; }
    .text-success { color: var(--color-success) !important; }
    .text-accent { color: var(--color-accent) !important; }

    /* Accordion */
    .accordion {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .accordion-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: border-color 0.3s;
    }

    .accordion-item.open {
      border-color: var(--color-accent);
      box-shadow: 0 2px 12px rgba(15, 52, 96, 0.06);
    }

    .accordion-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
      text-align: left;
    }

    .accordion-header:hover {
      background: #f0f4ff;
    }

    .accordion-item.open .accordion-header {
      background: linear-gradient(135deg, rgba(15, 52, 96, 0.03), rgba(15, 52, 96, 0.06));
    }

    .accordion-icon { font-size: 1.2rem; flex-shrink: 0; }

    .accordion-label {
      flex: 1;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .accordion-chevron {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-light);
      flex-shrink: 0;
      width: 24px;
      text-align: center;
    }

    .accordion-body {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.4s ease;
    }

    .accordion-item.open .accordion-body {
      max-height: 2000px;
    }

    .accordion-content {
      padding: 1.25rem 1.5rem 1.5rem;
    }

    .accordion-content p {
      font-size: 0.88rem;
      color: var(--color-text);
      line-height: 1.7;
      margin-bottom: 1rem;
    }

    .accordion-content strong {
      color: var(--color-primary);
    }

    /* Info box */
    .info-box {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #fffbeb, #fef9c3);
      border: 1px solid #fde68a;
      font-size: 0.85rem;
      color: #92400e;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .info-box.success {
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.04), rgba(39, 174, 96, 0.08));
      border-color: rgba(39, 174, 96, 0.2);
      color: #166534;
    }

    .info-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 0.1rem; }

    /* Feature pills */
    .feature-pills {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .pill {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      background: #f8fafc;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .pill-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; }

    .pill strong {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.1rem;
    }

    .pill span {
      font-size: 0.78rem;
      color: var(--color-text-light);
      line-height: 1.4;
    }

    /* Stat row */
    .stat-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      padding: 1rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #f8fafc, #f0f9ff);
      border: 1px solid #bae6fd;
      text-align: center;
    }

    .stat-big {
      display: block;
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--color-primary);
      line-height: 1.2;
      margin-bottom: 0.35rem;
    }

    .stat-desc {
      font-size: 0.72rem;
      color: var(--color-text-light);
      line-height: 1.4;
    }

    /* Chart */
    .chart-label {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }

    .growth-chart {
      width: 100%;
      height: 280px;
    }

    .chart-note {
      font-size: 0.75rem !important;
      color: var(--color-text-light) !important;
      font-style: italic;
      text-align: center;
      margin-top: 0.25rem;
    }

    /* Risk grid */
    .risk-grid {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 1rem;
    }

    .risk-card {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.15rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .risk-card.positive {
      border-left: 3px solid var(--color-success);
      background: rgba(39, 174, 96, 0.02);
    }

    .risk-card.neutral {
      border-left: 3px solid #f39c12;
      background: rgba(243, 156, 18, 0.02);
    }

    .risk-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 0.15rem; }

    .risk-card strong {
      display: block;
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.25rem;
    }

    .risk-card p {
      font-size: 0.82rem !important;
      margin-bottom: 0 !important;
      color: var(--color-text-light) !important;
      line-height: 1.6 !important;
    }

    /* Steps */
    .steps {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-accent);
      color: white;
      font-size: 1rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .step-content h4 {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.2rem;
    }

    .step-content p {
      font-size: 0.82rem !important;
      color: var(--color-text-light) !important;
      margin-bottom: 0 !important;
    }

    /* Affiliate */
    .affiliate-section {
      position: relative;
      margin-top: 0.5rem;
    }

    .affiliate-label {
      display: inline-block;
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-text-light);
      background: #f1f5f9;
      padding: 0.15rem 0.5rem;
      border-radius: 3px;
      margin-bottom: 0.5rem;
    }

    .affiliate-card {
      border: 1.5px dashed var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      background: #fafbfc;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .affiliate-card:hover {
      border-color: var(--color-accent);
      box-shadow: 0 2px 8px rgba(15, 52, 96, 0.06);
    }

    .affiliate-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .affiliate-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .affiliate-info {
      flex: 1;
    }

    .affiliate-info h4 {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
      margin-bottom: 0.2rem;
    }

    .affiliate-info p {
      font-size: 0.78rem !important;
      color: var(--color-text-light) !important;
      margin-bottom: 0 !important;
    }

    .affiliate-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.65rem 1.5rem;
      background: var(--color-accent);
      color: white;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.2s, transform 0.2s;
      flex-shrink: 0;
    }

    .affiliate-cta:hover {
      background: var(--color-primary);
      transform: translateY(-1px);
    }

    /* Disclaimer */
    .disclaimer {
      font-size: 0.72rem;
      color: var(--color-text-light);
      font-style: italic;
      line-height: 1.6;
      text-align: center;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-numbers {
        grid-template-columns: 1fr 1fr;
      }

      .stat-row {
        grid-template-columns: 1fr;
      }

      .affiliate-content {
        flex-direction: column;
        text-align: center;
      }

      .growth-chart {
        height: 220px;
      }
    }

    @media (max-width: 480px) {
      .hero-numbers {
        grid-template-columns: 1fr;
      }

      .step {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }
  `],
})
export class EtfExplainerComponent {
  private readonly savingsService = inject(SavingsCalculatorService);

  readonly result = input.required<PensionResult>();

  readonly activePanel = signal<number | null>(0);

  /** Required monthly ETF savings to close the gap */
  readonly etfMonthly = computed(() => {
    const res = this.result();
    if (res.rentenluecke <= 0 || res.jahresBisRente <= 0) return 0;
    return Math.round(
      this.savingsService.calculateRequiredMonthlySavings(res.rentenluecke, 0.07, res.jahresBisRente, 25)
    );
  });

  /** Full projection for the ETF strategy */
  readonly etfProjection = computed(() => {
    const monthly = this.etfMonthly();
    const years = this.result().jahresBisRente;
    if (monthly <= 0 || years <= 0) {
      return { endkapital: 0, eigenanteil: 0, renditeErtrag: 0, monatlicheAuszahlung: 0 };
    }
    return this.savingsService.calculateFutureValue(monthly, 0.07, years, 25);
  });

  /** Percentage of end capital that came from returns (not contributions) */
  readonly renditeAnteil = computed(() => {
    const proj = this.etfProjection();
    if (proj.endkapital <= 0) return 0;
    return Math.round((proj.renditeErtrag / proj.endkapital) * 100);
  });

  /** Year-by-year growth data for the chart */
  readonly chartOptions = computed<EChartsOption>(() => {
    const monthly = this.etfMonthly();
    const years = this.result().jahresBisRente;
    if (monthly <= 0 || years <= 0) return {};

    const labels: string[] = [];
    const etfValues: number[] = [];
    const savingsValues: number[] = [];
    const eigenanteilValues: number[] = [];

    for (let y = 0; y <= years; y++) {
      labels.push(`${y}`);
      if (y === 0) {
        etfValues.push(0);
        savingsValues.push(0);
        eigenanteilValues.push(0);
      } else {
        const etf = this.savingsService.calculateFutureValue(monthly, 0.07, y, 25);
        const savings = this.savingsService.calculateFutureValue(monthly, 0.015, y, 25);
        etfValues.push(Math.round(etf.endkapital));
        savingsValues.push(Math.round(savings.endkapital));
        eigenanteilValues.push(monthly * y * 12);
      }
    }

    const euroFormatter = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderColor: '#0f3460',
        borderWidth: 1,
        textStyle: { color: '#f8f9fa', fontFamily: 'Inter, sans-serif', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length < 2) return '';
          const y = params[0].dataIndex;
          return `
            <div style="font-weight:700;margin-bottom:6px">Jahr ${y}</div>
            <div style="color:#27ae60">● ETF (7%): ${euroFormatter.format(etfValues[y])}</div>
            <div style="color:#f39c12">● Sparkonto (1,5%): ${euroFormatter.format(savingsValues[y])}</div>
            <div style="color:#94a3b8;margin-top:4px">Eingezahlt: ${euroFormatter.format(eigenanteilValues[y])}</div>
            <div style="color:#27ae60;font-weight:600;margin-top:4px">
              Rendite-Vorteil ETF: ${euroFormatter.format(etfValues[y] - savingsValues[y])}
            </div>
          `;
        },
      },
      legend: {
        data: ['ETF-Sparplan (7% p.a.)', 'Sparkonto (1,5% p.a.)', 'Eingezahlt'],
        top: 0,
        textStyle: { fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#7f8c8d' },
      },
      grid: { left: 60, right: 20, top: 40, bottom: 35 },
      xAxis: {
        type: 'category',
        data: labels,
        name: 'Jahre',
        nameLocation: 'middle',
        nameGap: 22,
        nameTextStyle: { fontSize: 11, color: '#7f8c8d', fontFamily: 'Inter, sans-serif' },
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#7f8c8d',
          interval: Math.max(0, Math.floor(years / 6)),
        },
        axisLine: { lineStyle: { color: '#e9ecef' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontFamily: 'Inter, sans-serif',
          fontSize: 10,
          color: '#7f8c8d',
          formatter: (v: number) => v >= 1000 ? `${Math.round(v / 1000)}k €` : `${v} €`,
        },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: 'ETF-Sparplan (7% p.a.)',
          type: 'line',
          data: etfValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: '#27ae60' },
          itemStyle: { color: '#27ae60' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(39, 174, 96, 0.2)' },
                { offset: 1, color: 'rgba(39, 174, 96, 0.02)' },
              ],
            },
          },
        },
        {
          name: 'Sparkonto (1,5% p.a.)',
          type: 'line',
          data: savingsValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#f39c12', type: 'dashed' },
          itemStyle: { color: '#f39c12' },
        },
        {
          name: 'Eingezahlt',
          type: 'line',
          data: eigenanteilValues,
          smooth: false,
          symbol: 'none',
          lineStyle: { width: 1.5, color: '#94a3b8', type: 'dotted' },
          itemStyle: { color: '#94a3b8' },
        },
      ],
      animationDuration: 800,
      animationEasing: 'cubicOut',
    };
  });

  togglePanel(index: number): void {
    this.activePanel.update(current => current === index ? null : index);
  }

  onAffiliateClick(): void {
    // Track affiliate link click for analytics
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'affiliate_click', {
          event_category: 'monetization',
          event_label: 'broker_depot',
        });
      }
    } catch { /* ignore tracking errors */ }
  }
}



