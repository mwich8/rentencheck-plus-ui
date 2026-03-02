import { Component } from '@angular/core';
import { HeroSectionComponent } from './hero-section.component';
import { ProblemSectionComponent } from './problem-section.component';
import { FeaturesSectionComponent } from './features-section.component';
import { TrustSectionComponent } from './trust-section.component';
import { LandingPricingComponent } from './landing-pricing.component';
import { LandingFaqComponent } from './landing-faq.component';
import { LandingCtaFooterComponent } from './landing-cta-footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    HeroSectionComponent,
    ProblemSectionComponent,
    FeaturesSectionComponent,
    LandingPricingComponent,
    TrustSectionComponent,
    LandingFaqComponent,
    LandingCtaFooterComponent,
  ],
  template: `
    <app-hero-section />
    <app-problem-section />
    <app-features-section />
    <app-landing-pricing />
    <app-trust-section />
    <app-landing-faq />
    <app-landing-cta-footer />
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LandingPageComponent {}


