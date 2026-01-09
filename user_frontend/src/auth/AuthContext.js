import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gatewayLogin, gatewayLogout, gatewayRefresh, gatewayRegister } from '../api/gatewayClient';

/**
 * Note on refresh tokens:
 * - The refresh token is NOT stored in React/JS. It is assumed to be held server-side
 *   in a secure manner (e.g., HTTP-only cookie).
 * - The frontend calls POST /auth/refresh to obtain a new access token when needed.
 */

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state (access token in memory) and auth actions to the React app. */
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Single-flight refresh to avoid multiple simultaneous refresh calls.
  const refreshPromiseRef = useRef(null);

  const setToken = useCallback((token) => {
    setAccessToken(token || null);
  }, []);

  const ensureAccessToken = useCallback(async () => {
    // If we already have a token, nothing to do.
    if (accessToken) {
      setIsHydrating(false);
      return accessToken;
    }

    // Attempt a refresh once during hydration / navigation into protected screens.
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        try {
          const data = await gatewayRefresh();
          const token = data?.accessToken || data?.token || null;
          setToken(token);
          return token;
        } catch (e) {
          setToken(null);
          return null;
        } finally {
          setIsHydrating(false);
          refreshPromiseRef.current = null;
        }
      })();
    }

    return refreshPromiseRef.current;
  }, [accessToken, setToken]);

  const login = useCallback(async ({ email, password }) => {
    const data = await gatewayLogin({ email, password });
    const token = data?.accessToken || data?.token;
    if (!token) {
      // Explicit error so UI can show a clear state if backend response is unexpected.
      const err = new Error('Login succeeded but no access token was returned.');
      err.status = 500;
      throw err;
    }
    setToken(token);
    setIsHydrating(false);
    return data;
  }, [setToken]);

  const register = useCallback(async ({ email, password }) => {
    const data = await gatewayRegister({ email, password });
    const token = data?.accessToken || data?.token;
    // Some backends auto-login on register; support both behaviors.
    if (token) setToken(token);
    setIsHydrating(false);
    return data;
  }, [setToken]);

  const logout = useCallback(async () => {
    try {
      await gatewayLogout();
    } finally {
      setToken(null);
      setIsHydrating(false);
    }
  }, [setToken]);

  const logoutAndRedirect = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }, [logout, navigate]);

  const value = useMemo(() => ({
    accessToken,
    isHydrating,
    setAccessToken: setToken,
    ensureAccessToken,
    login,
    register,
    logout,
    logoutAndRedirect,
  }), [accessToken, ensureAccessToken, isHydrating, login, logout, logoutAndRedirect, register, setToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access the Auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
