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
    path: 'impressum',
    loadComponent: () =>
      import('./features/legal/impressum-page.component').then(m => m.ImpressumPageComponent),
    title: 'RentenCheck+ — Impressum',
  },
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('./features/legal/datenschutz-page.component').then(m => m.DatenschutzPageComponent),
    title: 'RentenCheck+ — Datenschutzerklärung',
  },
  {
    path: 'haftungsausschluss',
    loadComponent: () =>
      import('./features/legal/haftungsausschluss-page.component').then(m => m.HaftungsausschlussPageComponent),
    title: 'RentenCheck+ — Haftungsausschluss',
  },
  {
    path: 'zahlung-erfolgreich',
    loadComponent: () =>
      import('./features/payment/payment-success.component').then(m => m.PaymentSuccessComponent),
    title: 'RentenCheck+ — Zahlung erfolgreich',
  },
  {
    path: '**',
    redirectTo: '',
  },
];

