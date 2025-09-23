// components/Auth0LoginButton.jsx
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const Auth0LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin
      }
    });
  };

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      className="w-full flex items-center justify-center gap-2"
    >
      <LogIn className="w-4 h-4" />
      Login with Auth0
    </Button>
  );
};

export default Auth0LoginButton;