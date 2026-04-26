'use client';

import { Check, X } from 'lucide-react';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const PALETTE = [
  // Warm neutrals
  { hex: '#FAF8F5', name: 'Cream' },
  { hex: '#EAE0D4', name: 'Sand' },
  { hex: '#C4B4A4', name: 'Taupe' },
  { hex: '#8C7A6A', name: 'Umber' },
  // Sage greens
  { hex: '#B8D8BC', name: 'Mint' },
  { hex: '#7BAA88', name: 'Sage' },
  { hex: '#4A8560', name: 'Forest' },
  { hex: '#2D5A3D', name: 'Deep Forest' },
  // Sky blues
  { hex: '#B5D4E5', name: 'Mist' },
  { hex: '#6BA6C0', name: 'Sky' },
  { hex: '#3D7EA6', name: 'Denim' },
  { hex: '#1E4D6B', name: 'Navy' },
  // Warm tones
  { hex: '#F4D4B8', name: 'Apricot' },
  { hex: '#E09E78', name: 'Peach' },
  { hex: '#C17040', name: 'Amber' },
  { hex: '#AF5E47', name: 'Terracotta' },
  // Rose & plum
  { hex: '#F0C4C4', name: 'Blush' },
  { hex: '#C88A8A', name: 'Rose' },
  { hex: '#9E6060', name: 'Dusty Rose' },
  { hex: '#7A4848', name: 'Burgundy' },
  // Basics
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#D0D0D0', name: 'Silver' },
  { hex: '#606060', name: 'Slate' },
  { hex: '#1A1410', name: 'Ink' },
];

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

export default function ColorPicker({ isOpen, onClose, selectedColor, onColorSelect }: ColorPickerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(35,27,19,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-3xl p-6 shadow-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              Choose a Color
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {PALETTE.find(c => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name ?? 'Custom'}
            </p>
          </div>

          {/* Selected color preview */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl shadow-sm"
              style={{
                background: selectedColor,
                border: '2px solid var(--cream-border)',
              }}
            />
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:opacity-70 active:scale-95"
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
        </div>

        {/* Color Grid */}
        <div className="grid grid-cols-6 gap-2.5">
          {PALETTE.map(({ hex, name }) => {
            const isSelected = selectedColor.toLowerCase() === hex.toLowerCase();
            const light = isLightColor(hex);

            return (
              <button
                key={hex}
                onClick={() => { onColorSelect(hex); onClose(); }}
                title={name}
                className="relative transition-all hover:scale-110 active:scale-95"
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: hex,
                  border: isSelected
                    ? `3px solid ${light ? '#6B5D5D' : '#FFFFFF'}`
                    : '2px solid rgba(0,0,0,0.08)',
                  boxShadow: isSelected
                    ? `0 0 0 2px ${hex}, 0 4px 12px rgba(0,0,0,0.15)`
                    : '0 1px 3px rgba(0,0,0,0.1)',
                  minHeight: 'unset',
                }}
                aria-label={`Select ${name}`}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className="w-4 h-4 drop-shadow"
                      style={{ color: light ? '#4A3C30' : '#FFFFFF' }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Done button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--terracotta)',
            fontSize: '14px',
            minHeight: '48px',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
