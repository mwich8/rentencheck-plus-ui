import { Component } from '@angular/core';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { CountUpDirective } from '../../shared/directives/count-up.directive';

@Component({
  selector: 'app-problem-section',
  standalone: true,
  imports: [ScrollAnimateDirective, CountUpDirective],
  templateUrl: './problem-section.component.html',
  styleUrls: ['./problem-section.component.scss'],
})
export class ProblemSectionComponent {}

