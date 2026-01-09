import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import GatewayHealthBadge from './components/GatewayHealthBadge';

const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
};

function AppShell({ children }) {
  const { accessToken, logoutAndRedirect } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    // Keep the UI responsive: always land on /login after logout.
    await logoutAndRedirect();
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.background }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(249, 250, 251, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1060,
            margin: '0 auto',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(245,158,11,0.20))',
                border: '1px solid rgba(17, 24, 39, 0.08)',
              }}
            />
            <div>
              <div style={{ fontWeight: 900, color: theme.text, lineHeight: 1.1 }}>User Portal</div>
              <div style={{ fontSize: 12, color: 'rgba(17, 24, 39, 0.65)' }}>Gateway + App Server (JWT)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GatewayHealthBadge />
            {accessToken && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  padding: '9px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(17, 24, 39, 0.12)',
                  background: theme.surface,
                  cursor: 'pointer',
                  fontWeight: 800,
                  color: theme.text,
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: 18 }}>{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { accessToken, isHydrating, ensureAccessToken } = useAuth();
  const location = useLocation();

  // Try to obtain an access token via /auth/refresh (server-held refresh token) on initial mount.
  useEffect(() => {
    ensureAccessToken().catch(() => {});
  }, [ensureAccessToken]);

  if (isHydrating) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div
          style={{
            background: theme.surface,
            border: '1px solid rgba(17, 24, 39, 0.08)',
            borderRadius: 16,
            padding: 18,
            boxShadow: '0 10px 25px rgba(17, 24, 39, 0.06)',
            color: 'rgba(17, 24, 39, 0.70)',
            fontWeight: 800,
          }}
        >
          Checking session…
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { accessToken } = useAuth();
  if (accessToken) return <Navigate to="/home" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route
        path="/login"
        element={(
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/register"
        element={(
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/home"
        element={(
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main app entrypoint: provides Auth context and routes for /login, /register, /home (protected). */
  const router = useMemo(() => (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  ), []);

  return router;
}

export default App;
