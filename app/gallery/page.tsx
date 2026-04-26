'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, BarChart3, ImageOff } from 'lucide-react';
import { getGallery, deleteFromGallery, type SavedImage } from '@/lib/gallery';

export default function GalleryPage() {
  const router = useRouter();
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { loadGallery(); }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const images = await getGallery();
      setSavedImages(images);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const success = await deleteFromGallery(imageId);
      if (success) {
        setSavedImages(prev => prev.filter(img => img.id !== imageId));
      } else {
        alert('Failed to delete image. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ── Header ─────────────────────────────── */}
      <header
        className="sticky top-0 z-10"
        style={{
          background: 'rgba(250,248,245,0.88)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
              background: 'var(--cream-deep)',
              color: 'var(--ink-mid)',
              border: '1px solid var(--border)',
              fontSize: '14px',
              minHeight: '40px',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Gallery
          </h1>

          <button
            onClick={() => router.push('/gallery/overview')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
              background: 'var(--sky)',
              color: '#FFFFFF',
              fontSize: '14px',
              minHeight: '40px',
            }}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>
        </div>
      </header>

      {/* ── Content ────────────────────────────── */}
      <main className="flex-1 px-5 py-8">
        <div className="max-w-6xl mx-auto">

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--cream-border)', borderTopColor: 'var(--sky)' }}
              />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading your artwork…</p>
            </div>
          ) : savedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'var(--cream-deep)' }}
              >
                <ImageOff className="w-9 h-9" style={{ color: 'var(--muted-light)' }} />
              </div>
              <div>
                <p className="text-xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>
                  No artwork yet
                </p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Start coloring and save your first creation.
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'var(--terracotta)', fontSize: '14px' }}
              >
                Start Coloring
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                {savedImages.length} {savedImages.length === 1 ? 'piece' : 'pieces'} saved
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {savedImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative rounded-2xl overflow-hidden transition-all hover:shadow-lg"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 1px 3px rgba(35,27,19,0.06)',
                    }}
                  >
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden" style={{ background: 'var(--cream-deep)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.dataUrl}
                        alt={`Artwork from ${new Date(image.timestamp).toLocaleDateString()}`}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* Hover overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-3"
                        style={{ background: 'linear-gradient(135deg, transparent 60%, rgba(35,27,19,0.2))' }}
                      >
                        <button
                          onClick={() => handleDelete(image.id)}
                          disabled={deletingId === image.id}
                          className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
                          style={{
                            background: 'rgba(175,94,71,0.9)',
                            backdropFilter: 'blur(8px)',
                            minHeight: 'unset',
                          }}
                          aria-label="Delete image"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2.5 flex items-center justify-between">
                      <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                        {new Date(image.timestamp).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </p>
                      {/* Mobile delete button (always visible on small screens) */}
                      <button
                        onClick={() => handleDelete(image.id)}
                        disabled={deletingId === image.id}
                        className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                        style={{
                          background: 'var(--terracotta-pale)',
                          color: 'var(--terracotta)',
                          minHeight: 'unset',
                        }}
                        aria-label="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
