import { Component, input, computed, inject, output } from '@angular/core';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { PensionResult } from '@core/models/pension-result.model';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';

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
  templateUrl: './action-tips.component.html',
  styleUrls: ['./action-tips.component.scss'],
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
        description: `Für Kindererziehung können bis zu 3 Rentenpunkte pro Kind gutgeschrieben werden — das sind ca. 111 €/Monat mehr Rente. Falls noch nicht beantragt, stellen Sie den Antrag mit dem Formular V0800 bei der Deutschen Rentenversicherung (deutsche-rentenversicherung.de).`,
        highlight: `Formular V0800 bei der DRV anfordern`,
        type: 'strategy',
      });
    }

    return tips.slice(0, 5);
  });
}

