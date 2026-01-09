import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Card, CenteredAuthLayout, Field, LinkButton, PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase());
}

// PUBLIC_INTERFACE
export default function LoginPage() {
  /** Login page: calls Gateway /auth/login and stores access token in memory. */
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = useMemo(() => {
    const from = location.state?.from;
    return typeof from === 'string' ? from : '/home';
  }, [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  function validate() {
    const errs = { email: '', password: '' };
    if (!isValidEmail(email)) errs.email = 'Please enter a valid email.';
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters.';
    setFieldErrors(errs);
    return !errs.email && !errs.password;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CenteredAuthLayout
      title="Sign in"
      subtitle="Sign in to access your personalized home page."
    >
      <Card>
        <form onSubmit={onSubmit}>
          <Field
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            error={fieldErrors.email}
          />

          <Field
            label="Password"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            error={fieldErrors.password}
          />

          {formError && <Alert>{formError}</Alert>}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </PrimaryButton>

          <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(17, 24, 39, 0.70)' }}>
            New here?{' '}
            <LinkButton type="button" onClick={() => navigate('/register')}>
              Create an account
            </LinkButton>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(17, 24, 39, 0.55)' }}>
            Access token is stored only in memory. Refresh happens via <code>/auth/refresh</code>.
          </div>
        </form>
      </Card>
    </CenteredAuthLayout>
  );
}
