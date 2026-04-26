'use client';

import { CheckCircle2, Clock, Palette, Image as ImageIcon } from 'lucide-react';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onNext: () => void;
  sessionDuration?: string;
  colorsUsed?: number;
  imageSize?: string;
}

export default function SessionSummaryModal({
  isOpen,
  onNext,
  sessionDuration = '--:--',
  colorsUsed = 0,
  imageSize = '--x--',
}: SessionSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(35,27,19,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coloured top band */}
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{ background: 'var(--sage-pale)', borderBottom: '1px solid var(--sage-light)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--sage)' }}
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Session Complete
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Great work — here's your summary
          </p>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-3">
          {[
            { icon: Clock, label: 'Duration', value: sessionDuration, color: 'var(--sky)', pale: 'var(--sky-pale)' },
            { icon: Palette, label: 'Colors Used', value: String(colorsUsed), color: 'var(--sage)', pale: 'var(--sage-pale)' },
            { icon: ImageIcon, label: 'Canvas Size', value: imageSize, color: 'var(--peach)', pale: 'var(--peach-pale)' },
          ].map(({ icon: Icon, label, value, color, pale }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
              style={{ background: pale, border: `1px solid ${pale}` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.7)' }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color }} />
              </div>
              <p className="flex-1 text-sm font-medium" style={{ color: 'var(--ink-mid)' }}>{label}</p>
              <p className="text-lg font-bold" style={{ color, fontFamily: 'var(--font-display)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          <button
            onClick={onNext}
            className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--terracotta)', fontSize: '15px', minHeight: '52px' }}
          >
            View Analysis →
          </button>
        </div>
      </div>
    </div>
  );
}
