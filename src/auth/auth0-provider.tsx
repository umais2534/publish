// auth/auth0-provider.tsx
import { Auth0Provider } from "@auth0/auth0-react";
import { ReactNode } from "react";
import { auth0Config } from "@/config/auth0Config";

interface Auth0ProviderWithNavigateProps {
  children: ReactNode;
}

export const Auth0ProviderWithConfig = ({
  children,
}: Auth0ProviderWithNavigateProps) => {
  const { domain, clientId, redirectUri, audience } = auth0Config;

  if (!domain || !clientId) {
    console.error("Auth0 domain or client ID is not configured");
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience
      }}
      // Add these props for better handling
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={(appState) => {
        // Handle redirect after login
        window.location.href = appState?.returnTo || window.location.pathname;
      }}
    >
      {children}
    </Auth0Provider>
  );
};