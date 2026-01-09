import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { home, login, logout, me, register } from './api';

const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
};

function Card({ children }) {
  return (
    <div
      style={{
        background: theme.surface,
        borderRadius: 16,
        boxShadow: '0 10px 25px rgba(17, 24, 39, 0.08)',
        border: '1px solid rgba(17, 24, 39, 0.06)',
        padding: 24,
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 6 }}>{label}</div>
      <input
        {...props}
        style={{
          width: '100%',
          padding: '12px 12px',
          borderRadius: 12,
          border: '1px solid rgba(17, 24, 39, 0.12)',
          outline: 'none',
        }}
      />
    </label>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 12,
        border: 'none',
        background: theme.primary,
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'transform 120ms ease, filter 120ms ease',
      }}
      onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.99)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

function LinkButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        border: 'none',
        background: 'transparent',
        color: theme.primary,
        fontWeight: 700,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to home
  useEffect(() => {
    let mounted = true;
    me()
      .then(() => {
        if (mounted) navigate('/home', { replace: true });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'register') {
        await register({ email, password, displayName });
      } else {
        await login({ email, password });
      }
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, rgba(37,99,235,0.10) 0%, ${theme.background} 55%)`,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: theme.text }}>User Portal</div>
          <div style={{ color: 'rgba(17, 24, 39, 0.70)', marginTop: 6 }}>
            {mode === 'register' ? 'Create your account to continue.' : 'Sign in to access your home page.'}
          </div>
        </div>

        <Card>
          <form onSubmit={onSubmit}>
            <Field
              label="Email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {mode === 'register' && (
              <Field
                label="Display name"
                type="text"
                value={displayName}
                autoComplete="nickname"
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            )}

            <Field
              label="Password"
              type="password"
              value={password}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />

            {error && (
              <div
                role="alert"
                style={{
                  background: 'rgba(239, 68, 68, 0.10)',
                  color: '#991b1b',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? 'Please wait…' : (mode === 'register' ? 'Create account' : 'Sign in')}
            </PrimaryButton>

            <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(17, 24, 39, 0.70)' }}>
              {mode === 'register' ? 'Already have an account?' : 'New here?'}{' '}
              <LinkButton
                type="button"
                onClick={() => {
                  setError('');
                  setMode(mode === 'register' ? 'login' : 'register');
                }}
              >
                {mode === 'register' ? 'Sign in' : 'Create an account'}
              </LinkButton>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(17, 24, 39, 0.55)' }}>
              Uses secure HTTP-only cookies (session) — no tokens stored in localStorage.
            </div>
          </form>
        </Card>

        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(17, 24, 39, 0.55)' }}>
          Backend docs: <a href="http://localhost:3001/docs" target="_blank" rel="noreferrer">Swagger UI</a>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  const user = payload?.user;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    home()
      .then((data) => {
        if (mounted) setPayload(data);
      })
      .catch((err) => {
        if (!mounted) return;
        if (err.status === 401) {
          navigate('/auth', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load home');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [navigate]);

  async function onLogout() {
    try {
      await logout();
    } finally {
      navigate('/auth', { replace: true });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.background, padding: 24 }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>
              {user ? `Welcome, ${user.displayName}` : 'Home'}
            </div>
            <div style={{ color: 'rgba(17, 24, 39, 0.65)', marginTop: 6 }}>
              {user ? `Signed in as ${user.email}` : 'Loading user…'}
            </div>
          </div>

          <button
            onClick={onLogout}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(17, 24, 39, 0.12)',
              background: theme.surface,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>

        <Card>
          {loading && <div style={{ fontWeight: 700, color: 'rgba(17, 24, 39, 0.70)' }}>Loading…</div>}
          {!loading && error && (
            <div
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, 0.10)',
                color: '#991b1b',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          {!loading && !error && payload && (
            <>
              <div style={{ fontSize: 18, fontWeight: 900, color: theme.text }}>
                {payload.home?.title || 'Your Home'}
              </div>
              <div style={{ marginTop: 8, color: 'rgba(17, 24, 39, 0.70)' }}>
                {payload.home?.message || 'Welcome!'}
              </div>

              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(245,158,11,0.06))',
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6, color: theme.text }}>Session-based Auth</div>
                  <div style={{ color: 'rgba(17, 24, 39, 0.70)' }}>
                    Your login state is stored server-side; the browser holds only an HTTP-only cookie.
                  </div>
                </div>

                <div
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                    background: theme.surface,
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6, color: theme.text }}>API</div>
                  <div style={{ color: 'rgba(17, 24, 39, 0.70)' }}>
                    Data from <code>/home</code> and <code>/me</code> is protected by session middleware.
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Main app component with routes for auth and home. */
  const router = useMemo(() => (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  ), []);

  return router;
}

export default App;
