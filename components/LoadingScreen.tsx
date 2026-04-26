'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance on next frame
    const mountTimer = requestAnimationFrame(() => setMounted(true));
    const exitTimer = setTimeout(() => setExiting(true), 2400);
    const doneTimer = setTimeout(() => onComplete(), 3000);
    return () => {
      cancelAnimationFrame(mountTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const letters = [...'MindFill'];

  const palette = [
    { color: '#7BAA88', top: '38%', left: '18%', size: 10, delay: 1.05 },
    { color: '#6BA6C0', top: '32%', left: '76%', size: 8,  delay: 1.15 },
    { color: '#E09E78', top: '60%', left: '22%', size: 12, delay: 1.20 },
    { color: '#C88A8A', top: '62%', left: '75%', size: 9,  delay: 1.10 },
    { color: '#AF5E47', top: '28%', left: '48%', size: 7,  delay: 1.30 },
    { color: '#7BAA88', top: '68%', left: '50%', size: 8,  delay: 1.25 },
    { color: '#6BA6C0', top: '42%', left: '84%', size: 6,  delay: 1.40 },
    { color: '#E09E78', top: '35%', left: '12%', size: 6,  delay: 1.35 },
  ];

  return (
    <>
      <style>{`
        @keyframes mf-letter {
          from { opacity: 0; transform: translateY(18px) scale(0.95); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    filter: blur(0);  }
        }
        @keyframes mf-stroke {
          from { stroke-dashoffset: 520; opacity: 0; }
          to   { stroke-dashoffset: 0;   opacity: 1; }
        }
        @keyframes mf-sub {
          from { opacity: 0; transform: translateY(6px); letter-spacing: 0.3em; }
          to   { opacity: 1; transform: translateY(0);   letter-spacing: 0.18em; }
        }
        @keyframes mf-dot {
          0%   { opacity: 0; transform: scale(0) rotate(-30deg); }
          70%  { opacity: 1; transform: scale(1.15) rotate(5deg); }
          100% { opacity: 0.7; transform: scale(1) rotate(0deg); }
        }
        @keyframes mf-bloom {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes mf-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.06); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'var(--cream)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exiting ? 0 : 1,
          transition: exiting ? 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Soft radial bloom behind the text */}
        <div
          style={{
            position: 'absolute',
            width: '560px',
            height: '320px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, var(--cream-deep) 0%, transparent 70%)',
            animation: mounted ? 'mf-bloom 1s ease 0.05s both, mf-pulse 3s ease 1s infinite' : 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Floating palette dots */}
        {palette.map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: dot.top,
              left: dot.left,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              borderRadius: '50%',
              background: dot.color,
              opacity: 0,
              animation: mounted
                ? `mf-dot 0.6s cubic-bezier(0.34,1.56,0.64,1) ${dot.delay}s forwards`
                : 'none',
              boxShadow: `0 2px 8px ${dot.color}55`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Main content */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}>
          {/* Wordmark */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(3.5rem, 10vw, 6.5rem)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
              lineHeight: 1,
              margin: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {letters.map((letter, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: 0,
                  animation: mounted
                    ? `mf-letter 0.55s cubic-bezier(0.4,0,0.2,1) ${0.08 + i * 0.075}s forwards`
                    : 'none',
                  // Colour the 'F' letters subtly to hint at the palette
                  color: i === 4 ? 'var(--sage)' : i === 7 ? 'var(--sky)' : 'var(--ink)',
                }}
              >
                {letter}
              </span>
            ))}
          </h1>

          {/* SVG brush-stroke underline */}
          <svg
            viewBox="0 0 520 18"
            width="100%"
            style={{
              display: 'block',
              maxWidth: '480px',
              margin: '10px auto 0',
              overflow: 'visible',
            }}
            aria-hidden="true"
          >
            {/* Warm gradient definition */}
            <defs>
              <linearGradient id="mf-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#7BAA88" />
                <stop offset="45%"  stopColor="#6BA6C0" />
                <stop offset="100%" stopColor="#C88A8A" />
              </linearGradient>
            </defs>
            {/* A slightly wobbly path for a hand-drawn feel */}
            <path
              d="M 4 10 C 80 6, 160 14, 260 9 S 420 5, 516 10"
              fill="none"
              stroke="url(#mf-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="520"
              strokeDashoffset="520"
              style={{
                animation: mounted
                  ? 'mf-stroke 0.7s cubic-bezier(0.4,0,0.2,1) 0.72s both'
                  : 'none',
              }}
            />
          </svg>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted-light)',
              marginTop: '18px',
              opacity: 0,
              animation: mounted
                ? 'mf-sub 0.6s cubic-bezier(0.4,0,0.2,1) 1.05s forwards'
                : 'none',
            }}
          >
            Therapeutic Coloring
          </p>
        </div>
      </div>
    </>
  );
}
