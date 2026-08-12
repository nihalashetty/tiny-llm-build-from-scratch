import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { chapterById, neighbors, totalChapters } from '../../content/curriculum';
import { useProgress } from '../progress';

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
    <div className="reading-inner">
      <div className="topbar">
        {/* One quiet line. The chapter title lives in the h1 below, so it is
            deliberately not repeated here - and neither is the group, which
            used to appear a third time as an "eyebrow" above the title. */}
        <nav className="crumb" aria-label="Breadcrumb">
          <span className="crumb-part">{ch.part.split(':')[0]}</span>
          <span className="sep">/</span>
          <span className="crumb-group">{ch.group}</span>
        </nav>
        <div className="nav-arrows">
          <Link
            to={prev ? `/c/${prev.id}` : '#'}
            className="icon-btn"
            aria-disabled={!prev}
            title={prev ? `Previous: ${prev.navTitle}` : 'Start of course'}
          >
            ←
          </Link>
          <Link
            to={next ? `/c/${next.id}` : '#'}
            className="icon-btn"
            aria-disabled={!next}
            title={next ? `Next: ${next.navTitle}` : 'End of course'}
            onClick={() => markDone(id)}
          >
            →
          </Link>
        </div>
      </div>

      <h1>{ch.title}</h1>
      <div className="meta-row">
        <span>⏱ {ch.minutes} min read</span>
        <span className="dot">·</span>
        <span>
          Chapter {ch.index + 1} of {totalChapters}
        </span>
        <span className="dot">·</span>
        <span>Beginner friendly</span>
      </div>

      {children}

      <div ref={endRef} aria-hidden="true" />

      <div className="nextprev">
        <Link
          to={prev ? `/c/${prev.id}` : '#'}
          className={`prev${prev ? '' : ' disabled'}`}
        >
          <div className="kicker">← PREVIOUS</div>
          <div className="label">{prev ? prev.navTitle : 'Start of course'}</div>
        </Link>
        <Link
          to={next ? `/c/${next.id}` : '#'}
          className={`next${next ? '' : ' disabled'}`}
          onClick={() => markDone(id)}
        >
          <div className="kicker">NEXT →</div>
          <div className="label">{next ? next.navTitle : "You've reached the end"}</div>
        </Link>
      </div>
    </div>
  );
}
