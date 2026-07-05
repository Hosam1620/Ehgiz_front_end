// Production environment — the deployed API origin and the LIVE Stripe
// publishable key belong here. Local development values live in
// environment.development.ts (swapped in by angular.json fileReplacements),
// so this file only ever needs to change when the deployment targets change.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:5257', // deployed API origin, e.g. https://api.ehgiz.com
  stripePublishableKey: 'pk_test_51TggY5DeeiVGEI2yVGALQRYcbkqsVdpsDmdla02teEYwTQpIJv3JkManOU3O1fzHQeiQIlOOQYEjTQkkdTIMLXcc00713WxKcy', // live pk_live_… key
};
