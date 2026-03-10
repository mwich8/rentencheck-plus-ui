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
    plausibleDomain: 'rentencheck-plus.netlify.app',
  },
  affiliate: {
    brokerUrl: 'https://refnocode.trade.re/xmgb600n',
    brokerName: 'Online-Broker',
  },
};
