import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BlogLayoutComponent } from './blog-layout.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-altersvorsorge-mit-etf',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, RouterLink],
  templateUrl: './altersvorsorge-mit-etf.component.html',
})
export class AltersvorsorgeEtfComponent {}

