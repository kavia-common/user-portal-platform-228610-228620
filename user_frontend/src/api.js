/**
 * Minimal API client for session-based auth.
 * Uses fetch with credentials: 'include' so the browser sends/receives HTTP-only cookies.
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = (data && data.message) ? data.message : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// PUBLIC_INTERFACE
export async function register({ email, password, displayName }) {
  /** Register a user and start a session. */
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  });
}

// PUBLIC_INTERFACE
export async function login({ email, password }) {
  /** Login and start a session. */
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// PUBLIC_INTERFACE
export async function logout() {
  /** Logout and destroy the current session. */
  return request('/auth/logout', { method: 'POST' });
}

// PUBLIC_INTERFACE
export async function me() {
  /** Fetch current user from session. */
  return request('/me', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function home() {
  /** Fetch personalized homepage data from session. */
  return request('/home', { method: 'GET' });
}
