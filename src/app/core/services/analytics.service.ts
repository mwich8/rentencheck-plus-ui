import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

/** Umami tracking function signature */
interface UmamiTracker {
  track: {
    (eventName: string, eventData?: Record<string, string | number | boolean>): void;
    (callback: (props: Record<string, string>) => Record<string, string | number | boolean>): void;
  };
}

/** Window augmented with Umami analytics */
interface WindowWithUmami extends Window {
  umami?: UmamiTracker;
}

/**
 * Lightweight analytics service using Umami.
 * DSGVO-compliant: no cookies, no personal data, open-source.
 *
 * Umami script is loaded dynamically after consent.
 * Custom events are sent via the `umami.track()` JS API.
 *
 * @see https://umami.is/docs/tracker-functions
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized: boolean = false;
  private readonly umamiUrl: string = environment.analytics.umamiUrl;
  private readonly websiteId: string = environment.analytics.umamiWebsiteId;

  /**
   * Initialize Umami by injecting the tracking script.
   * Called after cookie consent is given.
   * Umami is cookie-free so it can technically run without consent,
   * but we respect user choice.
   */
  init(): void {
    if (this.initialized || !this.websiteId || !this.umamiUrl || typeof document === 'undefined') return;

    const script: HTMLScriptElement = document.createElement('script');
    script.defer = true;
    script.dataset['websiteId'] = this.websiteId;
    script.src = `${this.umamiUrl}/script.js`;
    document.head.appendChild(script);

    this.initialized = true;
  }

  /**
   * Track a custom event.
   * @param name  Event name (e.g. 'pdf_download', 'affiliate_click')
   * @param props Optional properties (e.g. { source: 'action_tips' })
   */
  trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
    if (!this.websiteId) return;

    try {
      const umami: UmamiTracker | undefined = (window as unknown as WindowWithUmami).umami;
      if (umami?.track) {
        umami.track(name, props);
      }
    } catch { /* Silently ignore tracking errors */ }
  }

  /** Convenience: track PDF report download */
  trackPdfDownload(): void {
    this.trackEvent('pdf_download');
  }

  /** Convenience: track affiliate link click */
  trackAffiliateClick(source: string): void {
    this.trackEvent('affiliate_click', { source });
  }

  /** Convenience: track calculator usage */
  trackCalculation(): void {
    this.trackEvent('calculation');
  }

  /** Convenience: track premium unlock */
  trackPremiumUnlock(): void {
    this.trackEvent('premium_unlock');
  }
}

