const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const fetchWithToken = async (endpoint: string, token: string | null, options: RequestInit = {}) => {
  if (!token) throw new Error('No token provided');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API Request Failed');
  }

  return response.json();
};
