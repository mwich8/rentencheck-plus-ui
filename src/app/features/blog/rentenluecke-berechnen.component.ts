import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BlogLayoutComponent } from './blog-layout.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rentenluecke-berechnen',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, RouterLink],
  templateUrl: './rentenluecke-berechnen.component.html',
})
export class RentenlueckeBerechnenComponent {}

