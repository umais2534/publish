import { WebAuth } from 'auth0-js';

export const auth0Config = {
  domain: "dev-71r63f04fjc8xxz2.us.auth0.com",
  clientId: "BC7bseyZ4zMaWPEkz9o44h4foOmX7Ooz",
  redirectUri: window.location.origin + "/callback",
  audience: "https://dev-71r63f04fjc8xxz2.us.auth0.com/api/v2/",
};

export const initAuth0 = () => {
  if (typeof window !== 'undefined') {
    // Initialize Auth0
    const auth0 = new WebAuth({
      domain: auth0Config.domain,
      clientID: auth0Config.clientId,
      redirectUri: auth0Config.redirectUri,
      audience: auth0Config.audience,
      responseType: 'token id_token',
      scope: 'openid profile email'
    });
    
    // Optionally store it on window if needed elsewhere
    (window as any).auth0 = auth0;
    
    return auth0;
  }
  return null;
};