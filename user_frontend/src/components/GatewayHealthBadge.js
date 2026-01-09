import React, { useEffect, useState } from 'react';
import { gatewayHealth } from '../api/gatewayClient';

const theme = {
  success: '#16a34a',
  error: '#EF4444',
  text: '#111827',
};

// PUBLIC_INTERFACE
export default function GatewayHealthBadge() {
  /** Small UI badge that indicates Gateway reachability by pinging GET /health. */
  const [status, setStatus] = useState('unknown'); // unknown | ok | down

  useEffect(() => {
    let mounted = true;
    let timer = null;

    async function check() {
      try {
        await gatewayHealth();
        if (mounted) setStatus('ok');
      } catch {
        if (mounted) setStatus('down');
      }
    }

    check();
    timer = setInterval(check, 15000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, []);

  const color = status === 'ok' ? theme.success : (status === 'down' ? theme.error : 'rgba(17, 24, 39, 0.45)');
  const label = status === 'ok' ? 'Gateway: OK' : (status === 'down' ? 'Gateway: DOWN' : 'Gateway: …');

  return (
    <div
      title="Gateway health check"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderRadius: 999,
        border: '1px solid rgba(17, 24, 39, 0.10)',
        background: 'rgba(255, 255, 255, 0.75)',
        color: theme.text,
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: 99,
          background: color,
          boxShadow: `0 0 0 4px ${status === 'ok' ? 'rgba(22,163,74,0.12)' : status === 'down' ? 'rgba(239,68,68,0.12)' : 'rgba(17,24,39,0.08)'}`,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
