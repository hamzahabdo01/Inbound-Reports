import React, { useState, useEffect, useRef } from 'react';

interface KpiCarouselProps {
  children: React.ReactNode;
}

export default function KpiCarousel({ children }: KpiCarouselProps) {
  const items = React.Children.toArray(children);
  const [page, setPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(() =>
    window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1,
  );
  const totalPages = Math.ceil(items.length / cardsPerPage);

  useEffect(() => {
    const onResize = () => {
      const next = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1;
      setCardsPerPage((prev) => {
        if (prev !== next) setPage(0);
        return next;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { if (page >= totalPages) setPage(0); }, [totalPages, page]);

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; };
  const handleTouchMove = (e: React.TouchEvent) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; };
  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 50) {
      if (touchDeltaX.current < 0 && page < totalPages - 1) setPage((p) => p + 1);
      else if (touchDeltaX.current > 0 && page > 0) setPage((p) => p - 1);
    }
  };

  const lgCols = items.length >= 4 ? 'lg:grid-cols-4' : items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';
  const gridCls = `grid grid-cols-1 sm:grid-cols-2 ${lgCols} gap-3 sm:gap-4`;

  if (totalPages <= 1) {
    return (
      <div className={`${gridCls} mb-5 sm:mb-6`}>{items}</div>
    );
  }

  return (
    <div className="space-y-3 mb-5 sm:mb-6">
      <div
        className="relative overflow-hidden w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pageIdx) => (
              <div key={pageIdx} className={`${gridCls} w-full shrink-0`}>
                {items.slice(pageIdx * cardsPerPage, pageIdx * cardsPerPage + cardsPerPage)}
              </div>
            ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === page ? 'bg-primary w-5' : 'bg-outline-variant hover:bg-outline'}`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
        {cardsPerPage <= 2 && (
          <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/50 font-semibold tracking-wider animate-pulse">
            <i className="fa-solid fa-chevron-left text-[8px]" /> SWIPE <i className="fa-solid fa-chevron-right text-[8px]" />
          </div>
        )}
      </div>
    </div>
  );
}
