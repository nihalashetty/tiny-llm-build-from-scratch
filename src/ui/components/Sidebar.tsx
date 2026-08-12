import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { chapters, partMeta, parts } from '../../content/curriculum';
import { useProgress } from '../progress';

/**
 * The course index: brand, a live progress bar, a search box, then the two big
 * Parts, each holding collapsible module groups of chapters.
 *
 * Two rules keep it easy to navigate:
 *   1. You can always see where you are. The part and group holding the current
 *      chapter are force-opened, and the active row is scrolled into view - so
 *      collapsing a section can never hide your own position.
 *   2. Every chapter shows its number, so the sidebar doubles as a map of the
 *      running order rather than a flat list of names.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isDone, doneCount, total, pct } = useProgress();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [partCollapsed, setPartCollapsed] = useState<Record<string, boolean>>({});
  const navRef = useRef<HTMLElement | null>(null);

  const { pathname } = useLocation();
  const activeId = pathname.startsWith('/c/') ? pathname.slice(3) : '';
  const active = chapters.find((c) => c.id === activeId);

  const q = query.trim().toLowerCase();

  // Never let a collapsed section hide the chapter you're currently reading.
  useEffect(() => {
    if (!active) return;
    setCollapsed((s) => (s[active.group] ? { ...s, [active.group]: false } : s));
    setPartCollapsed((s) => (s[active.part] ? { ...s, [active.part]: false } : s));
  }, [active?.group, active?.part, active]);

  // Keep the active row visible when you arrive by prev/next or a deep link.
  useEffect(() => {
    const el = navRef.current?.querySelector('.nav-lesson.active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeId, q]);

  // Filter chapters by the search box, dropping empty groups and empty parts.
  const shownParts = useMemo(() => {
    return parts
      .map((p) => ({
        ...p,
        groups: p.groups
          .map((g) => ({
            ...g,
            chapters: q
              ? g.chapters.filter(
                  (c) =>
                    c.title.toLowerCase().includes(q) ||
                    c.navTitle.toLowerCase().includes(q) ||
                    c.blurb.toLowerCase().includes(q),
                )
              : g.chapters,
          }))
          .filter((g) => g.chapters.length > 0),
      }))
      .filter((p) => p.groups.length > 0);
  }, [q]);

  const hitCount = useMemo(
    () => shownParts.reduce((n, p) => n + p.groups.reduce((m, g) => m + g.chapters.length, 0), 0),
    [shownParts],
  );

  return (
    <aside className="sidebar">
      <NavLink to="/c/prologue" className="brand" onClick={onNavigate}>
        <div className="brand-title">Tiny LLM Lab</div>
      </NavLink>

      <div className="progress-card">
        <div className="progress-head">
          <b>Your progress</b>
          <span>
            {doneCount} / {total}
          </span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="side-search">
        <div className="side-search-field">
          <span className="side-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters…"
            aria-label="Search chapters"
          />
          {query && (
            <button
              className="side-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        {q && (
          <div className="side-search-count">
            {hitCount} {hitCount === 1 ? 'chapter' : 'chapters'} match
          </div>
        )}
      </div>

      <nav className="side-nav" aria-label="Course chapters" ref={navRef}>
        {shownParts.map((p) => {
          const partChapters = p.groups.flatMap((g) => g.chapters);
          const partDone = partChapters.filter((c) => isDone(c.id)).length;
          const partOpen = q ? true : !partCollapsed[p.title];
          const meta = partMeta(p.title);
          const partHasActive = active?.part === p.title;
          return (
            <div className={`nav-part${partHasActive ? ' current' : ''}`} key={p.title}>
              <button
                className="nav-part-head"
                onClick={() => setPartCollapsed((s) => ({ ...s, [p.title]: partOpen }))}
                aria-expanded={partOpen}
              >
                <span className="nav-part-top">
                  <span className="nav-part-chevron" aria-hidden="true">
                    {partOpen ? '−' : '+'}
                  </span>
                  <span className="nav-part-badge">{meta.badge}</span>
                  <span className="nav-part-meta">
                    {partDone}/{partChapters.length}
                  </span>
                </span>
                <span className="nav-part-name">{meta.name}</span>
                {meta.tagline && <span className="nav-part-tagline">{meta.tagline}</span>}
              </button>

              {partOpen &&
                p.groups.map((g) => {
                  const open = q ? true : !collapsed[g.title];
                  const groupDone = g.chapters.filter((c) => isDone(c.id)).length;
                  const hasActive = g.chapters.some((c) => c.id === activeId);
                  return (
                    <div className="nav-group" key={g.title}>
                      <button
                        className={`nav-group-btn${hasActive ? ' has-active' : ''}`}
                        onClick={() => setCollapsed((s) => ({ ...s, [g.title]: open }))}
                        aria-expanded={open}
                      >
                        <span className="nav-group-label">
                          <span className="nav-chevron">{open ? '▾' : '▸'}</span>
                          <span className="nav-group-title">{g.title}</span>
                        </span>
                        <span className="nav-group-meta">
                          {groupDone}/{g.chapters.length}
                        </span>
                      </button>

                      {open && (
                        <div className="nav-lessons">
                          {g.chapters.map((c) => {
                            const done = isDone(c.id);
                            return (
                              <NavLink
                                key={c.id}
                                to={`/c/${c.id}`}
                                onClick={onNavigate}
                                title={c.blurb}
                                className={({ isActive }) =>
                                  `nav-lesson${isActive ? ' active' : ''}${done ? ' done' : ''}`
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <span className="nav-lesson-num" aria-hidden="true">
                                      {done && !isActive ? '✓' : c.index + 1}
                                    </span>
                                    <span className="nav-lesson-title">{c.navTitle}</span>
                                    <span className="nav-lesson-mins">
                                      {c.built ? `${c.minutes}m` : 'soon'}
                                    </span>
                                  </>
                                )}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}

        {q && hitCount === 0 && (
          <div className="side-nav-empty">
            No chapters match “{query}”.
            <button onClick={() => setQuery('')}>Clear search</button>
          </div>
        )}
      </nav>
    </aside>
  );
}
