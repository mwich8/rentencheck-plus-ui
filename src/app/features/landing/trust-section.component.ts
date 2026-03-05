import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-trust-section',
  standalone: true,
  imports: [ScrollAnimateDirective],
  templateUrl: './trust-section.component.html',
  styleUrls: ['./trust-section.component.scss'],
})
export class TrustSectionComponent {}

