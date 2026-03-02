import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then(m => m.LandingPageComponent),
    title: 'RentenCheck+ — Die brutale Wahrheit über Ihre Rente',
  },
  {
    path: 'rechner',
    loadComponent: () =>
      import('./features/calculator/calculator-page.component').then(m => m.CalculatorPageComponent),
    title: 'RentenCheck+ — Rentenrechner',
  },
  {
    path: '**',
    redirectTo: '',
  },
];

