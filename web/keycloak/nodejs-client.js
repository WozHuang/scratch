// const KcAdminClient = require('@keycloak/keycloak-admin-client');
// import KcAdminClient from '@keycloak/keycloak-admin-client';

const realmName = 'master';
const username = 'admin';
const password = '123';
// const realmName = 'test';
// const username = 'user1';
// const password = '123';

(async function main() {
  const { default: KcAdminClient } = await import('@keycloak/keycloak-admin-client');

// To configure the client, pass an object to override any of these  options:
// {
//   baseUrl: 'http://127.0.0.1:8080',
//   realmName: 'master',
//   requestOptions: {
//     /* Fetch request options https://developer.mozilla.org/en-US/docs/Web/API/fetch#options */
//   },
// }
  const kcAdminClient = new KcAdminClient({
    baseUrl: 'http://172.16.10.54:8081',
    realmName,
    requestOptions: {},
  });
  await kcAdminClient.auth({
    username,
    password,
    grantType: 'password',
    clientId: 'admin-cli',
    // totp: '123456' // optional Time-based One-time Password if OTP is required in authentication flow
  });

  const users = await kcAdminClient.users.find({ first: 0, max: 10 });

  console.log('users', users);
})().catch(err => {
  console.error(err);
});
