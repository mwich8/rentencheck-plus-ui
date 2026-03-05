import { Component, input, computed, inject } from '@angular/core';
import { PensionInput } from '@core/models/pension-input.model';
import { PensionResult } from '@core/models/pension-result.model';
import { PensionCalculatorService } from '@core/services/pension-calculator.service';
import { InflationService } from '@core/services/inflation.service';
import { SavingsCalculatorService } from '@core/services/savings-calculator.service';

interface TimelineMilestone {
  year: number;
  age: number;
  icon: string;
  label: string;
  sublabel: string;
  type: 'now' | 'action' | 'deadline' | 'retirement' | 'projection';
  urgency?: 'high' | 'medium' | 'low';
  metrics?: { label: string; value: string; color?: string }[];
  actionHint?: string;
  legalRef?: { label: string; url: string };
}

/**
 * Renten-Zeitstrahl — a chronological timeline view of the user's
 * pension journey. Shows key milestones, action windows, and projected
 * values at different life stages. Unique value: answers "What happens WHEN?"
 * vs. Scenario Comparison ("What IF?") and Optimization ("How to fix it?").
 */
@Component({
  selector: 'app-what-if-analysis',
  standalone: true,
  imports: [],
  templateUrl: './what-if-analysis.component.html',
  styleUrls: ['./what-if-analysis.component.scss'],
})
export class WhatIfAnalysisComponent {
  private readonly calcService = inject(PensionCalculatorService);
  private readonly inflationService = inject(InflationService);
  private readonly savingsService = inject(SavingsCalculatorService);

  readonly pensionInput = input.required<PensionInput>();
  readonly baselineResult = input.required<PensionResult>();

