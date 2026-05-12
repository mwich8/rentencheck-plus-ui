import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  appName: 'RentenCheck+',
  version: '1.0.0',
  siteUrl: 'https://rentencheckplus.de',
  freeMode: false,
  stripe: {
    publishableKey: 'pk_test_51Sb6nULdAOGyN2patPOjmmg1eJShqdCqqpVqDOaKcEYevRsc9xxOfmN71nb9dZ3UgMsy8G6azuTWzcbDLnJIsWo0005oerdoCV',
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
