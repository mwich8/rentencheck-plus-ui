import { Component, input, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionInput } from '@core/models/pension-input.model';
import { PensionResult } from '@core/models/pension-result.model';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';
import { OptimizationSuggestion } from '@core/models/scenario.model';

/**
 * Optimierungsvorschläge & Strategievergleich — personalized, quantified
 * recommendations for closing the pension gap with different strategies.
 */
@Component({
  selector: 'app-optimization-strategies',
  standalone: true,
  imports: [EuroPipe, DecimalPipe],
  templateUrl: './optimization-strategies.component.html',
  styleUrls: ['./optimization-strategies.component.scss'],
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


