'use client';

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { floodFill, hexToRgb } from '@/lib/floodFill';

export interface CanvasHandle {
  undo: () => boolean; // returns true if something was undone
}

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser?: boolean;
  baseImage?: string;
  mode?: 'fun' | 'care';
  isFloodFill?: boolean;
  onEvent?: (event: {
    type: 'fill' | 'draw' | 'erase' | 'move';
    x: number;
    y: number;
    timestamp: number;
  }) => void;
}

const MAX_HISTORY = 40;

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  { color, brushSize, isEraser = false, baseImage, mode = 'fun', isFloodFill = false, onEvent },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  // For smooth Bézier strokes: track the midpoint of the previous segment
  const lastMidRef = useRef<{ x: number; y: number } | null>(null);
  const baseImageLoadedRef = useRef<boolean>(false);
  const baseImageUrlRef = useRef<string | undefined>(baseImage);

  // Undo history: array of ImageData snapshots
  const historyRef = useRef<ImageData[]>([]);

  // Phase 1: Throttle move events
  const lastMoveEventRef = useRef<number>(0);
  const MOVE_EVENT_THROTTLE_MS = 50;

  // ── Imperative handle ─────────────────────────────────────
  useImperativeHandle(ref, () => ({
    undo: () => {
      const canvas = canvasRef.current;
      if (!canvas || historyRef.current.length === 0) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const snapshot = historyRef.current.pop()!;
      ctx.putImageData(snapshot, 0, 0);
      return true;
    },
  }), []);

  // ── Snapshot helper ───────────────────────────────────────
  const pushSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(snapshot);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift(); // drop oldest
    }
  }, []);

  // ── Base image loading ────────────────────────────────────
  useEffect(() => {
    if (baseImageUrlRef.current !== baseImage) {
      baseImageUrlRef.current = baseImage;
    }
  }, [baseImage]);

  const loadBaseImage = useCallback((targetCtx: CanvasRenderingContext2D, targetWidth: number, targetHeight: number) => {
    const currentBaseImage = baseImageUrlRef.current;
    if (!currentBaseImage) return;

    const img = new Image();
    if (!currentBaseImage.startsWith('data:')) img.crossOrigin = 'anonymous';

    img.onload = () => {
      targetCtx.fillStyle = '#FFFFFF';
      targetCtx.fillRect(0, 0, targetWidth, targetHeight);

      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;
      let drawWidth = targetWidth, drawHeight = targetHeight, offsetX = 0, offsetY = 0;

      if (imgAspect > canvasAspect) {
        drawHeight = targetWidth / imgAspect;
        offsetY = (targetHeight - drawHeight) / 2;
      } else {
        drawWidth = targetHeight * imgAspect;
        offsetX = (targetWidth - drawWidth) / 2;
      }

      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      baseImageLoadedRef.current = true;

      // Clear undo history when a new template is loaded
      historyRef.current = [];
    };

    img.onerror = () => { baseImageLoadedRef.current = false; };
    img.src = currentBaseImage;
  }, []);

  // ── Canvas initialisation / resize ───────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.width > 0 && imageData.height > 0 &&
          imageData.data.some((value, index) => index % 4 !== 3 && value !== 255);

        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);

        if (hasContent) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imageData.width;
          tempCanvas.height = imageData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          }
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (baseImageUrlRef.current) {
            setTimeout(() => {
              baseImageLoadedRef.current = false;
              loadBaseImage(ctx, canvas.width, canvas.height);
            }, 50);
          }
        }
      } else if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = Math.floor(width) || 800;
        canvas.height = Math.floor(height) || 600;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (baseImageUrlRef.current) {
          baseImageLoadedRef.current = false;
          loadBaseImage(ctx, canvas.width, canvas.height);
        }
      }
    };

    setTimeout(() => resizeCanvas(), 0);

    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        resizeCanvas();
        if (baseImageUrlRef.current && canvas.width > 0 && canvas.height > 0) {
          const currentCtx = canvas.getContext('2d');
          if (currentCtx) {
            setTimeout(() => {
              baseImageLoadedRef.current = false;
              loadBaseImage(currentCtx, canvas.width, canvas.height);
            }, 50);
          }
        }
      });
    });

    resizeObserver.observe(canvas);
    const container = canvas.parentElement;
    if (container) resizeObserver.observe(container);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (container) resizeObserver.unobserve(container);
    };
  }, [loadBaseImage]);

  // ── Reload when baseImage prop changes ───────────────────
  useEffect(() => {
    if (!baseImage) { baseImageLoadedRef.current = false; return; }

    const loadBaseImageOnCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) { setTimeout(loadBaseImageOnCanvas, 100); return; }
      if (canvas.width === 0 || canvas.height === 0) { setTimeout(loadBaseImageOnCanvas, 100); return; }
      baseImageLoadedRef.current = false;
      const ctx = canvas.getContext('2d');
      if (!ctx) { setTimeout(loadBaseImageOnCanvas, 100); return; }
      loadBaseImage(ctx, canvas.width, canvas.height);
    };

    setTimeout(() => loadBaseImageOnCanvas(), 300);
  }, [baseImage, loadBaseImage]);

  // ── Coordinate helper ─────────────────────────────────────
  const getCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.max(0, Math.min(Math.floor((e.clientX - rect.left) * scaleX), canvas.width)),
      y: Math.max(0, Math.min(Math.floor((e.clientY - rect.top) * scaleY), canvas.height)),
    };
  }, []);

  // ── Context setup helper ──────────────────────────────────
  const applyBrushStyle = useCallback((ctx: CanvasRenderingContext2D) => {
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.fillStyle   = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
    }
    ctx.lineWidth  = brushSize;
    ctx.lineCap    = 'round';
    ctx.lineJoin   = 'round';
    ctx.miterLimit = 1;
  }, [color, brushSize, isEraser]);

  // ── Pointer down ──────────────────────────────────────────
  const handleStart = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    const timestamp = Date.now();

    // Save snapshot BEFORE any pixels change
    pushSnapshot();

    if (onEvent) {
      if (!isEraser && isFloodFill) onEvent({ type: 'fill', x, y, timestamp });
      else if (isEraser) onEvent({ type: 'erase', x, y, timestamp });
      else onEvent({ type: 'draw', x, y, timestamp });
    }

    if (!isEraser && isFloodFill) {
      const fillColor = hexToRgb(color);
      floodFill(ctx, x, y, { fillColor, tolerance: 30 });
      return;
    }

    setIsDrawing(true);
    lastPointRef.current = { x, y };
    lastMidRef.current = null;

    // Draw a dot at the starting point
    applyBrushStyle(ctx);
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }, [getCoordinates, applyBrushStyle, isEraser, isFloodFill, color, brushSize, onEvent, pushSnapshot]);

  // ── Pointer move ──────────────────────────────────────────
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    const timestamp = Date.now();

    if (onEvent && timestamp - lastMoveEventRef.current >= MOVE_EVENT_THROTTLE_MS) {
      onEvent({ type: 'move', x, y, timestamp });
      lastMoveEventRef.current = timestamp;
    }

    const last = lastPointRef.current;
    if (!last) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Midpoint between last recorded point and current point
    const mid = { x: (last.x + x) / 2, y: (last.y + y) / 2 };

    applyBrushStyle(ctx);
    ctx.beginPath();

    // Move to the previous midpoint (or the very first point if this is the first segment)
    const startPt = lastMidRef.current ?? last;
    ctx.moveTo(startPt.x, startPt.y);

    // Quadratic Bézier: control = last cursor position, endpoint = current midpoint
    // This makes each segment curve smoothly through the last sampled point
    ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';

    lastMidRef.current   = mid;
    lastPointRef.current = { x, y };
  }, [isDrawing, getCoordinates, applyBrushStyle, onEvent]);

  // ── Pointer up / leave ────────────────────────────────────
  const handleEnd = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Flush the final tiny segment to the last actual cursor position
    const last = lastPointRef.current;
    const lastMid = lastMidRef.current;
    if (last && lastMid) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        applyBrushStyle(ctx);
        ctx.beginPath();
        ctx.moveTo(lastMid.x, lastMid.y);
        ctx.quadraticCurveTo(last.x, last.y, last.x, last.y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    setIsDrawing(false);
    lastPointRef.current = null;
    lastMidRef.current   = null;
  }, [applyBrushStyle]);

  const handleLeave = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
    lastMidRef.current   = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleLeave}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      style={{
        cursor: isEraser ? 'grab' : 'crosshair',
        display: 'block',
        backgroundColor: '#FFFFFF',
        touchAction: 'none',
      }}
    />
  );
});

export default Canvas;
