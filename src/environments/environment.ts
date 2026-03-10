import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  appName: 'RentenCheck+',
  version: '1.0.0',
  siteUrl: 'https://rentencheck-plus.netlify.app',
  stripe: {
    publishableKey: '', // Add Stripe test key here
  },
  analytics: {
    plausibleDomain: '', // Leave empty to disable in dev
  },
  affiliate: {
    brokerUrl: 'https://refnocode.trade.re/xmgb600n',
    brokerName: 'Online-Broker',
  },
};
