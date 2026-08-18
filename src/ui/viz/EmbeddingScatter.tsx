import { useCallback, useEffect, useRef, useState } from 'react';

interface Pt {
  word: string;
  x: number;
  y: number;
}

/**
 * 2D scatter of word vectors (already PCA-projected). Every word is a faint
 * dot; a curated set gets labels; the words in the current analogy get
 * highlighted, with arrows showing the "b − a" and "result − c" directions that
 * should be parallel when the analogy works.
 *
 * You can ZOOM (mouse wheel or the + / − buttons) and PAN (drag). Dots and
 * labels keep a constant size while zooming, so crowded clusters spread apart
 * and their labels become readable.
 */
export function EmbeddingScatter({
  points,
  labelWords,
  highlight = [],
  arrows = [],
  size = 340,
}: {
  points: Pt[];
  labelWords: string[];
  highlight?: { word: string; color: string }[];
  arrows?: { from: string; to: string; color: string }[];
  size?: number;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const clampK = (k: number) => Math.min(12, Math.max(1, k));

  // client px → svg user units
  const toSvg = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return [0, 0];
      return [((clientX - rect.left) / rect.width) * size, ((clientY - rect.top) / rect.height) * size];
    },
    [size],
  );

  const zoomAt = useCallback((mx: number, my: number, factor: number) => {
    setView((v) => {
      const k2 = clampK(v.k * factor);
      // keep the point under (mx,my) fixed
      const worldX = (mx - v.tx) / v.k;
      const worldY = (my - v.ty) / v.k;
      return { k: k2, tx: mx - worldX * k2, ty: my - worldY * k2 };
    });
  }, []);

  // wheel zoom (native, non-passive so we can preventDefault the page scroll)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [mx, my] = toSvg(e.clientX, e.clientY);
      zoomAt(mx, my, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [toSvg, zoomAt]);

  if (points.length === 0) return null;
  const pad = 26;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  // base fit-to-frame, then apply zoom/pan (positions only - sizes stay constant)
  const bx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (size - 2 * pad);
  const by = (y: number) => size - (pad + ((y - minY) / (maxY - minY || 1)) * (size - 2 * pad));
  const sx = (x: number) => bx(x) * view.k + view.tx;
  const sy = (y: number) => by(y) * view.k + view.ty;

  const byWord = new Map(points.map((p) => [p.word, p]));
  const labelSet = new Set(labelWords);
  const hiMap = new Map(highlight.map((h) => [h.word, h.color]));

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - drag.current.x) / rect.width) * size;
    const dy = ((e.clientY - drag.current.y) / rect.height) * size;
    setView((v) => ({ ...v, tx: drag.current!.tx + dx, ty: drag.current!.ty + dy }));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const zoomBtn = (factor: number) => zoomAt(size / 2, size / 2, factor);

  return (
    <span className="canvas-frame relative" style={{ width: size }}>
      <div className="absolute top-2 right-2 z-[2] flex flex-col gap-1">
        <button className="flex size-[26px] items-center justify-center rounded-md border bg-background/90 font-mono text-[15px] leading-none hover:border-ring" onClick={() => zoomBtn(1.3)} aria-label="Zoom in" title="Zoom in">
          +
        </button>
        <button className="flex size-[26px] items-center justify-center rounded-md border bg-background/90 font-mono text-[15px] leading-none hover:border-ring" onClick={() => zoomBtn(1 / 1.3)} aria-label="Zoom out" title="Zoom out">
          −
        </button>
        <button
          className="flex size-[26px] items-center justify-center rounded-md border bg-background/90 font-mono text-[15px] leading-none hover:border-ring"
          onClick={() => setView({ k: 1, tx: 0, ty: 0 })}
          aria-label="Reset zoom"
          title="Reset"
        >
          ⤢
        </button>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Word vectors in 2D (scroll to zoom, drag to pan)"
        style={{ cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
      >
        <defs>
          <marker id="scatter-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#79808e" />
          </marker>
          <clipPath id="scatter-clip">
            <rect x="0" y="0" width={size} height={size} rx="10" />
          </clipPath>
        </defs>

        <g clipPath="url(#scatter-clip)">
          {/* every word: a faint dot */}
          {points.map((p) => {
            const hi = hiMap.get(p.word);
            const labeled = labelSet.has(p.word) || hi;
            return (
              <g key={p.word}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={hi ? 5 : 3} fill={hi ?? (labeled ? '#79808e' : '#cbd1da')} />
                {labeled && (
                  <text
                    x={sx(p.x) + 7}
                    y={sy(p.y) + 3.5}
                    fontFamily="'Geist Mono', monospace"
                    fontSize={hi ? 12 : 10.5}
                    fontWeight={hi ? 700 : 400}
                    fill={hi ?? '#3c414b'}
                  >
                    {p.word}
                  </text>
                )}
              </g>
            );
          })}

          {/* analogy arrows */}
          {arrows.map((a, i) => {
            const f = byWord.get(a.from);
            const t = byWord.get(a.to);
            if (!f || !t) return null;
            return (
              <line
                key={i}
                x1={sx(f.x)}
                y1={sy(f.y)}
                x2={sx(t.x)}
                y2={sy(t.y)}
                stroke={a.color}
                strokeWidth="2"
                strokeDasharray="4 3"
                markerEnd="url(#scatter-arrow)"
                opacity="0.85"
              />
            );
          })}
        </g>
      </svg>
      <div className="pointer-events-none absolute bottom-1.5 left-2.5 font-mono text-[0.66rem] text-muted-foreground">
        scroll to zoom · drag to pan
      </div>
    </span>
  );
}
