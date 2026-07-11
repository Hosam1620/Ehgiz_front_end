// Local dev config. ng serve and dev builds pick this file up via the
// fileReplacements entry in angular.json.
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7103', // localhost  API
  // apiUrl: 'https://ehgez.runasp.net', // deployed API
  stripePublishableKey:
    'pk_test_51TggY5DeeiVGEI2yVGALQRYcbkqsVdpsDmdla02teEYwTQpIJv3JkManOU3O1fzHQeiQIlOOQYEjTQkkdTIMLXcc00713WxKcy',
};
