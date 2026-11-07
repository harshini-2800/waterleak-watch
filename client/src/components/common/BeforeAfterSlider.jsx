import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function BeforeAfterSlider({ beforeUrl, afterUrl, className = '' }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const onMouseDown = () => { isDragging.current = true; };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  const onTouchMove = (e) => {
    if (e.touches.length > 0) handleMove(e.touches[0].clientX);
  };

  if (!beforeUrl && !afterUrl) {
    return (
      <div className="w-full h-48 rounded-xl bg-slate-800/40 flex items-center justify-center text-slate-400 text-sm">
        No photographic evidence provided.
      </div>
    );
  }

  // If only one photo exists, display single view
  if (!afterUrl || !beforeUrl) {
    const singlePhoto = beforeUrl || afterUrl;
    return (
      <div className={`relative rounded-2xl overflow-hidden glass-panel aspect-video max-h-96 ${className}`}>
        <img
          src={singlePhoto}
          alt="Leak photographic record"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-background-deep/80 backdrop-blur-md text-white border border-white/10">
          {beforeUrl ? 'Reported Leak Photo' : 'After Repair Verification Photo'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      className={`relative rounded-2xl overflow-hidden select-none cursor-ew-resize glass-panel aspect-video max-h-96 ${className}`}
    >
      {/* After Photo (Background / Right side) */}
      <img
        src={afterUrl}
        alt="After resolution repair"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/80 backdrop-blur-md text-white flex items-center gap-1.5 shadow-lg">
        <Sparkles className="w-3.5 h-3.5" />
        Repaired
      </div>

      {/* Before Photo (Foreground / Left side, clipped) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={beforeUrl}
          alt="Initial leak report"
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
        />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600/80 backdrop-blur-md text-white flex items-center gap-1.5 shadow-lg">
          <AlertCircle className="w-3.5 h-3.5" />
          Initial Leak
        </div>
      </div>

      {/* Divider line and handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(34,211,238,0.8)] cursor-ew-resize"
        style={{ left: `calc(${sliderPos}% - 2px)` }}
        onMouseDown={onMouseDown}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary-aqua text-background-deep font-bold flex items-center justify-center shadow-lg border-2 border-white text-xs">
          ↔
        </div>
      </div>
    </div>
  );
}

