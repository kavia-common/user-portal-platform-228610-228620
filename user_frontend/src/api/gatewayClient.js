/**
 * Gateway API client.
 * Base URL is configured via REACT_APP_GATEWAY_BASE_URL.
 *
 * Endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - POST /auth/refresh
 * - POST /auth/logout
 * - GET  /health
 */

/**
 * Environment variable normalization:
 * - Container env list defines REACT_APP_API_BASE for the API Gateway.
 * - Keep backwards compatibility with older REACT_APP_GATEWAY_BASE_URL if present.
 */
const GATEWAY_BASE_URL = process.env.REACT_APP_API_BASE || process.env.REACT_APP_GATEWAY_BASE_URL;

function requireEnv(name, value) {
  if (!value) {
    // Fail fast in development so misconfiguration is obvious.
    // In CI/build, this still compiles; runtime will throw when called.
    throw new Error(`${name} is not set. Please configure it in your environment.`);
  }
}

async function request(path, options = {}) {
  requireEnv('REACT_APP_API_BASE (or legacy REACT_APP_GATEWAY_BASE_URL)', GATEWAY_BASE_URL);

  const res = await fetch(`${GATEWAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    // Needed for cookie-based refresh token strategies.
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = (data && (data.message || data.error)) ? (data.message || data.error) : `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// PUBLIC_INTERFACE
export async function gatewayRegister({ email, password }) {
  /** Register a user via the Gateway. */
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// PUBLIC_INTERFACE
export async function gatewayLogin({ email, password }) {
  /** Login via the Gateway. Returns access token in response body. */
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// PUBLIC_INTERFACE
export async function gatewayRefresh() {
  /** Obtain a new access token using a server-side refresh token strategy. */
  return request('/auth/refresh', { method: 'POST' });
}

// PUBLIC_INTERFACE
export async function gatewayLogout() {
  /** Logout via the Gateway. Also invalidates refresh token server-side if applicable. */
  return request('/auth/logout', { method: 'POST' });
}

// PUBLIC_INTERFACE
export async function gatewayHealth() {
  /** Check Gateway health. */
  requireEnv('REACT_APP_GATEWAY_BASE_URL', GATEWAY_BASE_URL);
  const res = await fetch(`${GATEWAY_BASE_URL}/health`, { method: 'GET' });
  if (!res.ok) {
    const err = new Error(`Gateway health check failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return true;
}
