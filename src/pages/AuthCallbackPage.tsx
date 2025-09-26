import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Auth0UserData {
  sub: string;
  email: string;
  name: string;
  email_verified?: boolean;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error, user: auth0User, getAccessTokenSilently } = useAuth0();
  const { loginWithAuth0, user: appUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Completing authentication...');

// AuthCallbackPage.tsx - Improved sync logic
useEffect(() => {
  const handleAuth0Callback = async () => {
    try {
      console.log("🔄 Auth0 Callback - Status:", {
        isLoading,
        isAuthenticated,
        error,
        auth0User: !!auth0User,
        appUser: !!appUser
      });

      if (isLoading) {
        setStatus('loading');
        setMessage('Completing authentication...');
        return;
      }

      if (error) {
        console.error('Auth0 callback error:', error);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      // If we have Auth0 user but no app user, sync with backend
      if (isAuthenticated && auth0User && !appUser) {
        setStatus('loading');
        setMessage('Syncing with database...');
        
        try {
          console.log("📡 Starting database sync...", auth0User);
          
          // Get Auth0 token
          const auth0Token = await getAccessTokenSilently();
          console.log("✅ Auth0 token received");
          
          // Prepare user data for sync
          const userData = {
            sub: auth0User.sub || '',
            email: auth0User.email || '',
            name: auth0User.name || auth0User.email || 'User',
            email_verified: auth0User.email_verified
          };

          // Validate required fields
          if (!userData.sub || !userData.email) {
            throw new Error('Invalid user data from Auth0');
          }

          console.log("🔄 Calling loginWithAuth0...", userData);
          
          // Sync with backend
          await loginWithAuth0(userData, auth0Token);
          
          console.log("✅ Database sync completed successfully");
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
          
        } catch (syncError) {
          console.error('❌ Database sync error:', syncError);
          setStatus('error');
          setMessage('Failed to sync with database. Please try again.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
        }
      } 
      // If user is already synced, redirect
      else if (appUser) {
        console.log("✅ User already synced, redirecting to dashboard");
        setStatus('success');
        setMessage('Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      }
      else {
        console.log("❌ Authentication incomplete");
        setStatus('error');
        setMessage('Authentication incomplete. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    } catch (err) {
      console.error('Callback handling error:', err);
      setStatus('error');
      setMessage('An unexpected error occurred.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  };

  handleAuth0Callback();
}, [isLoading, isAuthenticated, error, auth0User, appUser, navigate, loginWithAuth0, getAccessTokenSilently]);

  // Render different states
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Processing...</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Error</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full p-6">
        {renderContent()}
      </div>
    </div>
  );
}