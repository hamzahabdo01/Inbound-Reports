import { useEffect, useRef, useState } from 'react';
import KPICard from './KPICard';

interface AutoScrollKPIRowProps {
  cards: any[];
  speed?: number;
}

export default function AutoScrollKPIRow({ cards, speed = 0.04 }: AutoScrollKPIRowProps) {
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [showControls, setShowControls] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const swiped = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || paused || cards.length <= 4) return;
    const half = el.scrollWidth / 2;
    let lastTime = performance.now();
    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      el.scrollLeft += speed * dt;
      if (el.scrollLeft >= half) {
        el.scrollLeft -= half;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, cards.length, speed]);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.75, 600);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const togglePause = () => {
    if (!paused) { setShowControls(true); }
    setPaused((p) => !p);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    swiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      swiped.current = true;
      if (!paused) {
        setShowControls(true);
        setPaused(true);
      }
      scrollBy(touchDeltaX.current < 0 ? 'right' : 'left');
    }
  };

  if (!cards.length) return null;

  const isOverflowing = cards.length > 4;
  const displayCards = isOverflowing ? [...cards, ...cards] : cards;

  return (
    <div className="relative">
      {isOverflowing && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-r from-[#F6FAFC] to-transparent" />
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-[#F6FAFC] to-transparent" />
        </>
      )}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onClick={togglePause}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <style>{`.askr-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {displayCards.map((c, i) => (
          <div key={`${c.label || i}-${i}`} className={`shrink-0 ${isOverflowing ? 'w-[280px]' : 'flex-1 min-w-0'}`}>
            <KPICard variant="detailed" {...c} />
          </div>
        ))}
      </div>
      {isOverflowing && paused && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollBy('left'); }}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
            aria-label="Scroll left"
          >
            <i className="fa-solid fa-chevron-left text-[9px]" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPaused(false); }}
            className="text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <i className="fa-solid fa-play mr-1" /> Resume
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollBy('right'); }}
            className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
            aria-label="Scroll right"
          >
            <i className="fa-solid fa-chevron-right text-[9px]" />
          </button>
        </div>
      )}
      {isOverflowing && !paused && (
        <div className="flex items-center justify-center mt-2">
          <span className="text-[10px] text-on-surface-variant/60 cursor-default select-none">
            Click to pause &amp; scroll
          </span>
        </div>
      )}
    </div>
  );
}
