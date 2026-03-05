import { Component, output } from '@angular/core';

export type PricingTier = 'free' | 'report' | 'premium';

/**
 * Pricing tier cards for monetization.
 * Three tiers: Free (shock moment), Report (€14.90), Premium (€29.90).
 */
@Component({
  selector: 'app-pricing-tier',
  standalone: true,
  templateUrl: './pricing-tier.component.html',
  styleUrls: ['./pricing-tier.component.scss'],
})
export class PricingTierComponent {
  readonly tierSelected = output<PricingTier>();
}



