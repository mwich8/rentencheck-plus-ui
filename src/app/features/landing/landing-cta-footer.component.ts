import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-landing-cta-footer',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './landing-cta-footer.component.html',
  styleUrls: ['./landing-cta-footer.component.scss'],
})
export class LandingCtaFooterComponent {
  readonly currentYear = new Date().getFullYear();
}