  /** Build the timeline milestones based on user's current situation */
  readonly milestones = computed<TimelineMilestone[]>(() => {
    const inp = this.pensionInput();
    const res = this.baselineResult();
    const currentYear = new Date().getFullYear();
    const milestones: TimelineMilestone[] = [];

    // ── 1. TODAY ──
    milestones.push({
      year: currentYear,
      age: inp.aktuellesAlter,
      icon: '📍',
      label: 'Heute — Ihr Ausgangspunkt',
      sublabel: `Sie sind ${inp.aktuellesAlter} Jahre alt. Ihre prognostizierte Bruttorente liegt bei ${inp.bruttoMonatlicheRente.toLocaleString('de-DE')} €/Monat. ${res.rentenluecke > 0 ? 'Es besteht Handlungsbedarf.' : 'Sie sind gut aufgestellt!'}`,
      type: 'now',
      metrics: [
        { label: 'Bruttorente', value: `${inp.bruttoMonatlicheRente.toLocaleString('de-DE')} €` },
        { label: 'Nettorente', value: `${Math.round(res.nettoMonatlich).toLocaleString('de-DE')} €` },
        { label: 'Rentenlücke', value: `${Math.round(res.rentenluecke).toLocaleString('de-DE')} €`, color: res.rentenluecke > 0 ? 'var(--color-danger)' : 'var(--color-success)' },
        { label: 'Deckung', value: `${res.deckungsquote.toFixed(0)}%`, color: res.deckungsquote >= 80 ? 'var(--color-success)' : 'var(--color-danger)' },
      ],
    });

    // ── 2. ZINSESZINS-FENSTER (if young enough and gap exists) ──
    if (res.jahresBisRente > 10 && res.rentenluecke > 0) {
      const compoundYears = res.jahresBisRente;
      const nowMonthly = this.savingsService.calculateRequiredMonthlySavings(res.rentenluecke, 0.07, compoundYears, 25);
      const laterYears = Math.max(1, compoundYears - 5);
      const laterMonthly = this.savingsService.calculateRequiredMonthlySavings(res.rentenluecke, 0.07, laterYears, 25);
      const costOfWaiting = Math.round(laterMonthly - nowMonthly);
      milestones.push({
        year: currentYear + 1, // offset by 1 so it doesn't overlap "today" visually
        age: inp.aktuellesAlter + 1,
        icon: '⏳',
        label: 'Zinseszins-Fenster — Jetzt handeln',
        sublabel: `Wenn Sie jetzt starten, brauchen Sie nur ${Math.round(nowMonthly).toLocaleString('de-DE')} €/Monat. Warten Sie 5 Jahre, werden es ${Math.round(laterMonthly).toLocaleString('de-DE')} €/Monat — das sind ${costOfWaiting.toLocaleString('de-DE')} € mehr pro Monat durch entgangenen Zinseszins.`,
        type: 'action',
        urgency: 'high',
        metrics: [
          { label: 'Jetzt starten', value: `${Math.round(nowMonthly).toLocaleString('de-DE')} €/M`, color: 'var(--color-success)' },
          { label: 'In 5 J. starten', value: `${Math.round(laterMonthly).toLocaleString('de-DE')} €/M`, color: 'var(--color-danger)' },
          { label: 'Kosten des Wartens', value: `+${costOfWaiting.toLocaleString('de-DE')} €/M`, color: 'var(--color-danger)' },
        ],
        actionHint: 'Je früher Sie beginnen, desto weniger müssen Sie monatlich aufwenden.',
      });
    }

    // ── 3. AGE 50 — Riester/Rürup Deadline ──
    const yearsTo50 = 50 - inp.aktuellesAlter;
    if (yearsTo50 > 0 && inp.aktuellesAlter > 25) {
      milestones.push({
        year: currentYear + yearsTo50,
        age: 50,
        icon: '📋',
        label: 'Riester/Rürup — Letzte effektive Phase',
        sublabel: `Ab 50 wird der Steuervorteil von Rürup-Verträgen durch die kürzere Ansparzeit geringer. Nutzen Sie die verbleibenden ${yearsTo50} Jahre für maximale staatliche Förderung.`,
        type: 'action',
        urgency: yearsTo50 <= 5 ? 'high' : 'medium',
        actionHint: 'Prüfen Sie Riester- und Rürup-Angebote für maximale staatliche Zulagen und Steuervorteile.',
        legalRef: {
          label: '§10a EStG — Riester-Förderung',
          url: 'https://www.gesetze-im-internet.de/estg/__10a.html',
        },
      });
    }

    // ── 4. AGE 55 — Betriebliche AV Deadline ──
    const yearsTo55 = 55 - inp.aktuellesAlter;
    if (yearsTo55 > 0 && res.jahresBisRente > 5) {
      milestones.push({
        year: currentYear + yearsTo55,
        age: 55,
        icon: '🏢',
        label: 'Betriebliche Altersvorsorge — Handlungsfenster',
        sublabel: `Entgeltumwandlung lohnt sich am meisten mit genügend Ansparzeit. Ab 55 wird es eng. Sprechen Sie jetzt mit Ihrem Arbeitgeber.`,
        type: 'action',
        urgency: yearsTo55 <= 3 ? 'high' : 'low',
        actionHint: 'Fragen Sie Ihren Arbeitgeber nach dem bAV-Angebot — er muss mindestens 15% Zuschuss geben.',
        legalRef: {
          label: '§1a BetrAVG — Entgeltumwandlung',
          url: 'https://www.gesetze-im-internet.de/betravg/__1a.html',
        },
      });
    }

    // ── 5. AGE 63 — Frühestmögliche Rente (besonders langjährig Versicherte) ──
    const yearsTo63 = 63 - inp.aktuellesAlter;
    if (yearsTo63 > 0) {
      // Abschlag: 0.3% pro Monat vor Regelaltersgrenze
      const monthsEarly = (inp.rentenbeginnJahr - (currentYear + yearsTo63)) * 12;
      const abschlagProzent = Math.max(0, monthsEarly * 0.3);
      const earlyBrutto = Math.round(inp.bruttoMonatlicheRente * (1 - abschlagProzent / 100));
      const earlyResult = abschlagProzent > 0
        ? this.calcService.calculate({ ...inp, rentenbeginnJahr: currentYear + yearsTo63, bruttoMonatlicheRente: earlyBrutto })
        : null;

      milestones.push({
        year: currentYear + yearsTo63,
        age: 63,
        icon: '🔑',
        label: 'Frühestmögliche Altersrente (63)',
        sublabel: abschlagProzent > 0
          ? `Mit 45 Beitragsjahren: abschlagsfrei. Ansonsten: ${abschlagProzent.toFixed(1)}% Abschlag (${(abschlagProzent / 0.3).toFixed(0)} Monate vor Regelalter).`
          : 'Sie könnten hier bereits ohne Abschläge in Rente gehen.',
        type: 'deadline',
        metrics: earlyResult ? [
          { label: 'Abschlag', value: `-${abschlagProzent.toFixed(1)}%`, color: 'var(--color-danger)' },
          { label: 'Bruttorente', value: `${earlyBrutto.toLocaleString('de-DE')} €`, color: 'var(--color-danger)' },
          { label: 'Netto bei 63', value: `${Math.round(earlyResult.nettoMonatlich).toLocaleString('de-DE')} €` },
        ] : [
          { label: 'Abschlag', value: 'keiner', color: 'var(--color-success)' },
        ],
        legalRef: {
          label: '§36 SGB VI — Altersrente für langjährig Versicherte',
          url: 'https://www.gesetze-im-internet.de/sgb_6/__36.html',
        },
      });
    }

    // ── 6. RETIREMENT ──
    milestones.push({
      year: inp.rentenbeginnJahr,
      age: inp.aktuellesAlter + res.jahresBisRente,
      icon: '🎉',
      label: 'Ihr Rentenbeginn',
      sublabel: `Regelaltersgrenze erreicht. Ihre Rente wird mit ${(res.besteuerungsanteil * 100).toFixed(0)}% besteuert (Besteuerungsanteil für Rentenbeginn ${inp.rentenbeginnJahr}).`,
      type: 'retirement',
      metrics: [
        { label: 'Bruttorente', value: `${inp.bruttoMonatlicheRente.toLocaleString('de-DE')} €` },
        { label: 'Nettorente', value: `${Math.round(res.nettoMonatlich).toLocaleString('de-DE')} €`, color: 'var(--color-success)' },
        { label: 'Kaufkraft (real)', value: `${Math.round(res.realeKaufkraftMonatlich).toLocaleString('de-DE')} €`, color: res.realeKaufkraftMonatlich < res.nettoMonatlich * 0.7 ? 'var(--color-danger)' : undefined },
        { label: 'Besteuerung', value: `${(res.besteuerungsanteil * 100).toFixed(0)}%` },
      ],
      legalRef: {
        label: '§22 Nr. 1 EStG — Rentenbesteuerung',
        url: 'https://www.gesetze-im-internet.de/estg/__22.html',
      },
    });

    // ── 7. 10 YEARS INTO RETIREMENT — Inflation impact ──
    const retirementAge = inp.aktuellesAlter + res.jahresBisRente;
    if (inp.inflationsrate > 0) {
      const projYear10 = inp.rentenbeginnJahr + 10;
      const realValue10 = this.inflationService.computeRealValue(
        res.nettoMonatlich, inp.inflationsrate, res.jahresBisRente + 10
      );
      const kaufkraftVerlust10 = res.nettoMonatlich > 0
        ? Math.round((1 - realValue10 / res.nettoMonatlich) * 100)
        : 0;

      milestones.push({
        year: projYear10,
        age: retirementAge + 10,
        icon: '📉',
        label: '10 Jahre im Ruhestand — Inflationseffekt',
        sublabel: `Nach 10 Jahren Ruhestand hat die Inflation Ihre Kaufkraft um ca. ${kaufkraftVerlust10}% reduziert. Ihre ${Math.round(res.nettoMonatlich).toLocaleString('de-DE')} € Nettorente haben dann nur noch eine Kaufkraft von ${Math.round(realValue10).toLocaleString('de-DE')} €.`,
        type: 'projection',
        metrics: [
          { label: 'Nominal', value: `${Math.round(res.nettoMonatlich).toLocaleString('de-DE')} €` },
          { label: 'Real (Kaufkraft)', value: `${Math.round(realValue10).toLocaleString('de-DE')} €`, color: 'var(--color-danger)' },
          { label: 'Kaufkraftverlust', value: `-${kaufkraftVerlust10}%`, color: 'var(--color-danger)' },
        ],
      });

      // ── 8. 25 YEARS INTO RETIREMENT — Long-term outlook ──
      const projYear25 = inp.rentenbeginnJahr + 25;
      const realValue25 = this.inflationService.computeRealValue(
        res.nettoMonatlich, inp.inflationsrate, res.jahresBisRente + 25
      );
      const kaufkraftVerlust25 = res.nettoMonatlich > 0
        ? Math.round((1 - realValue25 / res.nettoMonatlich) * 100)
        : 0;

      milestones.push({
        year: projYear25,
        age: retirementAge + 25,
        icon: '🔮',
        label: '25 Jahre im Ruhestand — Langzeitprognose',
        sublabel: `Bei ${(inp.inflationsrate * 100).toFixed(1)}% jährlicher Inflation hat Ihre Rente nach 25 Jahren nur noch ${Math.max(0, 100 - kaufkraftVerlust25)}% der heutigen Kaufkraft. ${kaufkraftVerlust25 > 50 ? 'Private Vorsorge ist essentiell, um diesen Verlust auszugleichen.' : 'Ein guter Grund, frühzeitig vorzusorgen.'}`,
        type: 'projection',
        metrics: [
          { label: 'Nominal', value: `${Math.round(res.nettoMonatlich).toLocaleString('de-DE')} €` },
          { label: 'Real (Kaufkraft)', value: `${Math.round(realValue25).toLocaleString('de-DE')} €`, color: 'var(--color-danger)' },
          { label: 'Kaufkraftverlust', value: `-${kaufkraftVerlust25}%`, color: 'var(--color-danger)' },
        ],
      });
    }

    // Sort by year, then by type priority for same year
    const typePriority: Record<string, number> = { now: 0, action: 1, deadline: 2, retirement: 3, projection: 4 };
    return milestones.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
    });
  });

  readonly totalYears = computed(() => {
    const ms = this.milestones();
    if (ms.length < 2) return 0;
    return ms[ms.length - 1].year - ms[0].year;
  });

  readonly inflationLoss = computed(() => {
    const res = this.baselineResult();
    if (res.nettoMonatlich <= 0) return 0;
    return Math.round((1 - res.realeKaufkraftMonatlich / res.nettoMonatlich) * 100);
  });

  readonly actionWindowYears = computed(() => this.baselineResult().jahresBisRente);

  readonly actionMilestoneCount = computed(() =>
    this.milestones().filter(m => m.type === 'action' || m.type === 'deadline').length
  );
}

