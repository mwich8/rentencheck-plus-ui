import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

/** Plausible analytics global function signature */
interface PlausibleFn {
  (eventName: string, options?: { props?: Record<string, string | number | boolean> }): void;
  q?: unknown[][];
}

/** Window augmented with Plausible analytics */
interface WindowWithPlausible extends Window {
  plausible?: PlausibleFn;
}

/**
 * Lightweight analytics service using Plausible.io.
 * DSGVO-compliant: no cookies, no personal data, EU-hosted.
 *
 * Plausible script is loaded dynamically after consent.
 * Custom events are sent via the JS API or beacon fallback.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized: boolean = false;
  private readonly domain: string = environment.analytics.plausibleDomain;

  /**
   * Initialize Plausible by injecting the script tag.
   * Called after cookie consent is given or if analytics domain is configured.
   * Plausible is cookie-free so it can technically run without consent,
   * but we respect user choice.
   */
  init(): void {
    if (this.initialized || !this.domain || typeof document === 'undefined') return;

    const script: HTMLScriptElement = document.createElement('script');
    script.defer = true;
    script.dataset['domain'] = this.domain;
    script.dataset['api'] = 'https://plausible.io/api/event';
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);

    // Expose plausible function for custom events
    const w: WindowWithPlausible = window as unknown as WindowWithPlausible;
    w.plausible = w.plausible || function (...args: unknown[]) {
      (w.plausible!.q = w.plausible!.q || []).push(args);
    };

    this.initialized = true;
  }

  /**
   * Track a custom event.
   * @param name  Event name (e.g. 'pdf_download', 'affiliate_click')
   * @param props Optional properties (e.g. { source: 'action_tips' })
   */
  trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
    if (!this.domain) return;

    try {
      const plausible: PlausibleFn | undefined = (window as unknown as WindowWithPlausible).plausible;
      if (typeof plausible === 'function') {
        plausible(name, props ? { props } : undefined);
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

