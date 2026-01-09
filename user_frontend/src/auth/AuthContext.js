import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gatewayLogin, gatewayLogout, gatewayRefresh, gatewayRegister } from '../api/gatewayClient';

/**
 * Note on refresh tokens (Bearer-token architecture):
 * - The refresh token IS returned by the Gateway in the response body.
 * - We keep it in-memory only (React state). It is not persisted to localStorage by default.
 * - On page refresh, the user will need to log in again (acceptable for this step).
 *
 * If persistent sessions are desired later, implement secure storage and rotation strategy carefully.
 */

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state (access + refresh tokens in memory) and auth actions to the React app. */
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isHydrating, setIsHydrating] = useState(false);

  // Single-flight refresh to avoid multiple simultaneous refresh calls.
  const refreshPromiseRef = useRef(null);

  const setTokens = useCallback(({ access, refresh }) => {
    setAccessToken(access || null);
    setRefreshToken(refresh || null);
  }, []);

  const ensureAccessToken = useCallback(async () => {
    if (accessToken) return accessToken;

    // If we do not have a refresh token, we cannot hydrate.
    if (!refreshToken) return null;

    if (!refreshPromiseRef.current) {
      setIsHydrating(true);
      refreshPromiseRef.current = (async () => {
        try {
          const data = await gatewayRefresh({ refreshToken });
          const newAccess = data?.accessToken || data?.token || null;
          const newRefresh = data?.refreshToken || refreshToken || null; // rotation supported
          setTokens({ access: newAccess, refresh: newRefresh });
          return newAccess;
        } catch (e) {
          setTokens({ access: null, refresh: null });
          return null;
        } finally {
          setIsHydrating(false);
          refreshPromiseRef.current = null;
        }
      })();
    }

    return refreshPromiseRef.current;
  }, [accessToken, refreshToken, setTokens]);

  const login = useCallback(
    async ({ email, password }) => {
      const data = await gatewayLogin({ email, password });

      const newAccess = data?.accessToken || data?.token || null;
      const newRefresh = data?.refreshToken || null;

      if (!newAccess || !newRefresh) {
        // Explicit error so UI can show a clear state if backend response is unexpected.
        const err = new Error('Login succeeded but tokens were not returned.');
        err.status = 500;
        throw err;
      }

      setTokens({ access: newAccess, refresh: newRefresh });
      return data;
    },
    [setTokens]
  );

  const register = useCallback(
    async ({ email, password }) => {
      const data = await gatewayRegister({ email, password });

      // Gateway returns tokens on register in this architecture.
      const newAccess = data?.accessToken || data?.token || null;
      const newRefresh = data?.refreshToken || null;

      if (newAccess && newRefresh) {
        setTokens({ access: newAccess, refresh: newRefresh });
      }

      return data;
    },
    [setTokens]
  );

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await gatewayLogout({ refreshToken });
      }
    } finally {
      setTokens({ access: null, refresh: null });
    }
  }, [refreshToken, setTokens]);

  const logoutAndRedirect = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      isHydrating,
      setAccessToken: (t) => setTokens({ access: t, refresh: refreshToken }),
      ensureAccessToken,
      login,
      register,
      logout,
      logoutAndRedirect,
    }),
    [accessToken, ensureAccessToken, isHydrating, login, logout, logoutAndRedirect, refreshToken, register, refreshToken, setTokens]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access the Auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
