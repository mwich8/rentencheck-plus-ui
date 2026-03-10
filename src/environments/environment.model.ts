/**
 * Typed environment configuration interface.
 * Applied to both dev and prod environment exports.
 */
export interface Environment {
  production: boolean;
  appName: string;
  version: string;
  siteUrl: string;
  stripe: {
    publishableKey: string;
  };
  analytics: {
    plausibleDomain: string;
  };
  affiliate: {
    brokerUrl: string;
    brokerName: string;
  };
}

