import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BlogLayoutComponent } from './blog-layout.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rentenreform-2027',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, RouterLink],
  templateUrl: './rentenreform-2027.component.html',
})
export class Rentenreform2027Component {}

