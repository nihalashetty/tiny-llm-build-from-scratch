import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { chapterById, neighbors, totalChapters } from '../../content/curriculum';
import { useProgress } from '../progress';
import { buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Shared shell for a chapter page: breadcrumb, title block, the story content,
 * and the prev/next footer. It also marks the chapter "done" once the reader
 * scrolls to the end sentinel - that's what drives the sidebar progress bar.
 */
export function ChapterFrame({ id, children }: { id: string; children: ReactNode }) {
  const ch = chapterById(id)!;
  const { prev, next } = neighbors(id);
  const { markDone } = useProgress();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) markDone(id);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, markDone]);

  return (
    <div className="mx-auto max-w-[1080px] px-5 pt-16 pb-28 sm:px-13 lg:pt-10">
      <div className="mb-7 flex items-center justify-between gap-4">
        {/* One quiet line. The chapter title lives in the h1 below, so it is
            deliberately not repeated here - and neither is the group, which
            used to appear a third time as an "eyebrow" above the title. */}
        <nav
          className="flex min-w-0 flex-wrap items-center gap-2 text-[0.78rem] text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <span>{ch.part.split(':')[0]}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground/80">{ch.group}</span>
        </nav>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={prev ? `/c/${prev.id}` : '#'}
                aria-disabled={!prev}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'icon' }),
                  !prev && 'pointer-events-none opacity-40',
                )}
              >
                <ArrowLeft />
              </Link>
            </TooltipTrigger>
            <TooltipContent>{prev ? `Previous: ${prev.navTitle}` : 'Start of course'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={next ? `/c/${next.id}` : '#'}
                aria-disabled={!next}
                onClick={() => markDone(id)}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'icon' }),
                  !next && 'pointer-events-none opacity-40',
                )}
              >
                <ArrowRight />
              </Link>
            </TooltipTrigger>
            <TooltipContent>{next ? `Next: ${next.navTitle}` : 'End of course'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <h1 className="mb-3.5 text-[2.5rem] leading-[1.1] font-semibold tracking-tight text-balance">
        {ch.title}
      </h1>
      <div className="mb-9 flex flex-wrap items-center gap-2.5 text-[0.8rem] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" /> {ch.minutes} min read
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span>
          Chapter {ch.index + 1} of {totalChapters}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span>Beginner friendly</span>
      </div>

      <div className="reading-body">{children}</div>

      <div ref={endRef} aria-hidden="true" />

      <div className="mt-14 grid grid-cols-1 gap-3.5 border-t pt-7 sm:grid-cols-2">
        <Link
          to={prev ? `/c/${prev.id}` : '#'}
          className={prev ? '' : 'pointer-events-none opacity-45'}
        >
          <Card className="gap-1 px-4 py-3.5 transition-colors hover:border-ring">
            <div className="font-mono text-[0.66rem] tracking-widest text-muted-foreground">
              ← PREVIOUS
            </div>
            <div className="font-semibold">{prev ? prev.navTitle : 'Start of course'}</div>
          </Card>
        </Link>
        <Link
          to={next ? `/c/${next.id}` : '#'}
          className={next ? '' : 'pointer-events-none opacity-45'}
          onClick={() => markDone(id)}
        >
          <Card className="items-end gap-1 px-4 py-3.5 text-right transition-colors hover:border-ring">
            <div className="font-mono text-[0.66rem] tracking-widest text-muted-foreground">
              NEXT →
            </div>
            <div className="font-semibold">{next ? next.navTitle : "You've reached the end"}</div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
