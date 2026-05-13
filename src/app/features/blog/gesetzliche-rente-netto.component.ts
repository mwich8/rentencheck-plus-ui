import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BlogLayoutComponent } from './blog-layout.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gesetzliche-rente-netto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, RouterLink],
  templateUrl: './gesetzliche-rente-netto.component.html',
})
export class GesetzlicheRenteNettoComponent {}

