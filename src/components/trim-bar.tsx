'use client';

import {useRef} from 'react';

interface TrimBarProps {
  duration: number;
  currentTime: number;
  start: number;
  end: number;
  onStartChange: (t: number) => void;
  onEndChange: (t: number) => void;
}

function formatTick(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${s}`;
}

function getTickIntervals(duration: number): { minor: number; major: number } {
  if (duration < 120) return {minor: 5, major: 30};
  if (duration < 600) return {minor: 15, major: 60};
  if (duration < 1800) return {minor: 30, major: 120};
  return {minor: 60, major: 300};
}

export function TrimBar({duration, currentTime, start, end, onStartChange, onEndChange}: TrimBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (duration <= 0) return null;

  const getTrackTime = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration));
  };

  const startPct = (start / duration) * 100;
  const endPct = (end / duration) * 100;
  const currentPct = Math.min(100, (currentTime / duration) * 100);

  const {minor, major} = getTickIntervals(duration);
  const ticks: { t: number; isMajor: boolean }[] = [];
  for (let t = 0; t <= duration; t += minor) {
    ticks.push({t, isMajor: t % major === 0});
  }

  return (
    <div className="select-none">
      <div
        ref={trackRef}
        className="relative h-4 bg-muted rounded cursor-crosshair mt-5"
      >
        {/* Selected region */}
        <div
          className="absolute top-0 h-full bg-cyan-500/20 border-y border-cyan-500/50 pointer-events-auto"
          style={{left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%`}}
        />

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-px bg-white pointer-events-auto z-20 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
          style={{left: `${currentPct}%`}}
        />

        {/* Start handle — green grab bar with balloon */}
        <div
          className="absolute top-0 z-30 h-full w-4 -translate-x-1/2 cursor-ew-resize touch-none group"
          style={{left: `${startPct}%`}}
          onPointerDown={e => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            onStartChange(getTrackTime(e.clientX));
          }}
          onPointerUp={e => e.currentTarget.releasePointerCapture(e.pointerId)}
        >
          <div className="mx-auto h-full w-1 rounded-full bg-emerald-500 shadow-md transition-transform group-hover:scale-x-150"/>
          {/* balloon: circle + tiny downward triangle */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-md transition-transform group-hover:scale-110"/>
            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-4 border-l-transparent border-r-transparent border-t-emerald-500"/>
          </div>
        </div>

        {/* End handle — red grab bar with balloon */}
        <div
          className="absolute top-0 z-30 h-full w-4 -translate-x-1/2 cursor-ew-resize touch-none group"
          style={{left: `${endPct}%`}}
          onPointerDown={e => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={e => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            onEndChange(Math.max(getTrackTime(e.clientX), start + 0.5));
          }}
          onPointerUp={e => e.currentTarget.releasePointerCapture(e.pointerId)}
        >
          <div className="mx-auto h-full w-1 rounded-full bg-rose-500 shadow-md transition-transform group-hover:scale-x-150"/>
          {/* balloon: circle + tiny downward triangle */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto">
            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-md transition-transform group-hover:scale-110"/>
            <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-4 border-l-transparent border-r-transparent border-t-rose-500"/>
          </div>
        </div>
      </div>

      {/* Tick marks */}
      <div className="relative h-7 mt-1 overflow-hidden">
        {ticks.map(({t, isMajor}) => {
          const pct = (t / duration) * 100;
          if (pct > 99.5) return null;
          return (
            <div
              key={t}
              className="absolute top-0 flex flex-col items-center pointer-events-auto"
              style={{left: `${pct}%`, transform: 'translateX(-50%)'}}
            >
              <div className={`w-px ${isMajor ? 'h-2.5 bg-foreground/30' : 'h-1.5 bg-foreground/15'}`}/>
              {isMajor && (
                <span className="text-[9px] text-muted-foreground/60 mt-0.5 whitespace-nowrap tabular-nums">
                  {formatTick(t)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
