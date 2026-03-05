import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-landing-pricing',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './landing-pricing.component.html',
  styleUrls: ['./landing-pricing.component.scss'],
})
export class LandingPricingComponent {}

