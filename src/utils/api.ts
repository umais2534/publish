// utils/api.ts
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token && token !== 'null') {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No JWT token found for authenticated request');
    throw new Error('Authentication required');
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth0_user');
    window.dispatchEvent(new Event('storage'));
    throw new Error('Authentication expired');
  }
  
  return response;
};

// Use this instead of regular fetch for all authenticated API calls