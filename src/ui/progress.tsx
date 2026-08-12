import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { chapters, totalChapters } from '../content/curriculum';

/**
 * Tracks which chapters the reader has finished, persisted in localStorage so
 * the progress bar survives refreshes. A chapter is marked done when the reader
 * reaches its end (see ChapterFrame's end sentinel).
 */

const STORAGE_KEY = 'tiny-llm-lab:progress:v1';

interface ProgressValue {
  done: Set<string>;
  isDone: (id: string) => boolean;
  markDone: (id: string) => void;
  reset: () => void;
  doneCount: number;
  total: number;
  pct: number;
}

const ProgressContext = createContext<ProgressValue | null>(null);

/** Chapter ids that currently exist, so stale saved progress can be discarded. */
const validIds = new Set(chapters.map((c) => c.id));

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return new Set();
    // Drop ids that aren't in the curriculum any more - a renamed or removed
    // chapter, or progress written by a different build on the same origin.
    // Without this the count can exceed the number of chapters ("32 / 19").
    return new Set(arr.filter((id) => validIds.has(id)));
  } catch {
    return new Set();
  }
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [done, setDone] = useState<Set<string>>(() => load());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
    } catch {
      /* storage may be unavailable (private mode) - progress just won't persist */
    }
  }, [done]);

  const markDone = useCallback((id: string) => {
    setDone((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const reset = useCallback(() => setDone(new Set()), []);

  const value = useMemo<ProgressValue>(() => {
    const doneCount = done.size;
    return {
      done,
      isDone: (id: string) => done.has(id),
      markDone,
      reset,
      doneCount,
      total: totalChapters,
      pct: Math.round((doneCount / totalChapters) * 100),
    };
  }, [done, markDone, reset]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressValue {
  const v = useContext(ProgressContext);
  if (!v) throw new Error('useProgress must be used inside <ProgressProvider>');
  return v;
}
