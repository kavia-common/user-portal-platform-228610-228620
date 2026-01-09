import React from 'react';

const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  error: '#EF4444',
};

// PUBLIC_INTERFACE
export function Card({ children }) {
  /** Surface card with subtle shadow and rounded corners. */
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

// PUBLIC_INTERFACE
export function Field({ label, error, ...props }) {
  /** Labeled input field with optional inline error message. */
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, marginBottom: 6 }}>{label}</div>
      <input
        {...props}
        style={{
          width: '100%',
          padding: '12px 12px',
          borderRadius: 12,
          border: `1px solid ${error ? 'rgba(239, 68, 68, 0.35)' : 'rgba(17, 24, 39, 0.12)'}`,
          outline: 'none',
          boxShadow: error ? '0 0 0 4px rgba(239, 68, 68, 0.10)' : 'none',
        }}
      />
      {error && (
        <div style={{ marginTop: 6, color: theme.error, fontSize: 12, fontWeight: 700 }}>
          {error}
        </div>
      )}
    </label>
  );
}

// PUBLIC_INTERFACE
export function PrimaryButton({ children, disabled, ...props }) {
  /** Primary CTA button. */
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '12px 14px',
        borderRadius: 12,
        border: 'none',
        background: theme.primary,
        color: 'white',
        fontWeight: 900,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'transform 120ms ease, filter 120ms ease',
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(0.99)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {children}
    </button>
  );
}

// PUBLIC_INTERFACE
export function LinkButton({ children, ...props }) {
  /** Text-link styled button. */
  return (
    <button
      {...props}
      style={{
        border: 'none',
        background: 'transparent',
        color: theme.primary,
        fontWeight: 900,
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

// PUBLIC_INTERFACE
export function Alert({ children }) {
  /** Inline alert box for errors. */
  return (
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
      {children}
    </div>
  );
}

// PUBLIC_INTERFACE
export function CenteredAuthLayout({ title, subtitle, children }) {
  /** Centered auth layout with subtle gradient background. */
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        background: `linear-gradient(135deg, rgba(37,99,235,0.10) 0%, ${theme.background} 55%)`,
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 950, color: theme.text }}>{title}</div>
          <div style={{ color: 'rgba(17, 24, 39, 0.70)', marginTop: 6 }}>{subtitle}</div>
        </div>
        {children}
      </div>
    </div>
  );
}
