import { cn } from '@/lib/utils';

/**
 * Horizontal probability bars for a set of candidate next tokens. Tokens cut
 * out by top-p are dimmed and pushed to zero. Optional sample counts show what
 * you actually get when you roll the dice many times.
 */
export function ProbBars({
  items,
}: {
  items: { label: string; p: number; count?: number }[];
}) {
  const maxP = Math.max(0.001, ...items.map((i) => i.p));
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((it) => (
        <div
          key={it.label}
          className="grid grid-cols-[60px_1fr_82px] items-center gap-2.5 font-mono text-[0.78rem]"
        >
          <span>{it.label}</span>
          <span className="h-4 overflow-hidden rounded-md bg-muted">
            <span
              className={cn(
                'block h-full rounded-md transition-[width] duration-200',
                it.p === 0 ? 'bg-muted-foreground/40' : 'bg-primary',
              )}
              style={{ width: `${(it.p / maxP) * 100}%` }}
            />
          </span>
          <span className="text-right whitespace-nowrap text-foreground/90">
            {(it.p * 100).toFixed(0)}%
            {it.count !== undefined && <span className="text-muted-foreground"> · {it.count}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
