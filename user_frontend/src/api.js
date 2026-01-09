/**
 * Deprecated legacy API client (session-based auth).
 *
 * This project now uses:
 * - src/api/gatewayClient.js for Gateway auth + health
 * - src/api/appServerClient.js for App Server protected endpoints (JWT)
 * - src/api/requestWithAuth.js for refresh-on-401 retry behavior
 *
 * This file is kept only to avoid breaking external imports during transition.
 * Do not use it for new code.
 */

// PUBLIC_INTERFACE
export function deprecated() {
  /** Placeholder export for legacy compatibility. */
  throw new Error('src/api.js is deprecated. Use src/api/gatewayClient.js and src/api/appServerClient.js instead.');
}
