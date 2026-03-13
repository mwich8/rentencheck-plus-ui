import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  appName: 'RentenCheck+',
  version: '1.0.0',
  siteUrl: 'https://rentencheck-plus.netlify.app',
  stripe: {
    publishableKey: '', // Add Stripe production key here
  },
  analytics: {
    umamiUrl: 'https://cloud.umami.is', // Umami Cloud (free tier)
    umamiWebsiteId: 'e37dc246-7258-45f9-9b9f-f5e7ca509e91',
  },
  affiliate: {
    brokerUrl: 'https://refnocode.trade.re/xmgb600n',
    brokerName: 'Online-Broker',
  },
};
