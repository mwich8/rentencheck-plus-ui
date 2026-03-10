import { Routes } from '@angular/router';
import { LATEST_STEUER_JAHR } from '@core/constants/tax-brackets.const';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@features/landing/landing-page.component').then(m => m.LandingPageComponent),
    title: 'RentenCheck+ — Die brutale Wahrheit über Ihre Rente',
    data: { meta: { description: `Berechnen Sie Ihre reale Rentenlücke. Steuern, Sozialabgaben und Inflation — die Wahrheit über Ihre gesetzliche Rente. Kostenloser Rentenrechner ${LATEST_STEUER_JAHR}.` } },
  },
  {
    path: 'rechner',
    loadComponent: () =>
      import('@features/calculator/calculator-page.component').then(m => m.CalculatorPageComponent),
    title: `Rentenrechner ${LATEST_STEUER_JAHR} — Nettorente & Rentenlücke berechnen | RentenCheck+`,
    data: { meta: { description: 'Kostenloser Rentenrechner: Berechnen Sie Ihre Nettorente nach Steuern (§32a EStG), Sozialabgaben und Inflation. Mit ETF-Sparplan-Empfehlung.' } },
  },
  {
    path: 'impressum',
    loadComponent: () =>
      import('@features/legal/impressum-page.component').then(m => m.ImpressumPageComponent),
    title: 'Impressum | RentenCheck+',
    data: { meta: { description: 'Impressum von RentenCheck+ — Angaben gemäß §5 TMG.' } },
  },
  {
    path: 'datenschutz',
    loadComponent: () =>
      import('@features/legal/datenschutz-page.component').then(m => m.DatenschutzPageComponent),
    title: 'Datenschutzerklärung | RentenCheck+',
    data: { meta: { description: 'Datenschutzerklärung von RentenCheck+ gemäß DSGVO. Alle Berechnungen laufen lokal in Ihrem Browser.' } },
  },
  {
    path: 'haftungsausschluss',
    loadComponent: () =>
      import('@features/legal/haftungsausschluss-page.component').then(m => m.HaftungsausschlussPageComponent),
    title: 'Haftungsausschluss | RentenCheck+',
    data: { meta: { description: 'Haftungsausschluss von RentenCheck+ — keine Steuer- oder Finanzberatung.' } },
  },
  {
    path: 'zahlung-erfolgreich',
    loadComponent: () =>
      import('@features/payment/payment-success.component').then(m => m.PaymentSuccessComponent),
    title: 'Zahlung erfolgreich | RentenCheck+',
    data: { meta: { robots: 'noindex' } },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
