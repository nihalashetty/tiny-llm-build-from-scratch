import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';
import { chapters, partMeta, parts } from '../../content/curriculum';
import { useProgress } from '../progress';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
export function Sidebar({ open, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
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
    const el = navRef.current?.querySelector('[aria-current="page"]');
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
    <aside
      className={cn(
        'flex h-screen w-[312px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground',
        'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:transition-transform max-lg:duration-300',
        open ? 'max-lg:translate-x-0 max-lg:shadow-xl' : 'max-lg:-translate-x-full',
      )}
    >
      <NavLink to="/c/prologue" className="flex items-center px-5 pt-5.5 pb-4" onClick={onNavigate}>
        <div className="text-lg leading-tight font-bold tracking-tight">Tiny LLM Lab</div>
      </NavLink>

      <div className="mx-4 mb-3 rounded-lg border bg-background p-3.5">
        <div className="mb-2.5 flex items-center justify-between text-[0.8rem]">
          <b className="font-bold">Your progress</b>
          <span className="font-mono text-xs text-muted-foreground">
            {doneCount} / {total}
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chapters…"
            aria-label="Search chapters"
            className="pl-8"
          />
          {query && (
            <button
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {q && (
          <div className="px-0.5 pt-1.5 font-mono text-[0.66rem] text-muted-foreground">
            {hitCount} {hitCount === 1 ? 'chapter' : 'chapters'} match
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="px-3 pt-0.5 pb-7" aria-label="Course chapters" ref={navRef}>
          {shownParts.map((p, pi) => {
            const partChapters = p.groups.flatMap((g) => g.chapters);
            const partDone = partChapters.filter((c) => isDone(c.id)).length;
            const partOpen = q ? true : !partCollapsed[p.title];
            const meta = partMeta(p.title);
            const partHasActive = active?.part === p.title;
            return (
              <div
                className={cn('mb-2.5', pi > 0 && 'mt-3.5 border-t pt-4')}
                key={p.title}
              >
                <button
                  className="flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-sidebar-accent"
                  onClick={() => setPartCollapsed((s) => ({ ...s, [p.title]: partOpen }))}
                  aria-expanded={partOpen}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex size-[17px] flex-none items-center justify-center rounded border bg-background font-mono text-[13px] leading-none font-bold text-muted-foreground',
                        partHasActive && 'border-primary text-primary',
                      )}
                      aria-hidden="true"
                    >
                      {partOpen ? '−' : '+'}
                    </span>
                    <span
                      className={cn(
                        'rounded border bg-secondary px-1.5 py-0.5 font-mono text-[0.6rem] font-bold tracking-wider text-muted-foreground uppercase',
                        partHasActive && 'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {meta.badge}
                    </span>
                    <span className="ml-auto font-mono text-[0.6rem] text-muted-foreground">
                      {partDone}/{partChapters.length}
                    </span>
                  </span>
                  <span className="pl-6 text-[1rem] leading-tight font-bold tracking-tight">
                    {meta.name}
                  </span>
                  {meta.tagline && (
                    <span className="pl-6 text-[0.72rem] leading-snug text-muted-foreground">
                      {meta.tagline}
                    </span>
                  )}
                </button>

                {partOpen &&
                  p.groups.map((g) => {
                    const groupOpen = q ? true : !collapsed[g.title];
                    const groupDone = g.chapters.filter((c) => isDone(c.id)).length;
                    const hasActive = g.chapters.some((c) => c.id === activeId);
                    return (
                      <div className="mb-1" key={g.title}>
                        <button
                          className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left hover:bg-sidebar-accent"
                          onClick={() => setCollapsed((s) => ({ ...s, [g.title]: groupOpen }))}
                          aria-expanded={groupOpen}
                        >
                          <span className="flex items-center gap-2.5">
                            <ChevronRight
                              className={cn(
                                'size-3 text-muted-foreground transition-transform',
                                groupOpen && 'rotate-90',
                              )}
                            />
                            <span
                              className={cn(
                                'text-[0.8rem] font-semibold',
                                hasActive && 'text-foreground',
                              )}
                            >
                              {g.title}
                            </span>
                          </span>
                          <span className="font-mono text-[0.62rem] text-muted-foreground">
                            {groupDone}/{g.chapters.length}
                          </span>
                        </button>

                        {groupOpen && (
                          <div className="ml-[19px] flex flex-col gap-px border-l py-1">
                            {g.chapters.map((c) => {
                              const done = isDone(c.id);
                              return (
                                <NavLink
                                  key={c.id}
                                  to={`/c/${c.id}`}
                                  onClick={onNavigate}
                                  title={c.blurb}
                                  className={({ isActive }) =>
                                    cn(
                                      '-ml-px flex items-center gap-2.5 rounded-r-md border-l-2 border-transparent py-1.5 pr-2.5 pl-2 text-[0.8rem] font-medium text-foreground/80 hover:bg-sidebar-accent hover:text-foreground',
                                      done && !isActive && 'text-muted-foreground',
                                      isActive && 'border-primary bg-muted font-semibold text-foreground',
                                    )
                                  }
                                >
                                  {({ isActive }) => (
                                    <>
                                      <span
                                        className={cn(
                                          'flex size-[19px] flex-none items-center justify-center rounded-full font-mono text-[10px]',
                                          isActive
                                            ? 'bg-primary font-bold text-primary-foreground'
                                            : done
                                              ? 'bg-secondary text-emerald-600'
                                              : 'bg-secondary text-muted-foreground',
                                        )}
                                        aria-hidden="true"
                                      >
                                        {done && !isActive ? '✓' : c.index + 1}
                                      </span>
                                      <span className="flex-1 leading-tight">{c.navTitle}</span>
                                      <span className="font-mono text-[10px] text-muted-foreground/70">
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
            <div className="px-3 py-4 text-[0.8rem] leading-relaxed text-muted-foreground">
              No chapters match “{query}”.
              <Button
                variant="outline"
                size="sm"
                className="mt-2 flex"
                onClick={() => setQuery('')}
              >
                Clear search
              </Button>
            </div>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}
