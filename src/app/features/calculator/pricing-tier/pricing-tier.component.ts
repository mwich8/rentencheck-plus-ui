import { Component, input, output } from '@angular/core';

export type PricingTier = 'free' | 'report' | 'premium';

/**
 * Pricing tier cards for monetization.
 * Three tiers: Free (shock moment), Report (€14.90), Premium (€29.90).
 * When freeMode is true, Report and Premium show as "aktuell kostenlos".
 */
@Component({
  selector: 'app-pricing-tier',
  standalone: true,
  templateUrl: './pricing-tier.component.html',
  styleUrls: ['./pricing-tier.component.scss'],
})
export class PricingTierComponent {
  readonly freeMode = input<boolean>(false);
  readonly tierSelected = output<PricingTier>();
}



