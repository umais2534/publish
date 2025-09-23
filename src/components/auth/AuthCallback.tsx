// components/Auth0Callback.tsx - UPDATED
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

const Auth0Callback = () => {
  const { loginWithAuth0 } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuth0Callback = async () => {
      try {
        console.log('🔄 Auth0 callback processing started...');
        
        // Method 1: Check URL hash (standard Auth0 flow)
        const hashParams = new URLSearchParams(window.location.hash.substr(1));
        const accessToken = hashParams.get('access_token');
        
        // Method 2: Check query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromQuery = urlParams.get('token');
        
        let tokenToUse = accessToken || tokenFromQuery;
        
        console.log('🔍 Token search results:', {
          accessToken: !!accessToken,
          tokenFromQuery: !!tokenFromQuery,
          tokenToUse: !!tokenToUse
        });

        if (!tokenToUse) {
          throw new Error('No authentication token found in URL');
        }

        console.log('✅ Token found, attempting login...');
        
        // Use your AuthContext function
        await loginWithAuth0(tokenToUse);
        
        console.log('✅ Login successful, redirecting...');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('❌ Auth0 callback error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        
        // Redirect to login after delay
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              error: 'Authentication failed. Please try again.'
            } 
          });
        }, 3000);
      }
    };

    handleAuth0Callback();
  }, [loginWithAuth0, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center text-red-600">
          <AlertCircle className="h-8 w-8 mb-4" />
          <h3 className="text-lg font-semibold">Authentication Error</h3>
          <p className="text-sm mt-2">{error}</p>
          <p className="text-xs mt-4">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500 mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
        <p className="text-xs text-gray-400 mt-2">Please wait</p>
      </div>
    </div>
  );
};

export default Auth0Callback;