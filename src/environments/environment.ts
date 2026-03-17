import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  appName: 'RentenCheck+',
  version: '1.0.0',
  siteUrl: 'https://rentencheckplus.de',
  stripe: {
    publishableKey: '', // Add Stripe test key here
  },
  analytics: {
    umamiUrl: '', // Leave empty to disable in dev
    umamiWebsiteId: '',
  },
  affiliate: {
    brokerUrl: 'https://refnocode.trade.re/xmgb600n',
    brokerName: 'Online-Broker',
  },
};
