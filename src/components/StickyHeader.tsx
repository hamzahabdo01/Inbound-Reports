import { useEffect, useRef, useState } from 'react';

function StickyHeader({ children, className = '' }: any) {
  const sentinelRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: [0] }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} />
      <div
        className={`flex flex-wrap items-center justify-between gap-2 sticky top-0 z-30 bg-surface py-3 -mx-lg px-lg ${className}`}
      >
        {children}
      </div>
    </>
  );
}

export default StickyHeader;
