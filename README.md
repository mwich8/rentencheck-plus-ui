# RentenCheck+ 🇩🇪

**Die brutale Wahrheit über Ihre Rente** — A German pension gap calculator that shows what's really left of your statutory pension after taxes, social insurance, and inflation.

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-Private-lightgrey)

## What is this?

RentenCheck+ calculates the **real purchasing power** of a German statutory pension (gesetzliche Rente). Users enter their projected gross pension and instantly see the impact of:

- **Income tax** — computed per §32a EStG 2025/2026 (piecewise progressive tariff)
- **Health insurance** — KVdR contributions (GKV-Spitzenverband rates)
- **Care insurance** — Pflegeversicherung per §55 SGB XI (with/without children surcharge)
- **Solidarity surcharge** — Solidaritätszuschlag with Freigrenze & Gleitzone
- **Inflation** — compound purchasing-power decay over 30 years

Everything runs **100% client-side** — no backend, no data leaves the browser.

## Features

### Free Tier
| Feature | Description |
|---------|-------------|
| 💰 Real Purchasing Power | Brutto → Netto → Real pipeline with animated shock number |
| 📊 Pension Gap | Difference between desired retirement income and real pension |
| 🧾 Deduction Breakdown | Visual bar-by-bar breakdown of every deduction |
| 📉 Waterfall Chart | Canvas-rendered step-by-step melt-down from gross to real |
| 📈 Projection Chart | 30-year inflation projection (ECharts) |
| 🎯 Renten-Score | 0–100 grade (A–F) with benchmark vs. German average |
| 💡 Action Tips | Personalized savings recommendations with ETF vs. Sparkonto comparison |

### Paid Tiers (UI ready, payments not yet integrated)
- **Detail-Analyse** (€14.90) — PDF report, 30-year inflation prognosis
- **Renten-Strategie** (€29.90) — Multi-scenario comparison, what-if analysis, optimization

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, zoneless change detection) |
| Styling | Tailwind CSS 4 + component-scoped SCSS |
| Charts | ECharts 5 via `ngx-echarts` + custom Canvas waterfall |
| State | Angular Signals (no NgRx, no RxJS stores) |
| Build | `@angular/build` (esbuild) |
| Fonts | Inter (Google Fonts) |

## Project Structure

```
src/app/
├── core/
│   ├── constants/          # Tax brackets, insurance rates
│   ├── models/             # PensionInput, PensionResult interfaces
│   └── services/           # Tax, SocialInsurance, Inflation, SavingsCalculator, RentenScore
├── features/
│   ├── calculator/         # Main calculator page (/rechner)
│   │   ├── input-panel/    # Slider-based input form
│   │   ├── result-panel/   # Shock number, deduction breakdown, Renten-Score
│   │   ├── action-tips/    # Personalized savings recommendations
│   │   ├── premium-teaser/ # Blurred premium previews (upsell)
│   │   └── pricing-tier/   # Three-tier pricing cards
│   ├── chart/              # Waterfall (Canvas) + Projection (ECharts)
│   ├── landing/            # Marketing landing page (/)
│   └── legal/              # Impressum, Datenschutz, Haftungsausschluss
└── shared/
    ├── directives/         # ScrollAnimate, CountUp
    └── pipes/              # EuroPipe (German currency formatting)
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm start
# → http://localhost:4200

# Production build
npm run build
# → dist/rentencheck-plus/
```

## Routes

| Path | Page |
|------|------|
| `/` | Landing page |
| `/rechner` | Pension calculator |
| `/impressum` | Legal notice (§5 TMG) |
| `/datenschutz` | Privacy policy (DSGVO) |
| `/haftungsausschluss` | Disclaimer |

## Legal Data Sources

All calculations reference current German law:

- **§32a EStG** — Income tax tariff 2025/2026
- **KVdR** — Health insurance rates (GKV-Spitzenverband)
- **§22 Nr. 1 EStG** — Pension taxation share (Wachstumschancengesetz)
- **§55 SGB XI** — Care insurance contributions
- **Soli** — Solidarity surcharge with 2021+ Freigrenze
---

<sub>RentenCheck+ is an information tool and does not constitute tax, financial, or legal advice.</sub>

