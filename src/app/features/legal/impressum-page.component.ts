import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Impressum (Legal Notice) — required by §5 TMG and §18 Abs. 2 MStV.
 * Must contain: Name, address, contact, registration, VAT-ID.
 */
@Component({
  selector: 'app-impressum-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './impressum-page.component.html',
  styleUrls: ['./impressum-page.component.scss'],
})
export class ImpressumPageComponent {
  readonly currentYear: number = new Date().getFullYear();
}

