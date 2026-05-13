import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="blog-page">
      <nav class="blog-nav">
        <a routerLink="/" class="nav-brand">RentenCheck<span class="brand-plus">+</span></a>
        <a routerLink="/rechner" class="nav-back-link">← Rechner</a>
      </nav>

      <main class="blog-content">
        <ng-content />
      </main>

      <div class="blog-cta">
        <p class="cta-eyebrow">Kostenloser Rentenrechner</p>
        <h3>Wie groß ist <em>Ihre</em> Rentenlücke?</h3>
        <p>Berechnen Sie jetzt Ihre reale Nettorente nach Steuern, Sozialabgaben und Inflation — in unter 2 Minuten.</p>
        <a routerLink="/rechner" class="cta-button">Jetzt Rentenlücke berechnen →</a>
      </div>

      <footer class="blog-footer">
        <div class="footer-links">
          <a routerLink="/">Startseite</a>
          <a routerLink="/rechner">Rechner</a>
          <a routerLink="/impressum">Impressum</a>
          <a routerLink="/datenschutz">Datenschutz</a>
          <a routerLink="/haftungsausschluss">Haftungsausschluss</a>
        </div>
        <p class="footer-copy">© {{ currentYear }} RentenCheck+ — Keine Steuer- oder Finanzberatung.</p>
      </footer>
    </div>
  `,
  styles: [`
    .blog-page {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .blog-nav {
      background: #0f3460;
      padding: 0.75rem clamp(1rem, 4vw, 2rem);
      padding-top: max(0.75rem, env(safe-area-inset-top));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      font-size: 1.3rem;
      font-weight: 900;
      color: white;
      text-decoration: none;
    }

    .brand-plus { color: #e94560; }

    .nav-back-link {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-back-link:hover { color: white; }

    .blog-content {
      max-width: 720px;
      margin: 0 auto;
      padding: 2.5rem clamp(1rem, 4vw, 2rem) 3rem;
    }

    :host ::ng-deep .blog-content h1 {
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-weight: 900;
      color: #0f3460;
      line-height: 1.25;
      margin-bottom: 0.75rem;
    }

    :host ::ng-deep .blog-content .article-meta {
      color: #adb5bd;
      font-size: 0.85rem;
      margin-bottom: 2rem;
    }

    :host ::ng-deep .blog-content h2 {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1a1a2e;
      margin-top: 2.25rem;
      margin-bottom: 0.75rem;
    }

    :host ::ng-deep .blog-content p {
      font-size: 1.05rem;
      line-height: 1.8;
      color: #4a5568;
      margin-bottom: 1.25rem;
    }

    :host ::ng-deep .blog-content ul,
    :host ::ng-deep .blog-content ol {
      padding-left: 1.5rem;
      margin-bottom: 1.25rem;
    }

    :host ::ng-deep .blog-content li {
      font-size: 1.05rem;
      line-height: 1.8;
      color: #4a5568;
      margin-bottom: 0.4rem;
    }

    :host ::ng-deep .blog-content strong {
      color: #1a1a2e;
      font-weight: 700;
    }

    :host ::ng-deep .blog-content .highlight-box {
      background: #eef4fb;
      border-left: 4px solid #2980b9;
      padding: 1.25rem 1.5rem;
      border-radius: 0 8px 8px 0;
      margin: 1.5rem 0;
    }

    :host ::ng-deep .blog-content .highlight-box p {
      margin-bottom: 0;
      font-size: 1rem;
    }

    :host ::ng-deep .blog-content .example-box {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    :host ::ng-deep .blog-content .example-box h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #0f3460;
      margin-bottom: 0.75rem;
    }

    :host ::ng-deep .blog-content .example-box p,
    :host ::ng-deep .blog-content .example-box li {
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }

    :host ::ng-deep .blog-content .disclaimer {
      font-size: 0.82rem;
      color: #adb5bd;
      border-top: 1px solid #e9ecef;
      padding-top: 1.5rem;
      margin-top: 2.5rem;
      line-height: 1.6;
    }

    .blog-cta {
      max-width: 720px;
      margin: 0 auto 3rem;
      padding: 2rem clamp(1.25rem, 4vw, 2.5rem);
      background: linear-gradient(135deg, #0f3460, #1a1a5e);
      border-radius: 14px;
      text-align: center;
      color: white;
    }

    .cta-eyebrow {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 0.5rem;
    }

    .blog-cta h3 {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .blog-cta h3 em {
      color: #e94560;
      font-style: normal;
    }

    .blog-cta p {
      font-size: 0.95rem;
      color: rgba(255,255,255,0.8);
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }

    .cta-button {
      display: inline-block;
      background: #e94560;
      color: white;
      padding: 0.85rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(233,69,96,0.4);
    }

    .blog-footer {
      max-width: 720px;
      margin: 0 auto;
      padding: 1.5rem clamp(1rem, 4vw, 2rem) 2rem;
      text-align: center;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .footer-links a {
      color: #adb5bd;
      text-decoration: none;
      font-size: 0.85rem;
    }

    .footer-links a:hover { color: #2980b9; }

    .footer-copy {
      color: #ced4da;
      font-size: 0.78rem;
    }

    @media (max-width: 600px) {
      .blog-content { padding: 1.5rem 1rem 2rem; }
      .blog-cta { margin-left: 0.75rem; margin-right: 0.75rem; }
    }
  `],
})
export class BlogLayoutComponent {
  readonly currentYear = new Date().getFullYear();
}

