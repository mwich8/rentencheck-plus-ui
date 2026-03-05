import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Haftungsausschluss (Disclaimer) — full legal disclaimer page.
 * Important for a financial calculator to clarify that this is not financial advice.
 */
@Component({
  selector: 'app-haftungsausschluss-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './haftungsausschluss-page.component.html',
  styleUrls: ['./haftungsausschluss-page.component.scss'],
})
export class HaftungsausschlussPageComponent {
  readonly currentYear = new Date().getFullYear();
}

