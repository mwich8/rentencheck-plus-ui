import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollAnimateDirective } from '@shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [RouterLink, ScrollAnimateDirective],
  templateUrl: './features-section.component.html',
  styleUrls: ['./features-section.component.scss'],
})
export class FeaturesSectionComponent {}

