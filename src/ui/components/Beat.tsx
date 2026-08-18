import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A "story beat": fades/slides its content in the first time it scrolls into
 * view. This is what makes the page feel like a narrative unfolding rather than
 * a static document. Respects prefers-reduced-motion (global rule in index.css).
 */
export function Beat({
  children,
  as: Tag = 'div',
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
