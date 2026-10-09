const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('ll_token') || localStorage.getItem('token')) : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only add Content-Type: application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  get: (endpoint: string) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => 
    apiFetch(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  put: (endpoint: string, body?: any) =>
    apiFetch(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  patch: (endpoint: string, body?: any) =>
    apiFetch(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),
  delete: (endpoint: string) => apiFetch(endpoint, { method: 'DELETE' })
};
