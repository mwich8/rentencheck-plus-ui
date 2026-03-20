/**
 * Typed environment configuration interface.
 * Applied to both dev and prod environment exports.
 */
export interface Environment {
  production: boolean;
  appName: string;
  version: string;
  siteUrl: string;
  /** When true, all features are free — PDF generation skips Stripe checkout entirely */
  freeMode: boolean;
  stripe: {
    publishableKey: string;
  };
  analytics: {
    /** Umami Cloud or self-hosted base URL (e.g. https://cloud.umami.is) */
    umamiUrl: string;
    /** Website ID from the Umami dashboard */
    umamiWebsiteId: string;
  };
  affiliate: {
    brokerUrl: string;
    brokerName: string;
  };
}

