// Production config. Put the deployed API origin and the live Stripe
// publishable key here before deploying. Dev values live in
// environment.development.ts (swapped in by angular.json fileReplacements).
export const environment = {
  production: true,
  apiUrl: 'https://ehgez.runasp.net', // deployed API origin, e.g. https://api.ehgiz.com
  stripePublishableKey:
    'pk_test_51TggY5DeeiVGEI2yVGALQRYcbkqsVdpsDmdla02teEYwTQpIJv3JkManOU3O1fzHQeiQIlOOQYEjTQkkdTIMLXcc00713WxKcy', // live pk_live_… key
};
