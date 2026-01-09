import { gatewayRefresh } from './gatewayClient';

/**
 * A small fetch wrapper that:
 * - attaches Authorization: Bearer <accessToken> when available
 * - on 401, calls Gateway /auth/refresh once to get a new access token, then retries once
 *
 * Refresh token strategy:
 * - frontend stores refreshToken in-memory and provides it to this function
 * - refresh endpoint returns rotated refreshToken; we update it if provided
 */

function normalizeError(res, data) {
  const message =
    data && (data.message || data.error) ? data.message || data.error : `Request failed (${res.status})`;
  const err = new Error(message);
  err.status = res.status;
  err.data = data;
  return err;
}

// Module-level single-flight refresh promise.
// This prevents "refresh stampede" if multiple requests 401 at once.
let inFlightRefreshPromise = null;

async function refreshAccessTokenSingleFlight({ refreshToken }) {
  if (!inFlightRefreshPromise) {
    inFlightRefreshPromise = (async () => {
      try {
        const refreshData = await gatewayRefresh({ refreshToken });
        return {
          accessToken: refreshData?.accessToken || refreshData?.token || null,
          refreshToken: refreshData?.refreshToken || refreshToken || null,
        };
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
  refreshToken,
  setRefreshToken,
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
      // Bearer-token architecture: do not rely on cookies/credentials.
      credentials: 'omit',
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

    if (!refreshToken) {
      const authErr = new Error('Session expired. Please sign in again.');
      authErr.status = 401;
      authErr.authFailed = true;
      if (typeof onAuthFailure === 'function') onAuthFailure(authErr);
      throw authErr;
    }

    // Refresh and retry once (single-flight across concurrent calls).
    let refreshed = null;
    try {
      refreshed = await refreshAccessTokenSingleFlight({ refreshToken });
    } catch (refreshErr) {
      const authErr = new Error('Session expired. Please sign in again.');
      authErr.status = 401;
      authErr.cause = refreshErr;
      authErr.authFailed = true;
      if (typeof onAuthFailure === 'function') onAuthFailure(authErr);
      throw authErr;
    }

    const newAccessToken = refreshed?.accessToken || null;
    const newRefreshToken = refreshed?.refreshToken || refreshToken || null;

    if (newRefreshToken && typeof setRefreshToken === 'function') {
      setRefreshToken(newRefreshToken);
    }
    if (newAccessToken && typeof setAccessToken === 'function') {
      setAccessToken(newAccessToken);
    }

    if (!newAccessToken) {
      const authErr = new Error('Session expired. Please sign in again.');
      authErr.status = 401;
      authErr.authFailed = true;
      if (typeof onAuthFailure === 'function') onAuthFailure(authErr);
      throw authErr;
    }

    try {
      return await doFetch(newAccessToken);
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
