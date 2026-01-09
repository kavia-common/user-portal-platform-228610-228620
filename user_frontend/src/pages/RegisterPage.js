import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Card, CenteredAuthLayout, Field, LinkButton, PrimaryButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').toLowerCase());
}

// PUBLIC_INTERFACE
export default function RegisterPage() {
  /** Register page: calls Gateway /auth/register; may also set access token if backend returns it. */
  const navigate = useNavigate();
  const { register } = useAuth();

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
      await register({ email, password });
      // If the backend doesn't auto-login on register, user can log in next.
      navigate('/home', { replace: true });
    } catch (err) {
      setFormError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CenteredAuthLayout
      title="Create account"
      subtitle="Create your account to continue."
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
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            error={fieldErrors.password}
          />

          {formError && <Alert>{formError}</Alert>}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </PrimaryButton>

          <div style={{ marginTop: 12, fontSize: 14, color: 'rgba(17, 24, 39, 0.70)' }}>
            Already have an account?{' '}
            <LinkButton type="button" onClick={() => navigate('/login')}>
              Sign in
            </LinkButton>
          </div>
        </form>
      </Card>
    </CenteredAuthLayout>
  );
}
