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
  template: `
    <section class="faq-section">
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="section-tag">❓ Häufige Fragen</span>
          <h2 class="section-title">Ihre Fragen — <span class="text-gradient">unsere Antworten</span></h2>
        </div>

        <div class="faq-list" appScrollAnimate>
          @for (item of faqs; track item.question; let i = $index) {
            <details class="faq-item" (toggle)="onToggle(i, $event)">
              <summary class="faq-question">
                <span class="faq-q-text">{{ item.question }}</span>
                <span class="faq-chevron" [class.open]="openIndex() === i">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </summary>
              <div class="faq-answer">
                <p>{{ item.answer }}</p>
              </div>
            </details>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .faq-section {
      padding: 6rem 0;
      background: white;
    }

    .section-header {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 3rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(15, 52, 96, 0.06);
      color: var(--color-accent);
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      font-weight: 900;
      color: var(--color-primary);
      line-height: 1.2;
    }

    .text-gradient {
      background: linear-gradient(135deg, var(--color-accent), var(--color-danger));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .faq-list {
      max-width: 750px;
      margin: 0 auto;
    }

    .faq-item {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: 0.75rem;
      overflow: hidden;
      transition: box-shadow 0.3s ease;
    }

    .faq-item:hover {
      box-shadow: var(--shadow-sm);
    }

    .faq-item[open] {
      box-shadow: var(--shadow-md);
      border-color: rgba(15, 52, 96, 0.2);
    }

    .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      cursor: pointer;
      list-style: none;
      user-select: none;
      transition: background 0.2s;
    }

    .faq-question::-webkit-details-marker { display: none; }

    .faq-question:hover {
      background: rgba(15, 52, 96, 0.02);
    }

    .faq-q-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-primary);
      padding-right: 1rem;
    }

    .faq-chevron {
      flex-shrink: 0;
      color: var(--color-text-light);
      transition: transform 0.3s ease;
      display: flex;
    }

    .faq-chevron.open {
      transform: rotate(180deg);
    }

    .faq-answer {
      padding: 0 1.5rem 1.25rem;
    }

    .faq-answer p {
      font-size: 0.92rem;
      color: var(--color-text-light);
      line-height: 1.8;
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
  `]
})
export class LandingFaqComponent {
  readonly openIndex = signal<number | null>(null);

  readonly faqs: FaqItem[] = [
    {
      question: 'Wie viel bleibt von meiner gesetzlichen Rente wirklich übrig?',
      answer: 'Von der Bruttorente werden Einkommensteuer (§32a EStG), Krankenversicherung (KVdR), Pflegeversicherung und der Inflationsverlust abgezogen. Bei einer Bruttorente von 1.500€ bleiben oft unter 900€ reale Kaufkraft.',
    },
    {
      question: 'Was ist die Rentenlücke?',
      answer: 'Die Rentenlücke ist die Differenz zwischen Ihrem gewünschten Monatseinkommen im Alter und der tatsächlichen realen Kaufkraft Ihrer gesetzlichen Rente nach allen Abzügen und Inflation.',
    },
    {
      question: 'Wie genau sind die Berechnungen?',
      answer: 'Unsere Berechnungen basieren auf den aktuellen gesetzlichen Grundlagen (§32a EStG 2025/2026, KVdR-Sätze, §55 SGB XI). Sie können von Ihrer individuellen Situation abweichen, bieten aber eine sehr gute Orientierung.',
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
      answer: 'Die Detail-Analyse (14,90€) liefert einen PDF-Report mit 30-Jahre-Inflationsprognose und persönlichen Handlungsempfehlungen — z.\u00a0B. ob Sie Kindererziehungszeiten (Formular V0800) bei der DRV geltend machen können. Das Premium-Paket (29,90€) bietet zusätzlich Multi-Szenario-Vergleiche, Was-wäre-wenn-Analysen und individuelle Optimierungsvorschläge.',
    },
  ];

  onToggle(index: number, event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.openIndex.set(details.open ? index : null);
  }
}

