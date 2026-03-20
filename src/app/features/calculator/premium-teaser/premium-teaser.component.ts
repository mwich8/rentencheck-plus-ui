import { Component, input, output } from '@angular/core';

/**
 * Blurred premium feature previews that create desire to upgrade.
 * Shows locked previews of Multi-Szenario and PDF Report.
 */
@Component({
  selector: 'app-premium-teaser',
  standalone: true,
  templateUrl: './premium-teaser.component.html',
  styleUrls: ['./premium-teaser.component.scss'],
})
export class PremiumTeaserComponent {
  readonly freeMode = input<boolean>(false);
  readonly unlock = output<string>();
}

