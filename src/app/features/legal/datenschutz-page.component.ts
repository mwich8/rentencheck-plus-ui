import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Datenschutzerklärung (Privacy Policy) — required by DSGVO (Art. 13/14 DSGVO).
 * Since this app runs 100% client-side with no data collection,
 * the policy is straightforward but still legally required.
 */
@Component({
  selector: 'app-datenschutz-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './datenschutz-page.component.html',
  styleUrls: ['./datenschutz-page.component.scss'],
})
export class DatenschutzPageComponent {
  readonly currentYear: number = new Date().getFullYear();
}

