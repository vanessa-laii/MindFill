'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Eraser, Save, Upload, Droplet, Images, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Canvas, { type CanvasHandle } from '@/components/Canvas/Canvas';
import ColorPicker from '@/components/ColorPicker';
import SessionSummaryModal from '@/components/SessionSummaryModal';
import SessionReportModal from '@/components/SessionReportModal';
import Toast, { type ToastMessage, type ToastType } from '@/components/Toast';
import LoadingScreen from '@/components/LoadingScreen';
import { saveToGallery } from '@/lib/gallery';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<CanvasHandle>(null);
  const [selectedColor, setSelectedColor] = useState('#D28378');
  const [brushSize, setBrushSize] = useState(20);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isFloodFill, setIsFloodFill] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [baseImage, setBaseImage] = useState<string | undefined>(undefined);
  const [mode, setMode] = useState<'fun' | 'care'>('fun');
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionAnalysis, setSessionAnalysis] = useState<string | null>(null);

  const [sessionEvents, setSessionEvents] = useState<Array<{
    type: 'fill' | 'draw' | 'erase' | 'move' | 'nudge';
    x?: number;
    y?: number;
    timestamp: number;
  }>>([]);
  const [colorsUsedSet, setColorsUsedSet] = useState<Set<string>>(new Set());
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakTextRef = useRef<((text: string) => void) | null>(null);

  const [showLoader, setShowLoader] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const [sessionMetrics, setSessionMetrics] = useState<{
    neglectRatio: number | null;
    quadrantActivity: {
      topLeft: number;
      topRight: number;
      bottomLeft: number;
      bottomRight: number;
    } | null;
    tremorScore: number | null;
    totalTime: number | null;
    nudgeCount: number;
  } | null>(null);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice =>
      voice.name.includes('Google') ||
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onerror = (error) => console.error('Speech synthesis error:', error);
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    speakTextRef.current = speakText;
  }, [speakText]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => { window.speechSynthesis.getVoices(); };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  useEffect(() => {
    if (baseImage && mode === 'care') {
      const startTime = new Date();
      setSessionStartTime(startTime);
      setSessionEvents([]);
      setColorsUsedSet(new Set());
      if (nudgeTimerRef.current) { clearTimeout(nudgeTimerRef.current); nudgeTimerRef.current = null; }
      nudgeTimerRef.current = setTimeout(() => {
        setSessionEvents(prev => [...prev, { type: 'nudge' as const, timestamp: Date.now() }]);
        fetch('/api/gemini/encouragement', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          .then(res => res.json())
          .then(data => { if (data.success && data.message && speakTextRef.current) speakTextRef.current(data.message); })
          .catch(err => console.error('Error calling encouragement API:', err));
        nudgeTimerRef.current = setTimeout(() => {
          setSessionEvents(prev => [...prev, { type: 'nudge' as const, timestamp: Date.now() }]);
          fetch('/api/gemini/encouragement', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(res => res.json())
            .then(data => { if (data.success && data.message) speakText(data.message); })
            .catch(err => console.error('Error calling encouragement API:', err));
        }, 60000);
      }, 60000);
    } else if (mode === 'fun') {
      setSessionEvents([]);
      setColorsUsedSet(new Set());
      if (nudgeTimerRef.current) { clearTimeout(nudgeTimerRef.current); nudgeTimerRef.current = null; }
    }
    return () => { if (nudgeTimerRef.current) { clearTimeout(nudgeTimerRef.current); nudgeTimerRef.current = null; } };
  }, [baseImage, mode]);

  const handleCanvasEvent = useCallback((event: {
    type: 'fill' | 'draw' | 'erase' | 'move';
    x: number;
    y: number;
    timestamp: number;
  }) => {
    if (mode !== 'care') return;
    setSessionEvents(prev => [...prev, event]);
    if (event.type === 'fill' || event.type === 'draw') {
      setColorsUsedSet(prev => { const s = new Set(prev); s.add(selectedColor); return s; });
    }
    if (event.type === 'fill' || event.type === 'draw' || event.type === 'erase') {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = setTimeout(() => {
        setSessionEvents(prev => [...prev, { type: 'nudge' as const, timestamp: Date.now() }]);
        fetch('/api/gemini/encouragement', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          .then(res => res.json())
          .then(data => { if (data.success && data.message && speakTextRef.current) speakTextRef.current(data.message); })
          .catch(err => console.error('Error calling encouragement API:', err));
        nudgeTimerRef.current = setTimeout(() => {
          setSessionEvents(prev => [...prev, { type: 'nudge' as const, timestamp: Date.now() }]);
          fetch('/api/gemini/encouragement', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
            .then(res => res.json())
            .then(data => { if (data.success && data.message) speakText(data.message); })
            .catch(err => console.error('Error calling encouragement API:', err));
        }, 60000);
      }, 60000);
    }
  }, [mode, selectedColor]);

  const getSessionDuration = (): string => {
    if (!sessionStartTime) return '00:00';
    const diffMs = new Date().getTime() - sessionStartTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
  };

  const getCanvasDimensions = (): string => {
    if (typeof document === 'undefined') return '--x--';
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas && canvas.width > 0 && canvas.height > 0) return `${canvas.width}x${canvas.height}`;
    return '--x--';
  };

  const handleSave = async () => {
    if (mode === 'care') {
      setShowSessionSummary(true);
    } else {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        try {
          const imageId = await saveToGallery(canvas);
          if (imageId) { router.push('/gallery'); }
          else showToast('Failed to save drawing. Please try again.', 'error');
        } catch (error) {
          console.error('Error saving:', error);
          showToast('Failed to save drawing. Please try again.', 'error');
        }
      }
    }
  };

  const calculateSessionMetrics = useCallback(() => {
    if (!sessionStartTime || sessionEvents.length === 0) return null;
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return null;
    const endTime = new Date();
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    const clickEvents = sessionEvents.filter(e => e.type === 'fill' || e.type === 'draw' || e.type === 'erase');
    let topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0;
    clickEvents.forEach(e => {
      if (e.x !== undefined && e.y !== undefined) {
        if (e.x < midX && e.y < midY) topLeft++;
        else if (e.x >= midX && e.y < midY) topRight++;
        else if (e.x < midX && e.y >= midY) bottomLeft++;
        else bottomRight++;
      }
    });
    const totalClicks = topLeft + topRight + bottomLeft + bottomRight;
    const quadrantActivity = totalClicks > 0
      ? { topLeft: (topLeft / totalClicks) * 100, topRight: (topRight / totalClicks) * 100, bottomLeft: (bottomLeft / totalClicks) * 100, bottomRight: (bottomRight / totalClicks) * 100 }
      : { topLeft: 25, topRight: 25, bottomLeft: 25, bottomRight: 25 };
    const leftClicks = topLeft + bottomLeft;
    const neglectRatio = totalClicks > 0 ? leftClicks / totalClicks : 0.5;
    const moveEvents = sessionEvents.filter(e => e.type === 'move' && e.x !== undefined && e.y !== undefined);
    let tremorScore = 0;
    const TREMOR_THRESHOLD = 3;
    for (let i = 1; i < moveEvents.length; i++) {
      const prev = moveEvents[i - 1], curr = moveEvents[i];
      if (prev.x !== undefined && prev.y !== undefined && curr.x !== undefined && curr.y !== undefined) {
        const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        if (distance < TREMOR_THRESHOLD && distance > 0) tremorScore += 1;
      }
    }
    const normalizedTremorScore = moveEvents.length > 0 ? tremorScore / moveEvents.length : 0;
    const totalTime = (endTime.getTime() - sessionStartTime.getTime()) / 1000;
    const nudgeCount = sessionEvents.filter(e => e.type === 'nudge').length;
    return { neglectRatio, quadrantActivity, tremorScore: normalizedTremorScore, totalTime, nudgeCount };
  }, [sessionEvents, sessionStartTime]);

  const handleSessionSummaryNext = async () => {
    const metrics = calculateSessionMetrics();
    if (metrics) {
      setSessionMetrics(metrics);
      try {
        const response = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            neglectRatio: metrics.neglectRatio,
            quadrantActivity: metrics.quadrantActivity,
            tremorScore: metrics.tremorScore,
            nudgeCount: metrics.nudgeCount,
            context: 'a coloring page',
          }),
        });
        const data = await response.json();
        if (response.ok && data.success && data.analysis) {
          setSessionAnalysis(data.analysis);
          setShowSessionSummary(false);
          setShowSessionReport(true);
          return;
        } else {
          const errorMsg = data.error || 'Unknown error';
          if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate')) {
            showToast('Analysis temporarily unavailable — your drawing will still be saved.', 'info');
          } else {
            showToast(`Unable to generate analysis: ${errorMsg}`, 'error');
          }
        }
      } catch (error) {
        console.error('Error calling Gemini API:', error);
        showToast('Error generating analysis — your drawing will still be saved.', 'error');
      }
    } else {
      showToast('No session data yet — try coloring the image before saving.', 'info');
    }
    await saveImageToGallery();
  };

  const saveImageToGallery = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const imageId = await saveToGallery(canvas);
          if (imageId) {
            if (mode === 'care' && sessionMetrics && sessionAnalysis) {
            try {
              await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageId,
                  completionTime: sessionMetrics.totalTime,
                  neglectRatio: sessionMetrics.neglectRatio,
                  quadrantActivity: sessionMetrics.quadrantActivity,
                  tremorIndex: sessionMetrics.tremorScore,
                  aiInsight: sessionAnalysis,
                  userId: null,
                }),
              });
            } catch (error) {
              console.error('Error saving session data:', error);
            }
          }
          setSessionStartTime(new Date());
          router.push('/gallery');
        } else {
          showToast('Failed to save drawing. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error saving:', error);
        showToast('Failed to save drawing. Please try again.', 'error');
      }
    }
  };

  const handleReportClose = async () => {
    setShowSessionReport(false);
    await saveImageToGallery();
  };

  const handleDownloadReport = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas || !sessionAnalysis) return;
    try {
      const imageDataUrl = canvas.toDataURL('image/png');
      const reportText = `Session Analysis Report\n\n${sessionAnalysis}\n\nGenerated on ${new Date().toLocaleString()}`;
      const textBlob = new Blob([reportText], { type: 'text/plain' });
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `session-report-${Date.now()}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      URL.revokeObjectURL(textUrl);
      const imageLink = document.createElement('a');
      imageLink.href = imageDataUrl;
      imageLink.download = `colored-image-${Date.now()}.png`;
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error downloading report:', error);
      showToast('Failed to download report. Please try again.', 'error');
    }
  };

  const handleUploadClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) { showToast('Invalid file format. Please upload PNG, JPG, or JPEG only.', 'error'); return; }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { showToast('File too large — maximum size is 10 MB.', 'error'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload-template', { method: 'POST', body: formData });
      if (!response.ok) {
        let errorMessage = 'Failed to upload image';
        try { const errorData = await response.json(); errorMessage = errorData.error || errorData.details || errorMessage; }
        catch { errorMessage = `Server error: ${response.status} ${response.statusText}`; }
        throw new Error(errorMessage);
      }
      const result = await response.json();
      const processResponse = await fetch('/api/process-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: result.url }),
      });
      if (!processResponse.ok) {
        const processError = await processResponse.json();
        throw new Error(processError.error || 'Failed to process image into outline');
      }
      const processResult = await processResponse.json();
      if (processResult.dataUrl) {
        setBaseImage(processResult.dataUrl);
        showToast('Image processed! Your coloring outline is ready.', 'success');
      } else {
        throw new Error('Failed to get processed outline');
      }
    } catch (error) {
      console.error('Error uploading/processing:', error);
      showToast(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    }
  };

  const handleUndo = useCallback(() => {
    const undone = canvasRef.current?.undo();
    if (!undone) showToast('Nothing left to undo.', 'info');
  }, [showToast]);

  // Ctrl+Z / Cmd+Z keyboard shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        canvasRef.current?.undo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeToolBg = (isActive: boolean, colorVar: string, paleBg: string) =>
    isActive ? paleBg : 'var(--cream-deep)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {showLoader && <LoadingScreen onComplete={() => setShowLoader(false)} />}
      <main className="flex-1 flex flex-col md:flex-row p-3 md:p-5 gap-3 md:gap-4" style={{ minHeight: '100dvh' }}>

        {/* ── Sidebar ──────────────────────────────── */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0">
          <div
            className="h-full flex flex-col gap-5 p-5 rounded-2xl"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 1px 4px rgba(35,27,19,0.06)',
            }}
          >
            {/* Brand */}
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl font-semibold leading-none tracking-tight"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
                >
                  MindFill
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                  Therapeutic Coloring
                </p>
              </div>
              <button
                onClick={() => router.push('/gallery')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 active:scale-95"
                style={{
                  background: 'var(--cream-deep)',
                  color: 'var(--muted)',
                  border: '1px solid var(--border)',
                  minHeight: '34px',
                }}
              >
                <Images className="w-3.5 h-3.5" />
                Gallery
              </button>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Drawing Tools */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-light)' }}>
                Tools
              </p>

              {/* Tool Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {/* Color */}
                <button
                  onClick={() => { setShowColorPicker(true); setIsEraser(false); setIsFloodFill(false); }}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                  style={{
                    background: !isEraser && !isFloodFill ? 'var(--sky-pale)' : 'var(--cream-deep)',
                    color: !isEraser && !isFloodFill ? 'var(--sky)' : 'var(--muted)',
                    border: `1.5px solid ${!isEraser && !isFloodFill ? 'var(--sky-light)' : 'transparent'}`,
                    minHeight: '72px',
                  }}
                >
                  <Palette className="w-5 h-5" />
                  <span className="text-xs font-medium">Color</span>
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: selectedColor,
                      border: '2px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 0 0 1px var(--cream-border)',
                    }}
                  />
                </button>

                {/* Fill */}
                <button
                  onClick={() => { setIsFloodFill(!isFloodFill); setIsEraser(false); }}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                  style={{
                    background: isFloodFill ? 'var(--sage-pale)' : 'var(--cream-deep)',
                    color: isFloodFill ? 'var(--sage)' : 'var(--muted)',
                    border: `1.5px solid ${isFloodFill ? 'var(--sage-light)' : 'transparent'}`,
                    minHeight: '72px',
                  }}
                >
                  <Droplet className="w-5 h-5" />
                  <span className="text-xs font-medium">Fill</span>
                </button>

                {/* Eraser */}
                <button
                  onClick={() => { setIsEraser(!isEraser); setIsFloodFill(false); }}
                  className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all active:scale-95"
                  style={{
                    background: isEraser ? 'var(--rose-pale)' : 'var(--cream-deep)',
                    color: isEraser ? 'var(--rose)' : 'var(--muted)',
                    border: `1.5px solid ${isEraser ? 'var(--rose-light)' : 'transparent'}`,
                    minHeight: '72px',
                  }}
                >
                  <Eraser className="w-5 h-5" />
                  <span className="text-xs font-medium">Erase</span>
                </button>
              </div>

              {/* Brush Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: 'var(--ink-mid)' }}>
                    Brush size
                  </span>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-md"
                    style={{ background: 'var(--cream-deep)', color: 'var(--muted)' }}
                  >
                    {brushSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-2 rounded-full"
                  style={{ minHeight: 'unset' }}
                />
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Upload Template */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-light)' }}>
                Template
              </p>
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--cream-deep)',
                  color: 'var(--ink-mid)',
                  border: '1.5px dashed var(--cream-border)',
                  minHeight: '52px',
                  fontSize: '14px',
                }}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Processing…' : 'Upload Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload image template"
              />
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Mode Toggle */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-light)' }}>
                Session Mode
              </p>
              <div
                className="flex p-1 rounded-xl gap-1"
                style={{ background: 'var(--cream-deep)' }}
              >
                <button
                  onClick={() => setMode('fun')}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: mode === 'fun' ? 'var(--surface)' : 'transparent',
                    color: mode === 'fun' ? 'var(--ink)' : 'var(--muted)',
                    boxShadow: mode === 'fun' ? '0 1px 3px rgba(35,27,19,0.08)' : 'none',
                    minHeight: '38px',
                  }}
                >
                  Fun
                </button>
                <button
                  onClick={() => setMode('care')}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: mode === 'care' ? 'var(--surface)' : 'transparent',
                    color: mode === 'care' ? 'var(--sage)' : 'var(--muted)',
                    boxShadow: mode === 'care' ? '0 1px 3px rgba(35,27,19,0.08)' : 'none',
                    minHeight: '38px',
                  }}
                >
                  Care
                </button>
              </div>
              {mode === 'care' && (
                <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
                  Session tracking &amp; AI analysis enabled
                </p>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'var(--terracotta)',
                  fontSize: '15px',
                  minHeight: '52px',
                }}
              >
                <Save className="w-4 h-4" />
                Save to Gallery
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  title="Undo (Ctrl+Z)"
                  className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl font-medium transition-all hover:opacity-80 active:scale-95"
                  style={{
                    background: 'var(--cream-deep)',
                    color: 'var(--ink-mid)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    minHeight: '42px',
                  }}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo
                </button>
                <button
                  onClick={handleClearCanvas}
                  className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:opacity-80 active:scale-95"
                  style={{
                    background: 'transparent',
                    color: 'var(--muted)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    minHeight: '42px',
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Canvas Area ───────────────────────────── */}
        <div className="flex-1 min-w-0 min-h-0">
          <div
            className="h-full rounded-2xl p-2.5"
            style={{
              background: 'var(--cream-deep)',
              border: '1px solid var(--border)',
              minHeight: 'calc(100dvh - 2.5rem)',
            }}
          >
            <div
              className="w-full h-full bg-white rounded-xl overflow-hidden"
              style={{
                border: '1px solid var(--cream-border)',
                boxShadow: 'inset 0 1px 4px rgba(35,27,19,0.05)',
              }}
            >
              <Canvas
                ref={canvasRef}
                color={selectedColor}
                brushSize={brushSize}
                isEraser={isEraser}
                baseImage={baseImage}
                mode={mode}
                isFloodFill={isFloodFill}
                onEvent={mode === 'care' ? handleCanvasEvent : undefined}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Toast Notifications ─────────────────────── */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Modals ───────────────────────────────────── */}
      <ColorPicker
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
      />

      <SessionSummaryModal
        isOpen={showSessionSummary}
        onNext={handleSessionSummaryNext}
        sessionDuration={getSessionDuration()}
        colorsUsed={colorsUsedSet.size}
        imageSize={getCanvasDimensions()}
      />

      <SessionReportModal
        isOpen={showSessionReport}
        onClose={handleReportClose}
        analysis={sessionAnalysis || ''}
        onDownloadReport={handleDownloadReport}
      />

    </div>
  );
}
