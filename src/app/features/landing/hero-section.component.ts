import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [RouterLink, CountUpDirective],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.scss'],
})
export class HeroSectionComponent {}

