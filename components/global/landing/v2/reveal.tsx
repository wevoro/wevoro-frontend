'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Scroll-reveal wrapper built on the IntersectionObserver API.
 *
 * The (server-rendered) children are passed straight through and rendered
 * inside a lightweight <div> that starts hidden (`.reveal`). The first time the
 * element enters the viewport we add the `in-view` class; the CSS in
 * globals.css then transitions opacity 0->1 and translateY(24px->0) over 700ms
 * ease-out. `delay` (ms) offsets the transition to build a configurable stagger.
 *
 * - children stay server-rendered for SEO (only this thin wrapper is a client
 *   component; the content is in the initial HTML).
 * - prefers-reduced-motion is honored in CSS (content shown, no motion).
 * - degrades gracefully: if IntersectionObserver is unavailable, reveal at once.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds (applied as transition-delay). */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div
      ref={ref}
      className={cn('reveal', inView && 'in-view', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
