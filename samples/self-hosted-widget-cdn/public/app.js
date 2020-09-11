'use strict';
/* global OktaAuth, OktaSignIn */

var authClient;
var issuer;
var clientId;
var redirectUri = window.location.origin + '/login/callback'; // Should also be set in Okta Admin UI

// Read all config from the URL
var url = new URL(window.location.href);
var state = url.searchParams.get('state');
var error = url.searchParams.get('error');
if (state) {
  state = JSON.parse(state);
  issuer = state.issuer;
  clientId = state.clientId;
} else {
  issuer = url.searchParams.get('issuer');
  clientId = url.searchParams.get('clientId');
}
var appUrl = window.location.origin + '/' +
  '?issuer=' + encodeURIComponent(issuer) +
  '&clientId=' + encodeURIComponent(clientId);

// bind methods called from HTML
window.logout = logout;

main();

function main() {

  var hasValidConfig = (issuer && clientId);
  if (!hasValidConfig) {
    document.getElementById('form').style.display = 'block'; // show form
    return;
  }

  try {
    authClient = new OktaAuth({
      issuer: issuer,
      clientId: clientId,
      redirectUri: redirectUri,
      tokenManager: {
        storage: 'memory'
      }
    });
  } catch (error) {
    return showError(error);
  }

  // The "error" param is set by the Okta backend when redirecting back from `getWithRedirect`
  if (error === 'login_required') {
    return showLogin();
  }

  // The last step of the auth flow is to exchange code for tokens
  if (authClient.token.isLoginRedirect()) {
    return handleLoginRedirect();
  }

  // Normal app startup
  showUserInfo();
}

function onLoggedIn(res) {
  // Store tokens (in memory)
  authClient.tokenManager.add('idToken', res.tokens.idToken);
  authClient.tokenManager.add('accessToken', res.tokens.accessToken);

  // Hide login UI
  document.getElementById('unauth').style.display = 'none';

  // Normal app startup
  showUserInfo();
}

function handleLoginRedirect() {
  // The URL contains a code, `parseFromUrl` will exchange the code for tokens
  authClient.token.parseFromUrl().then(function (res) {
    history.replaceState(null, '', appUrl); // parseFromUrl clears location.search
    onLoggedIn(res); // save tokens
  });
}

function showError(error) {
  console.error(error);
  var node = document.createElement('DIV');
  node.innerText = JSON.stringify(error, null, 2);
  document.getElementById('error').appendChild(node);
}

function showUserInfo() {
  // Try to read tokens before making the call
  return Promise.all([
      authClient.tokenManager.get('idToken'),
      authClient.tokenManager.get('accessToken')
    ])
    .then(function (values) {
      var idToken = values[0];
      var accessToken = values[1];

      // If a token is missing, do a redirect to Okta to get them
      if (!idToken || !accessToken) {
        return redirectToGetTokens();
      }

      // With tokens in place, make a call to get user info
      authClient.token.getUserInfo().then(function (userInfo) {
        document.getElementById('auth').style.display = 'block';
        document.getElementById('userinfo').innerText = JSON.stringify(userInfo, null, 2);
      }).catch(function (error) {
        showError(error);
        showLogin();
      });
    });
}

function showLogin() {
  // Create an instance of the signin widget
  var signIn = new OktaSignIn({
    baseUrl: issuer.split('oauth2')[0],
    clientId,
    redirectUri,
    authParams: {
      issuer,
      state: JSON.stringify({
        issuer: issuer,
        clientId: clientId
      }),
    }
  });

  signIn.renderEl({
      el: '#signin-widget'
    },
    function success(res) {
      console.log('login success', res);

      if (res.status === 'SUCCESS') {
        history.replaceState(null, '', appUrl); // remove error from location.search
        onLoggedIn(res);
      }
    },
    function error(err) {
      console.log('login error', err);
    }
  );

  document.getElementById('unauth').style.display = 'block'; // show login UI
}

function redirectToGetTokens() {
  // If an Okta SSO exists, the redirect will return a code which can be exchanged for tokens
  // If a session does note exist, it will return with "error=login_required"
  authClient.token.getWithRedirect({
    state: JSON.stringify({
      issuer: issuer,
      clientId: clientId
    }),
    prompt: 'none' // do not show Okta hosted login page, instead redirect back with error
  });
}

function logout(e) {
  e.preventDefault();
  authClient.signOut();
}
