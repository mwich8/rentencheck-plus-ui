import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { filter, map, mergeMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CookieConsentComponent } from '@shared/components/cookie-consent.component';

/**
 * Root AppComponent — thin shell with router outlet + cookie consent.
 * Updates meta tags on each route change for SEO.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.route),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => {
      const metaData = data['meta'] as Record<string, string> | undefined;
      if (metaData?.['description']) {
        this.meta.updateTag({ name: 'description', content: metaData['description'] });
        this.meta.updateTag({ property: 'og:description', content: metaData['description'] });
        this.meta.updateTag({ name: 'twitter:description', content: metaData['description'] });
      }
      if (metaData?.['robots']) {
        this.meta.updateTag({ name: 'robots', content: metaData['robots'] });
      } else {
        this.meta.updateTag({ name: 'robots', content: 'index, follow' });
      }
    });
  }
}
