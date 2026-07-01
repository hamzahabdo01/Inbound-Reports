import { useEffect, useRef, useState } from 'react';

function SectionNavigator({ sections, scrollOffset = 120 }) {
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
    const scrollContainer = document.querySelector('main');
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;
      
      const containerRect = scrollContainer.getBoundingClientRect();
      const referenceLine = 150; // px from the top of the container
      
      // If we scroll to the absolute bottom of the container, highlight the last section
      const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 25;
      if (isAtBottom && mergedSections.length > 0) {
        setActive(mergedSections[mergedSections.length - 1].id);
        return;
      }

      let currentActiveId = null;

      // Find the section that currently wraps the reference line
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        
        const rect = el.getBoundingClientRect();
        const relativeTop = rect.top - containerRect.top;
        const relativeBottom = rect.bottom - containerRect.top;
        
        if (relativeTop <= referenceLine && relativeBottom > referenceLine) {
          currentActiveId = section.id;
          break;
        }
      }

      // If we found an active section, update it to its merged group representative
      if (currentActiveId) {
        const group = mergedSections.find(g => g.ids && g.ids.includes(currentActiveId));
        setActive(group ? group.id : currentActiveId);
      }
    };

    // Run once initially and listen to scrolls
    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
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
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const top = scrollContainer.scrollTop + (elTop - containerTop) - offset;
      scrollContainer.scrollTo({ top, behavior: 'smooth' });
    }
    setActive(id);
    setTimeout(() => {
      const target = el.querySelector('.bg-white, [class*="bg-white"]') ?? el;
      target.classList.add('section-highlight');
      setTimeout(() => target.classList.remove('section-highlight'), 1650);
    }, 250);
  };

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-stretch"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`flex flex-col gap-0.5 py-3 bg-[#0B4F54] border border-[#00373B] rounded-l-xl shadow-[0px_12px_32px_rgba(10,50,53,0.18)] transition-all duration-200 overflow-hidden ${
          expanded ? 'opacity-100 w-48 px-3' : 'opacity-0 w-0 px-0'
        }`}
        aria-hidden={!expanded}
      >
        {mergedSections.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClick(id)}
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

      <div className="flex flex-col gap-2 py-3 px-2 bg-[#0B4F54] border border-[#00373B] rounded-l-xl shadow-[0px_4px_20px_rgba(10,50,53,0.12)]">
        {mergedSections.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleClick(id)}
              aria-label={`Go to ${label}`}
              title={label}
              className="flex items-center justify-center w-4 h-4"
            >
              <span
                className={`rounded-full transition-all duration-200 ${
                  isActive
                    ? 'w-2.5 h-2.5 bg-white shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/70'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SectionNavigator;
