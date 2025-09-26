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

// Add Auth0 user interface
interface Auth0User {
  sub: string;
  email: string;
  name: string;
  email_verified?: boolean;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithAuth0: (auth0UserData: Auth0User, auth0Token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  getToken: () => string | null;
    syncAuth0UserWithBackend: (auth0UserData: any) => Promise<void>;
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
    localStorage.removeItem('auth0_user');
    localStorage.removeItem('auth0_sub');
  };

  // Check authentication status on app load
// In your AuthContext.tsx, update the checkAuthStatus function:

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
        console.log("Auth0 user found:", auth0User);
        
        // ✅ FIX: If we have Auth0 user but no token, sync with backend
        if (!token) {
          console.log("🔄 Auth0 user found but no token, starting sync...");
          await syncAuth0UserWithBackend(auth0User);
        } else {
          setUser(auth0User);
        }
        
      } catch (err) {
        console.error("Failed to parse Auth0 user data:", err);
      }
    } 
    else if (token && userDataStr) {
      // ... existing code for token verification
    } else {
      console.log("No auth data found in storage");
    }
    
    setIsLoading(false);
  };

  checkAuthStatus();
}, []);

// context/AuthContext.tsx - Fix the syncAuth0UserWithBackend function
const syncAuth0UserWithBackend = async (auth0UserData: any): Promise<void> => {
  try {
    console.log("🔄 Syncing Auth0 user with backend...", auth0UserData);
    
    // ✅ FIX: Use correct Auth0 property names
    const auth0Id = auth0UserData.sub || auth0UserData.id; // Auth0 uses 'sub'
    const email = auth0UserData.email;
    const name = auth0UserData.name || auth0UserData.email?.split('@')[0] || 'User';
    
    if (!auth0Id || !email) {
      throw new Error('Invalid Auth0 user data: missing sub or email');
    }
    
    // Call your backend to create/update the user
    const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/auth0/sync`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth0Id: auth0Id, // ✅ Use 'sub' from Auth0
        email: email,
        name: name,
        emailVerified: true
      })
    });

    const responseData = await response.json();
    console.log("📡 Backend sync response:", responseData);

    if (!response.ok) {
      throw new Error(responseData.error || 'Auth0 sync failed');
    }

    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }

    // Save token and user data
    setToken(responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));
    localStorage.setItem('auth_token', responseData.token);
    setUser(responseData.user);
    
    // Clean up temporary Auth0 storage
    localStorage.removeItem('auth0_user');
    
    console.log("✅ Auth0 user synced successfully with database");
    
  } catch (error: any) {
    console.error('❌ Auth0 sync error:', error);
    // Don't throw error here to prevent app crash
  }
};
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

// In your AuthContext.tsx - Update the loginWithAuth0 function
const loginWithAuth0 = async (auth0UserData: Auth0User, auth0Token: string): Promise<void> => {
  setIsLoading(true);
  setError('');
  try {
    console.log("🔄 Syncing Auth0 user with backend...", auth0UserData);
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/auth0/callback`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth0Token}`
      },
      body: JSON.stringify({
        auth0Id: auth0UserData.sub,
        email: auth0UserData.email,
        name: auth0UserData.name,
        emailVerified: auth0UserData.email_verified || false
      })
    });

    const responseData = await response.json();
    console.log("📡 Backend sync response:", responseData);

    if (!response.ok) {
      // Handle account linking required
      if (responseData.code === 'ACCOUNT_LINKING_REQUIRED') {
        throw new Error('This email is already registered. Please use your original login method or contact support.');
      }
      throw new Error(responseData.error || 'Auth0 sync failed');
    }

    if (!responseData.token || !responseData.user) {
      throw new Error('Invalid response from server');
    }

    // Save token and user data
    setToken(responseData.token);
    localStorage.setItem('user', JSON.stringify(responseData.user));
    localStorage.setItem('auth_token', responseData.token);
    setUser(responseData.user);
    
    console.log("✅ Auth0 login successful");
    
  } catch (error: any) {
    console.error('❌ Auth0 login error:', error);
    setError(error.message || 'Auth0 login failed');
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Add account linking function
const linkAuth0Account = async (email: string, password: string, auth0UserData: Auth0User): Promise<void> => {
  try {
    // First, verify the local account credentials
    await login(email, password);
    
    // Then link the Auth0 account
    const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/auth/link-auth0`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        auth0Id: auth0UserData.sub,
        email: auth0UserData.email
      })
    });

    if (!response.ok) {
      throw new Error('Failed to link Auth0 account');
    }

    // Update user data with Auth0 info
    const updatedUser = { ...user, auth0Id: auth0UserData.sub };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
  } catch (error: any) {
    console.error('Account linking error:', error);
    throw error;
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
    getToken,
    syncAuth0UserWithBackend
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