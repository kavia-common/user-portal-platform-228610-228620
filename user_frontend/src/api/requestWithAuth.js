import { gatewayRefresh } from './gatewayClient';

/**
 * A small fetch wrapper that:
 * - attaches Authorization: Bearer <accessToken> when available
 * - on 401, calls Gateway /auth/refresh once to get a new access token, then retries once
 *
 * The refresh request assumes a secure server-side refresh token (e.g., HTTP-only cookie).
 */

function normalizeError(res, data) {
  const message = (data && (data.message || data.error)) ? (data.message || data.error) : `Request failed (${res.status})`;
  const err = new Error(message);
  err.status = res.status;
  err.data = data;
  return err;
}

// Module-level single-flight refresh promise.
// This prevents "refresh stampede" if multiple requests 401 at once.
let inFlightRefreshPromise = null;

async function refreshAccessTokenSingleFlight() {
  if (!inFlightRefreshPromise) {
    inFlightRefreshPromise = (async () => {
      try {
        const refreshData = await gatewayRefresh();
        const newToken = refreshData?.accessToken || refreshData?.token || null;
        return newToken;
      } finally {
        // Always clear so future refresh attempts can proceed.
        inFlightRefreshPromise = null;
      }
    })();
  }
  return inFlightRefreshPromise;
}

// PUBLIC_INTERFACE
export async function requestWithAuth({
  baseUrl,
  path,
  method = 'GET',
  body,
  headers,
  accessToken,
  setAccessToken,
  retryOn401 = true,
  onAuthFailure,
}) {
  /** Perform an HTTP request with optional JWT attachment and refresh-on-401 retry. */
  const url = `${baseUrl}${path}`;

  async function doFetch(token) {
    const res = await fetch(url, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // Include cookies so refresh endpoints (often cookie-based) work cross-origin when configured.
      credentials: 'include',
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : null;

    if (!res.ok) {
      throw normalizeError(res, data);
    }
    return data;
  }

  try {
    return await doFetch(accessToken);
  } catch (err) {
    if (err?.status !== 401 || !retryOn401) throw err;

    // Refresh and retry once (single-flight across concurrent calls).
    let newToken = null;
    try {
      newToken = await refreshAccessTokenSingleFlight();
    } catch (refreshErr) {
      // If refresh itself fails, treat as unauthenticated.
      const authErr = new Error('Session expired. Please sign in again.');
      authErr.status = 401;
      authErr.cause = refreshErr;
      authErr.authFailed = true;
      if (typeof onAuthFailure === 'function') onAuthFailure(authErr);
      throw authErr;
    }

    if (newToken && typeof setAccessToken === 'function') {
      setAccessToken(newToken);
    }

    if (!newToken) {
      // No token obtained; treat as not authenticated.
      const authErr = new Error('Session expired. Please sign in again.');
      authErr.status = 401;
      authErr.authFailed = true;
      if (typeof onAuthFailure === 'function') onAuthFailure(authErr);
      throw authErr;
    }

    try {
      return await doFetch(newToken);
    } catch (retryErr) {
      if (retryErr?.status === 401) {
        const authErr = new Error('Session expired. Please sign in again.');
        authErr.status = 401;
        authErr.authFailed = true;
        authErr.cause = retryErr;
        if (typeof onAuthFailure === 'function') onAuthFailure(authErr);
        throw authErr;
      }
      throw retryErr;
    }
  }
}
