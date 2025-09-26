// src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error, user } = useAuth0();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Completing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
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

        if (isAuthenticated && user) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Store basic user info immediately
          const userInfo = {
            id: user.sub || '',
            email: user.email || '',
            name: user.name || user.email || '',
            auth0Id: user.sub
          };
          
          localStorage.setItem('auth0_user', JSON.stringify(userInfo));
          localStorage.setItem('auth_token', `auth0_${user.sub}`);
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
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

    handleCallback();
  }, [isLoading, isAuthenticated, error, user, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Authenticating...</h2>
            <p className="text-gray-600">{message}</p>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Authentication Failed</h2>
            <p className="text-gray-600">{message}</p>
            {error && (
              <p className="text-sm text-red-500 mt-2">
                Error: {error.message}
              </p>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-4">
        {renderContent()}
        {status === 'loading' && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}