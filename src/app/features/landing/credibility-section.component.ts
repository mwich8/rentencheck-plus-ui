import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';

/**
 * Credibility section — honest, verifiable trust signals.
 *
 * IMPORTANT: Every claim in this section MUST be factually true and verifiable.
 * No fabricated user counts, no fake testimonials, no invented statistics.
 * Only statements about the product's methodology, privacy, and independence
 * that can be independently confirmed.
 */
@Component({
  selector: 'app-credibility-section',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './credibility-section.component.html',
  styleUrls: ['./credibility-section.component.scss'],
})
export class CredibilitySectionComponent {
  readonly currentYear = new Date().getFullYear();
}


