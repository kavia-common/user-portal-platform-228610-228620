import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { appHome, appMe } from '../api/appServerClient';

const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  error: '#EF4444',
};

// PUBLIC_INTERFACE
export default function HomePage() {
  /** Protected home page: calls App Server /me and /home using JWT, with refresh-on-401 handled by the request wrapper. */
  const navigate = useNavigate();
  const { accessToken, setAccessToken, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [home, setHome] = useState(null);
  const [error, setError] = useState('');

  const nameOrEmail = useMemo(() => me?.email || 'user', [me?.email]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [meData, homeData] = await Promise.all([
          appMe({ accessToken, setAccessToken }),
          appHome({ accessToken, setAccessToken }),
        ]);
        if (!mounted) return;
        setMe(meData?.user || meData);
        setHome(homeData?.home || homeData);
      } catch (err) {
        if (!mounted) return;
        if (err?.status === 401) {
          // If refresh + retry also failed, we should log out and bounce to login.
          await logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(err.message || 'Failed to load home');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [accessToken, logout, navigate, setAccessToken]);

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', paddingBottom: 26 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 950, color: theme.text }}>
          {loading ? 'Loading…' : `Welcome, ${nameOrEmail}`}
        </div>
        <div style={{ marginTop: 6, color: 'rgba(17, 24, 39, 0.65)', fontWeight: 650 }}>
          {me?.email ? `Signed in as ${me.email}` : 'Fetching your profile…'}
        </div>
      </div>

      <Card>
        {loading && (
          <div style={{ fontWeight: 800, color: 'rgba(17, 24, 39, 0.70)' }}>
            Loading your personalized content…
          </div>
        )}

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
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ fontSize: 18, fontWeight: 950, color: theme.text }}>
              {home?.title || 'Your Home'}
            </div>
            <div style={{ marginTop: 8, color: 'rgba(17, 24, 39, 0.72)', fontWeight: 650 }}>
              {home?.message || 'Welcome back!'}
            </div>

            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  border: '1px solid rgba(17, 24, 39, 0.08)',
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.09), rgba(245,158,11,0.06))',
                }}
              >
                <div style={{ fontWeight: 950, marginBottom: 6, color: theme.text }}>JWT Access Token</div>
                <div style={{ color: 'rgba(17, 24, 39, 0.72)', fontWeight: 650 }}>
                  Used for App Server calls via <code>Authorization: Bearer</code>. Stored only in memory.
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
                <div style={{ fontWeight: 950, marginBottom: 6, color: theme.text }}>Refresh on 401</div>
                <div style={{ color: 'rgba(17, 24, 39, 0.72)', fontWeight: 650 }}>
                  If a request gets a <code>401</code>, the client will call <code>/auth/refresh</code> and retry once.
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
                <div style={{ fontWeight: 950, marginBottom: 6, color: theme.text }}>Gateway Health</div>
                <div style={{ color: 'rgba(17, 24, 39, 0.72)', fontWeight: 650 }}>
                  Header badge pings <code>GET /health</code> on the Gateway every 15 seconds.
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
