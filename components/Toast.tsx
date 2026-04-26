'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; Icon: React.ElementType }> = {
  success: {
    bg: 'var(--sage-pale)',
    border: 'var(--sage-light)',
    icon: 'var(--sage)',
    Icon: CheckCircle2,
  },
  error: {
    bg: 'var(--terracotta-pale)',
    border: 'var(--terracotta-light)',
    icon: 'var(--terracotta)',
    Icon: AlertCircle,
  },
  info: {
    bg: 'var(--sky-pale)',
    border: 'var(--sky-light)',
    icon: 'var(--sky)',
    Icon: Info,
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const { bg, border, icon, Icon } = STYLES[toast.type];

  useEffect(() => {
    // Slight delay so the enter animation triggers
    const show = requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => {
      cancelAnimationFrame(show);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: '0 4px 20px rgba(35,27,19,0.12)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        maxWidth: '360px',
        width: '100%',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
      }}
    >
      <Icon
        style={{ color: icon, flexShrink: 0, marginTop: '1px' }}
        className="w-5 h-5"
      />
      <p
        style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--ink-mid)',
          lineHeight: '1.5',
        }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          width: '28px',
          height: '28px',
          minHeight: 'unset',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.6)',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-2px',
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
