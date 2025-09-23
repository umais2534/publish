// hooks/useAuth.ts
import { useState, useEffect, useContext } from 'react';
import { useAuth0 as useAuth0SDK } from '@auth0/auth0-react';
import { AuthContext } from '../context/AuthContext'; // Import your AuthContext

type User = {
  id: string;
  email: string;
  name: string;
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the AuthContext
  const authContext = useContext(AuthContext);

  // Auth0 hook
  const {
    isAuthenticated: isAuth0Authenticated,
    isLoading: isAuth0Loading,
    user: auth0User,
    loginWithRedirect: auth0Login,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0SDK();

  // Check auth status on initial load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Sync Auth0 state with our local state
  useEffect(() => {
    if (isAuth0Authenticated && auth0User) {
      // Convert Auth0 user to our user format
      const userData = {
        id: auth0User.sub || '',
        email: auth0User.email || '',
        name: auth0User.name || auth0User.email || '',
      };
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store in localStorage for persistence
      localStorage.setItem('auth0_user', JSON.stringify(userData));
    }
  }, [isAuth0Authenticated, auth0User]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

 // hooks/useAuth.ts
const loginWithAuth0 = async (auth0UserData: any) => {
  setIsLoading(true);
  setError(null);
  
  try {
    // Sync user with backend
    const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/users/auth0-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: auth0UserData.email,
        name: auth0UserData.name,
        auth0Id: auth0UserData.sub,
        email_verified: auth0UserData.email_verified
      }),
    });

    const userData = await response.json();
    
    if (!response.ok) {
      throw new Error(userData.error || 'Auth0 sync failed');
    }

    // Store user data
    localStorage.setItem('auth0_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', auth0UserData.accessToken); // Store Auth0 token if needed
    
    setIsAuthenticated(true);
    setUser(userData);
    
    return userData;
  } catch (err: any) {
    setError(err.message);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
  const logout = () => {
    // Check if user is logged in via Auth0
    const auth0User = localStorage.getItem('auth0_user');
    
    if (auth0User) {
      // Auth0 logout
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
      localStorage.removeItem('auth0_user');
    } else {
      // Custom authentication logout
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  // Add getToken function
  const getToken = async (): Promise<string | null> => {
    // If using Auth0, get the token from Auth0
    if (isAuth0Authenticated) {
      try {
        return await getAccessTokenSilently();
      } catch (error) {
        console.error('Failed to get Auth0 token:', error);
        return null;
      }
    }
    
    // If using custom auth, get the token from localStorage or context
    if (authContext && authContext.getToken) {
      return authContext.getToken();
    }
    
    return localStorage.getItem('auth_token');
  };

  // Combined loading state
  const combinedIsLoading = isLoading || isAuth0Loading;

  return {
    isAuthenticated: isAuthenticated || isAuth0Authenticated,
    user: user || (auth0User ? {
      id: auth0User.sub || '',
      email: auth0User.email || '',
      name: auth0User.name || auth0User.email || '',
    } : null),
    isLoading: combinedIsLoading,
    error,
    login,
    loginWithAuth0,
    logout,
    isAuth0Authenticated,
    getToken, // Add getToken to the returned object
  };
};