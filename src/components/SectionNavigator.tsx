import { useEffect, useRef, useState } from 'react';

function SectionNavigator({ sections, scrollOffset = 120 }: any) {
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [expanded, setExpanded] = useState(false);
  const [mergedSections, setMergedSections] = useState(sections);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Fallback initialize
  useEffect(() => {
    setMergedSections(sections);
  }, [sections]);

  // Dynamically group sections that are on the same vertical line
  useEffect(() => {
    const timer = setTimeout(() => {
      const groups = [];
      sections.forEach(({ id, label }) => {
        const el = document.getElementById(id);
        if (!el) return;
        
        const rect = el.getBoundingClientRect();
        
        // Find if there is an existing group where the vertical difference is small (on the same line)
        const matchedGroup = groups.find(g => Math.abs(g.top - rect.top) < 25);
        
        if (matchedGroup) {
          matchedGroup.ids.push(id);
          matchedGroup.labels.push(label);
        } else {
          groups.push({
            top: rect.top,
            ids: [id],
            labels: [label]
          });
        }
      });
      
      const newSections = groups.map(g => ({
        id: g.ids[0],
        ids: g.ids,
        label: g.labels.join(' & ')
      }));
      
      setMergedSections(newSections);
    }, 200);

    return () => clearTimeout(timer);
  }, [sections]);

  useEffect(() => {
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        // Pick the one closest to the top of the viewport
        const best = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = best.target.id;
        const group = mergedSections.find((g) => g.ids && g.ids.includes(id));
        setActive(group ? group.id : id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean);
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [sections, mergedSections]);

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const scrollContainer = el.closest('main') ?? document.querySelector('main') ?? window;

    // Set scrolling flag to prevent IntersectionObserver and scroll listener overrides
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);

    const offset = scrollOffset;
    if (scrollContainer === window) {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      const container = scrollContainer as HTMLElement;
      const containerTop = container.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const top = container.scrollTop + (elTop - containerTop) - offset;
      container.scrollTo({ top, behavior: 'smooth' });
    }
    setActive(id);
    setTimeout(() => {
      const target = el.querySelector('.bg-white, [class*="bg-white"]') ?? el;
      target.classList.add('section-highlight');
      setTimeout(() => target.classList.remove('section-highlight'), 1650);
    }, 250);
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-stretch">
      <div
        className={`flex flex-col gap-0.5 py-3 bg-primary border border-[#00373B] border-r-0 rounded-l-xl shadow-[0px_12px_32px_rgba(10,50,53,0.18)] transition-all duration-200 overflow-hidden ${
          expanded ? 'opacity-100 w-48 px-3' : 'opacity-0 w-0 px-0'
        }`}
        aria-hidden={!expanded}
      >
        {sections.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => { handleClick(id); setExpanded(false); }}
              className={`flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span
                className={`shrink-0 rounded-full transition-all duration-200 ${
                  isActive ? 'w-2 h-2 bg-white' : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-6 flex items-center justify-center bg-primary border border-[#00373B] border-l-0 rounded-l-xl shadow-lg text-white hover:brightness-110 transition-all shrink-0"
        aria-label={expanded ? 'Close section navigation' : 'Open section navigation'}
      >
        <i className={`fa-solid fa-chevron-left text-[10px] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}

export default SectionNavigator;
