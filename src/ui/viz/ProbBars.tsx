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
    <div className="probbars">
      {items.map((it) => (
        <div key={it.label} className={`probbar-row${it.p === 0 ? ' dim-out' : ''}`}>
          <span>{it.label}</span>
          <span className="probbar-track">
            <span className="probbar-fill" style={{ width: `${(it.p / maxP) * 100}%` }} />
          </span>
          <span className="plabel">
            {(it.p * 100).toFixed(0)}%
            {it.count !== undefined && <span className="pval"> · {it.count}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
