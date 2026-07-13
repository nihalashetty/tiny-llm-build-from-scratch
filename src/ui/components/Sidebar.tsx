import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { groups } from '../../content/curriculum';
import { useProgress } from '../progress';

/**
 * The course index. Mirrors the starter design: brand, a live progress bar,
 * a search box, then collapsible module groups of chapters. Each chapter shows
 * a state mark (done / active / todo) and its reading time.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isDone, doneCount, total, pct } = useProgress();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const q = query.trim().toLowerCase();

  const shownGroups = useMemo(() => {
    return groups
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
      .filter((g) => g.chapters.length > 0);
  }, [q]);

  return (
    <aside className="sidebar">
      <NavLink to="/c/prologue" className="brand" onClick={onNavigate}>
        <div className="brand-mark">L</div>
        <div>
          <div className="brand-title">Tiny LLM Lab</div>
          <div className="brand-tag">learn&nbsp;·&nbsp;run&nbsp;·&nbsp;repeat</div>
        </div>
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search chapters…"
          aria-label="Search chapters"
        />
      </div>

      <nav className="side-nav" aria-label="Course chapters">
        {shownGroups.map((g) => {
          const open = q ? true : !collapsed[g.title];
          const groupDone = g.chapters.filter((c) => isDone(c.id)).length;
          return (
            <div className="nav-group" key={g.title}>
              <button
                className="nav-group-btn"
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
                        className={({ isActive }) =>
                          `nav-lesson${isActive ? ' active' : ''}${done ? ' done' : ''}`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className="nav-lesson-mark">
                              {isActive ? '●' : done ? '✓' : '○'}
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
      </nav>
    </aside>
  );
}
