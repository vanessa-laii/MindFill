'use client';

import { Download, X, FileText } from 'lucide-react';

interface SessionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  onDownloadReport: () => void;
}

export default function SessionReportModal({
  isOpen,
  onClose,
  analysis,
  onDownloadReport,
}: SessionReportModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(35,27,19,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '90dvh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 pt-6 pb-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--sky-pale)' }}
            >
              <FileText className="w-5 h-5" style={{ color: 'var(--sky)' }} />
            </div>
            <div>
              <h2
                className="text-xl font-semibold leading-snug"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
              >
                Session Analysis
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                AI-generated clinical insights for caregivers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-70 active:scale-95 shrink-0 ml-3"
            style={{
              background: 'var(--cream-deep)',
              color: 'var(--muted)',
              minHeight: 'unset',
            }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Analysis Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className="rounded-2xl px-5 py-4 min-h-32"
            style={{ background: 'var(--cream-deep)', border: '1px solid var(--cream-deeper)' }}
          >
            {analysis && analysis.trim() ? (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--ink-mid)' }}
              >
                {analysis}
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                  style={{ borderColor: 'var(--cream-border)', borderTopColor: 'var(--sky)' }}
                />
                <p className="text-sm italic" style={{ color: 'var(--muted)' }}>
                  Generating analysis… this may take a moment.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-3 px-6 pb-6 pt-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onDownloadReport}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'var(--sky)', fontSize: '14px', minHeight: '48px' }}
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-semibold transition-all hover:opacity-80 active:scale-95"
            style={{
              background: 'var(--cream-deep)',
              color: 'var(--ink-mid)',
              border: '1px solid var(--border)',
              fontSize: '14px',
              minHeight: '48px',
            }}
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
