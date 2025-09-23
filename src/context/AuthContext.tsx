// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  auth0Id?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithAuth0: (auth0Token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  getToken: () => string | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Consistent token management
  const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  const setToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
  };

  const removeToken = (): void => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  // Check authentication status on app load
// context/AuthContext.tsx
useEffect(() => {
  const checkAuthStatus = async () => {
    console.log("Checking authentication status");
    
    // Check for Auth0 user first
    const auth0UserStr = localStorage.getItem('auth0_user');
    const token = localStorage.getItem('auth_token');
    const userDataStr = localStorage.getItem('user');
    
    console.log("Auth0 user from storage:", auth0UserStr);
    console.log("Token from storage:", token);
    console.log("User data from storage:", userDataStr);
    
    if (auth0UserStr) {
      try {
        const auth0User = JSON.parse(auth0UserStr);
        setUser(auth0User);
        console.log("Auth0 user found:", auth0User);
      } catch (err) {
        console.error("Failed to parse Auth0 user data:", err);
      }
    } 
    else if (token && userDataStr) {
      try {
        const parsedUser = JSON.parse(userDataStr);
        setUser(parsedUser);
        
        // Verify token with backend
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/me`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const currentUser = await response.json();
            console.log("Token verified, user:", currentUser);
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
          } else {
            console.warn("Token verification failed, logging out");
            logout();
          }
        } catch (error) {
          console.error("Token verification error:", error);
        }
      } catch (err) {
        console.error("Failed to parse user data:", err);
        logout();
      }
    } else {
      console.log("No auth data found in storage");
    }
    
    setIsLoading(false);
  };

  checkAuthStatus();
}, []);

  const register = async (email: string, password: string, name: string): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      console.log("Registering user:", { email, name });
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const responseData = await response.json();
      console.log("Registration response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Registration failed');
      }

      if (!responseData.token || !responseData.user) {
        throw new Error('Invalid response from server');
      }

      // Save token and user data
      setToken(responseData.token);
      localStorage.setItem('user', JSON.stringify(responseData.user));
      setUser(responseData.user);
      
      console.log("Registration successful, user:", responseData.user);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      console.log("Logging in user:", email);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();
      console.log("Login response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Login failed');
      }

      if (!responseData.token || !responseData.user) {
        throw new Error('Invalid response from server');
      }

      // Save token and user data
      setToken(responseData.token);
      localStorage.setItem('user', JSON.stringify(responseData.user));
      setUser(responseData.user);
      
      console.log("Login successful, user:", responseData.user);
      
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

// context/AuthContext.tsx
// Change the function to only accept auth0Token
const loginWithAuth0 = async (auth0Token: string): Promise<void> => {
  setIsLoading(true);
  setError('');
  try {
    console.log("Logging in with Auth0 token");
    
    // Extract user info from the token (you'll need to decode JWT)
    // Or get user info from Auth0's /userinfo endpoint
    const userInfoResponse = await fetch('https://your-domain.auth0.com/userinfo', {
      headers: {
        'Authorization': `Bearer ${auth0Token}`
      }
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Auth0');
    }
    
    const auth0User = await userInfoResponse.json();
    console.log("Auth0 user info:", auth0User);
    
    // Continue with your existing sync logic
    const syncResponse = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/auth0/callback`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth0Token}`
      },
      body: JSON.stringify(auth0User)
    });

    const responseData = await syncResponse.json();
    console.log("Auth0 sync response:", responseData);

    if (!syncResponse.ok) {
      throw new Error(responseData.error || 'Auth0 sync failed');
    }

    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }

    setToken(responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));
    localStorage.setItem('auth0_user', JSON.stringify(auth0User));
    setUser(responseData.user);
    
    console.log("Auth0 login successful");
    
  } catch (error: any) {
    console.error('Auth0 login error:', error);
    setError(error.message || 'Auth0 login failed');
    throw error;
  } finally {
    setIsLoading(false);
  }
};
  const logout = (): void => {
    console.log("Logging out user");
    removeToken();
    setUser(null);
    setError('');
    navigate('/login');
  };

  const value: AuthContextType = { 
    user, 
    isLoading, 
    error,
    register, 
    login, 
    loginWithAuth0,
    logout,
    isAuthenticated: !!user,
    getToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}