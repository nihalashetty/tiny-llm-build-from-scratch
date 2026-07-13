/**
 * The attention matrix as a heatmap. Each ROW is a character asking "what should
 * I pay attention to?"; each COLUMN is an earlier character it could look at.
 * A dark coral cell = strong attention. The upper triangle is blank because of
 * the causal mask — a character can't peek at the future.
 *
 * Cells auto-size to fit `maxSize`, so however much text you type, the whole
 * matrix stays inside the box (cells just get smaller) instead of spilling out.
 */
function glyph(ch: string): string {
  if (ch === ' ') return '␣';
  if (ch === '\n') return '⏎';
  return ch;
}

export function AttentionHeatmap({
  tokens,
  alpha,
  maxSize = 300,
}: {
  tokens: string[];
  alpha: number[][];
  maxSize?: number;
}) {
  const L = tokens.length;
  const m = 22; // label margin
  // shrink cells to fit the frame; clamp so short strings aren't giant
  const cell = Math.max(7, Math.min(20, (maxSize - m) / Math.max(1, L)));
  const size = m + L * cell;
  const font = Math.max(6, Math.min(11, cell * 0.62));

  const color = (w: number) => {
    // light paper → coral by weight
    const r = Math.round(253 + w * (240 - 253));
    const g = Math.round(246 + w * (102 - 246));
    const b = Math.round(236 + w * (62 - 236));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <span className="canvas-frame">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Attention weights between characters"
      >
        {/* column labels (keys) */}
        {tokens.map((t, j) => (
          <text
            key={`c${j}`}
            x={m + j * cell + cell / 2}
            y={m - 7}
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={font}
            fill="#a2917a"
          >
            {glyph(t)}
          </text>
        ))}
        {/* row labels (queries) */}
        {tokens.map((t, i) => (
          <text
            key={`r${i}`}
            x={m - 7}
            y={m + i * cell + cell / 2 + font / 3}
            textAnchor="end"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={font}
            fill="#a2917a"
          >
            {glyph(t)}
          </text>
        ))}
        {/* cells */}
        {tokens.map((_, i) =>
          tokens.map((_, j) => {
            const w = j <= i ? alpha[i]?.[j] ?? 0 : -1;
            return (
              <rect
                key={`${i}-${j}`}
                x={m + j * cell}
                y={m + i * cell}
                width={cell - 1}
                height={cell - 1}
                rx={cell > 12 ? 2 : 1}
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
