import { Component, signal } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './landing-faq.component.html',
  styleUrls: ['./landing-faq.component.scss'],
})
export class LandingFaqComponent {
  readonly openIndex = signal<number | null>(null);

  readonly faqs: FaqItem[] = [
    {
      question: 'Wie viel bleibt von meiner gesetzlichen Rente wirklich übrig?',
      answer: 'Von der Bruttorente werden Einkommensteuer (<a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG</a>), Krankenversicherung (<a href="https://www.gkv-spitzenverband.de" target="_blank" rel="noopener">KVdR</a>), Pflegeversicherung und der Inflationsverlust abgezogen. Bei einer Bruttorente von 1.500€ bleiben oft unter 900€ reale Kaufkraft.',
    },
    {
      question: 'Was ist die Rentenlücke?',
      answer: 'Die Rentenlücke ist die Differenz zwischen Ihrem gewünschten Monatseinkommen im Alter und der tatsächlichen realen Kaufkraft Ihrer gesetzlichen Rente nach allen Abzügen und Inflation.',
    },
    {
      question: 'Wie genau sind die Berechnungen?',
      answer: 'Unsere Berechnungen basieren auf den aktuellen gesetzlichen Grundlagen (<a href="https://www.gesetze-im-internet.de/estg/__32a.html" target="_blank" rel="noopener">§32a EStG 2025/2026</a>, <a href="https://www.gkv-spitzenverband.de" target="_blank" rel="noopener">KVdR-Sätze</a>, <a href="https://www.gesetze-im-internet.de/sgb_11/__55.html" target="_blank" rel="noopener">§55 SGB XI</a>). Sie können von Ihrer individuellen Situation abweichen, bieten aber eine sehr gute Orientierung.',
    },
    {
      question: 'Werden meine Daten gespeichert?',
      answer: 'Nein! Alle Berechnungen laufen zu 100% in Ihrem Browser (Client-Side). Es werden keine persönlichen Daten an einen Server gesendet. Wir sind vollständig DSGVO-konform.',
    },
    {
      question: 'Was bekomme ich beim kostenlosen Schnell-Check?',
      answer: 'Im Schnell-Check erhalten Sie die Berechnung Ihrer realen Kaufkraft, die Darstellung Ihrer Rentenlücke, eine vollständige Steuer- und Abzugsübersicht sowie interaktive Diagramme — alles ohne Registrierung.',
    },
    {
      question: 'Was unterscheidet die Detail-Analyse vom Premium-Paket?',
      answer: 'Die Detail-Analyse ist aktuell kostenlos und liefert einen PDF-Report mit 30-Jahre-Inflationsprognose und persönlichen Handlungsempfehlungen — z.\u00a0B. ob Sie Kindererziehungszeiten (<a href="https://www.deutsche-rentenversicherung.de/SharedDocs/Formulare/DE/_pdf/V0800.html" target="_blank" rel="noopener">Formular V0800</a>) bei der DRV geltend machen können. Das Premium-Paket bietet zukünftig zusätzlich Multi-Szenario-Vergleiche, einen persönlichen Renten-Zeitstrahl und individuelle Optimierungsvorschläge.',
    },
  ];

  onToggle(index: number, event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.openIndex.set(details.open ? index : null);
  }
}

