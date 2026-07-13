/**
 * The attention matrix as a heatmap. Each ROW is a character asking "what should
 * I pay attention to?"; each COLUMN is an earlier character it could look at.
 * A dark coral cell = strong attention. The upper triangle is blank because of
 * the causal mask — a character can't peek at the future.
 */
function glyph(ch: string): string {
  if (ch === ' ') return '␣';
  if (ch === '\n') return '⏎';
  return ch;
}

export function AttentionHeatmap({
  tokens,
  alpha,
  cell = 17,
}: {
  tokens: string[];
  alpha: number[][];
  cell?: number;
}) {
  const L = tokens.length;
  const m = 22; // label margin
  const size = m + L * cell;

  const color = (w: number) => {
    // light paper → coral by weight
    const r = Math.round(253 + w * (240 - 253));
    const g = Math.round(246 + w * (102 - 246));
    const b = Math.round(236 + w * (62 - 236));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <span className="canvas-frame" style={{ overflow: 'auto', maxWidth: '100%' }}>
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
            fontSize="10"
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
            y={m + i * cell + cell / 2 + 3.5}
            textAnchor="end"
            fontFamily="'JetBrains Mono', monospace"
            fontSize="10"
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
                rx={2}
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
