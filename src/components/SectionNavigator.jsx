import { useEffect, useRef, useState } from 'react';

function SectionNavigator({ sections, scrollOffset = 120 }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('main');
    const observers = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        {
          root: scrollContainer ?? null,
          rootMargin: '-25% 0px -65% 0px',
          threshold: 0,
        },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const scrollContainer = el.closest('main') ?? document.querySelector('main') ?? window;
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
        {sections.map(({ id, label }) => {
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
        {sections.map(({ id, label }) => {
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
