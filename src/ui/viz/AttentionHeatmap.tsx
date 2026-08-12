/**
 * The attention matrix as a heatmap. Each ROW is a token (word) asking "what
 * should I pay attention to?"; each COLUMN is an earlier token it could look at.
 * A dark coral cell = strong attention. The upper triangle is blank because of
 * the causal mask - a token can't peek at the future.
 *
 * Cells auto-size to fit `maxSize`; column labels are drawn on a slant so word
 * labels don't collide, and the whole thing stays inside the box.
 */
export function AttentionHeatmap({
  tokens,
  alpha,
  maxSize = 360,
}: {
  tokens: string[];
  alpha: number[][];
  maxSize?: number;
}) {
  const L = tokens.length;
  const font = 11;
  const maxLen = tokens.reduce((n, t) => Math.max(n, t.length), 1);
  const labelPx = Math.min(78, maxLen * font * 0.62); // rough label length in px
  const mL = Math.max(30, labelPx + 10); // left margin for row labels
  const mT = Math.max(26, labelPx * 0.72 + 10); // top margin for slanted col labels
  const cell = Math.max(15, Math.min(40, (maxSize - mL) / Math.max(1, L)));
  const grid = L * cell;
  const W = mL + grid + 6;
  const H = mT + grid + 6;

  const color = (w: number) => {
    const r = Math.round(253 + w * (240 - 253));
    const g = Math.round(246 + w * (102 - 246));
    const b = Math.round(236 + w * (62 - 236));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <span className="canvas-frame">
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Attention weights between words">
        {/* column labels (keys) - slanted so words don't overlap */}
        {tokens.map((t, j) => {
          const cx = mL + j * cell + cell / 2;
          const cy = mT - 5;
          return (
            <text
              key={`c${j}`}
              x={cx}
              y={cy}
              textAnchor="start"
              fontFamily="'JetBrains Mono', monospace"
              fontSize={font}
              fill="#8a7d6b"
              transform={`rotate(-45 ${cx} ${cy})`}
            >
              {t}
            </text>
          );
        })}
        {/* row labels (queries) */}
        {tokens.map((t, i) => (
          <text
            key={`r${i}`}
            x={mL - 7}
            y={mT + i * cell + cell / 2 + font / 3}
            textAnchor="end"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={font}
            fill="#8a7d6b"
          >
            {t}
          </text>
        ))}
        {/* cells */}
        {tokens.map((_, i) =>
          tokens.map((_, j) => {
            const w = j <= i ? alpha[i]?.[j] ?? 0 : -1;
            return (
              <rect
                key={`${i}-${j}`}
                x={mL + j * cell}
                y={mT + i * cell}
                width={cell - 1.5}
                height={cell - 1.5}
                rx={3}
                fill={w < 0 ? '#f7f1e6' : color(w)}
                stroke={w < 0 ? 'transparent' : '#efe4d2'}
                strokeWidth="0.5"
              />
            );
          }),
        )}
      </svg>
    </span>
  );
}
