import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function StickyHeader({ children, className = '', mobileYearTabs }: any) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const sentinelRef = useRef(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(46);

  useLayoutEffect(() => {
    if (isMobile && headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: [0] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  if (isMobile) {
    const yearTabsHeight = mobileYearTabs ? 40 : 0;
    return (
      <>
        <div className="bg-surface" style={{ height: headerHeight + yearTabsHeight }} />
        <div
          ref={headerRef}
          className={`flex flex-nowrap items-center justify-between gap-2 fixed left-0 right-0 top-[36px] z-30 bg-surface py-3 px-lg shadow-sm overflow-x-auto [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden ${className}`}
        >
          {children}
        </div>
        {mobileYearTabs && (
          <div className="fixed left-0 right-0 z-30 bg-surface border-b border-outline-variant px-lg py-2 flex gap-2 justify-center overflow-x-auto scrollbar-none"
               style={{ top: `calc(36px + ${headerHeight}px)` }}>
            {mobileYearTabs}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div ref={sentinelRef} />
      <div
        className={`flex flex-nowrap items-center justify-between gap-2 sticky top-0 z-30 bg-surface py-3 -mx-lg px-lg overflow-x-auto [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden ${className} ${
          isSticky ? 'shadow-sm' : ''
        }`}
      >
        {children}
      </div>
    </>
  );
}

export default StickyHeader;
