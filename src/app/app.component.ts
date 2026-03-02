import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root AppComponent — thin shell with router outlet.
 * Landing page and Calculator are lazy-loaded via routes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class AppComponent {}
