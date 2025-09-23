// services/auth.ts - UPDATED
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
}

export const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/register`, { email, password, name });
  localStorage.setItem('auth_token', response.data.token); // CONSISTENT KEY
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/login`, { email, password });
  localStorage.setItem('auth_token', response.data.token); // CONSISTENT KEY
  localStorage.setItem('user', JSON.stringify(response.data.user));
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('auth_token'); // CONSISTENT KEY
  localStorage.removeItem('user');
};

export const getCurrentUser = async (): Promise<any> => {
  const token = localStorage.getItem('auth_token'); // CONSISTENT KEY
  if (!token) return null;

  try {
    const response = await axios.post(`${API_URL}/me`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    logout();
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token'); // CONSISTENT KEY
};