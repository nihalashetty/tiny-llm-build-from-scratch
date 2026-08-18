import { useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';

// An ILLUSTRATIVE power-law: test loss falls fast at first, then with diminishing
// returns, toward an irreducible floor (the entropy of language itself). The
// exact numbers aren't a real model's - the *shape* is the point.
const L_FLOOR = 1.6;
const loss = (s: number) => L_FLOOR + 3.6 * Math.pow(0.045, s);

const ERAS = [
  { s: 0.03, label: 'your toy SLM' },
  { s: 0.36, label: 'GPT-2 · 2019' },
  { s: 0.62, label: 'GPT-3 · 2020' },
  { s: 0.9, label: 'frontier' },
];

function ScalingLab() {
  const [s, setS] = useState(0.03);

  const W = 460;
  const H = 250;
  const pad = { l: 44, r: 16, t: 16, b: 40 };
  const w = W - pad.l - pad.r;
  const h = H - pad.t - pad.b;
  const yMin = 1.5;
  const yMax = 5.4;
  const X = (ss: number) => pad.l + ss * w;
  const Y = (l: number) => pad.t + h - ((l - yMin) / (yMax - yMin)) * h;

  const curve = Array.from({ length: 81 }, (_, i) => {
    const ss = i / 80;
    return `${X(ss).toFixed(1)},${Y(loss(ss)).toFixed(1)}`;
  }).join(' ');

  const cur = loss(s);
  const nearest = ERAS.reduce((a, b) => (Math.abs(b.s - s) < Math.abs(a.s - s) ? b : a));

  return (
    <div className="lab">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Test loss falling as scale grows (a power law)">
        <rect x={pad.l} y={pad.t} width={w} height={h} fill="#fff" stroke="#e2e5ea" />

        {/* irreducible floor */}
        <line x1={pad.l} y1={Y(L_FLOOR)} x2={pad.l + w} y2={Y(L_FLOOR)} stroke="#b7a98f" strokeWidth="1.2" strokeDasharray="4 3" />
        <text x={pad.l + w - 4} y={Y(L_FLOOR) + 13} textAnchor="end" fontFamily="'Geist Mono', monospace" fontSize="9" fill="#9c8d76">
          irreducible floor - the entropy of language itself
        </text>

        {/* the power-law curve */}
        <polyline points={curve} fill="none" stroke="#e0553a" strokeWidth="2.5" />

        {/* era markers */}
        {ERAS.map((e) => (
          <g key={e.label}>
            <circle cx={X(e.s)} cy={Y(loss(e.s))} r={3} fill="#b6bcc6" />
            <text
              x={X(e.s)}
              y={Y(loss(e.s)) - 8}
              textAnchor="middle"
              fontFamily="'Geist Mono', monospace"
              fontSize="8.5"
              fill="#79808e"
            >
              {e.label}
            </text>
          </g>
        ))}

        {/* the slider marker */}
        <line x1={X(s)} y1={pad.t} x2={X(s)} y2={pad.t + h} stroke="#3e6ff0" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={X(s)} cy={Y(cur)} r={6} fill="#3e6ff0" stroke="#fff" strokeWidth="2" />

        {/* axis labels */}
        <text x={pad.l + w / 2} y={H - 6} textAnchor="middle" fontFamily="'Geist', sans-serif" fontSize="11" fill="#656c7a">
          parameters × data × compute (log scale) →
        </text>
        <text
          x={14}
          y={pad.t + h / 2}
          textAnchor="middle"
          fontFamily="'Geist', sans-serif"
          fontSize="11"
          fill="#656c7a"
          transform={`rotate(-90 14 ${pad.t + h / 2})`}
        >
          test loss →
        </text>
      </svg>

      <div className="my-2 flex items-center gap-3">
        <label className="min-w-[130px] font-mono text-xs text-foreground/90">scale</label>
        <input type="range" min={0} max={1} step={0.01} value={s} onChange={(e) => setS(+e.target.value)} className="flex-1 accent-primary" />
        <span className="min-w-[46px] text-right font-mono text-xs text-foreground">{nearest.label}</span>
      </div>
      <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        Drag <b>scale</b> to grow the model, its training data, and the compute all at
        once. Loss falls along a smooth <strong>power law</strong> - huge gains early,
        then diminishing returns as it approaches the floor. It never reaches zero:
        some of language is genuinely unpredictable, and that leftover is the{' '}
        <em>irreducible</em> loss.
      </div>
    </div>
  );
}

function DialsDiagram() {
  const dials = [
    { t: 'Parameters', s: 'the model’s size - how many weights it can adjust', c: '#e0553a' },
    { t: 'Data', s: 'how many tokens of text it learns from', c: '#10866a' },
    { t: 'Compute', s: 'how much number-crunching you spend training', c: '#3e6ff0' },
  ];
  const W = 620;
  const bw = 184;
  const gap = (W - bw * 3) / 2;
  return (
    <svg viewBox={`0 0 ${W} 120`} width="100%" role="img" aria-label="The three dials of scale: parameters, data, compute">
      {dials.map((d, i) => {
        const x = i * (bw + gap);
        return (
          <g key={d.t}>
            <rect x={x} y={22} width={bw} height={74} rx={14} fill="#fff" stroke={d.c} strokeWidth="1.5" />
            <text x={x + bw / 2} y={50} textAnchor="middle" fontFamily="'Geist', sans-serif" fontWeight="800" fontSize="16" fill={d.c}>
              {d.t}
            </text>
            <foreignObject x={x + 10} y={58} width={bw - 20} height={34}>
              <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 10.5, color: '#656c7a', lineHeight: 1.25, textAlign: 'center' }}>
                {d.s}
              </div>
            </foreignObject>
            {i < dials.length - 1 && (
              <text x={x + bw + gap / 2} y={64} textAnchor="middle" fontSize="20" fill="#b6bcc6">
                ×
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function ChapterScaling() {
  return (
    <ChapterFrame id="scaling">
      <Beat as="p" className="lead">
        Your tiny model works - but it overfits a few hundred words and forgets a
        thought halfway through. The leap from <em>that</em> to something that writes
        essays and code came from an idea that sounds almost too dumb to be true:{' '}
        <strong>make it bigger.</strong> Not smarter-per-part - just bigger, on every
        axis, all at once.
      </Beat>

      <Beat as="h2">The bet: loss falls on a predictable curve</Beat>
      <Beat as="p">
        Around 2020, researchers measured what happens as you scale a transformer up,
        and found something startlingly orderly. Grow the model, the data, and the
        training compute together and the test loss doesn't wander - it slides down a
        smooth <strong>power law</strong>, straight enough to <em>extrapolate</em>.
        You could predict how good a bigger model would be <em>before</em> spending the
        millions to train it. That predictability is what made the whole “just scale
        it” gamble fundable.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Test loss vs. scale (illustrative). Each 10× of size + data + compute buys a steady drop in loss - diminishing, but reliable - toward an irreducible floor. Drag the dot along the curve.">
          <ScalingLab />
        </Figure>
      </Beat>

      <Beat>
        <CitationCard ids={['scaling-laws-2020', 'chinchilla-2022']} />
      </Beat>

      <Beat as="h2">Three dials, and the trick is balancing them</Beat>
      <Beat as="p">
        “Scale” isn't one knob but three, multiplied together. Turn them up out of
        proportion and you waste the budget.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · The three ingredients of scale. Loss only keeps falling when all three grow together.">
          <DialsDiagram />
        </Figure>
      </Beat>

      <Beat as="p">
        For years the race was mostly about <strong>parameters</strong> - headlines
        counted billions of weights. Then the <strong>Chinchilla</strong> result (2022)
        showed many of those giants were <em>under-trained</em>: for a fixed compute
        budget, they'd been made too big and fed too little text. Roughly balance the
        two - about <strong>20 tokens of data for every parameter</strong> - and a{' '}
        <em>smaller</em> model trained on <em>more</em> data wins. Since then, “bigger”
        has meant more data at least as much as more weights.
      </Beat>

      <Beat as="h2">Why more of the same becomes something new</Beat>
      <Beat as="p">
        Here's the genuinely strange part. As models cross certain sizes, they don't
        just get smoother - they pick up abilities the smaller versions simply didn't
        have: doing arithmetic, following multi-step instructions, translating rare
        languages. These are often called <strong>emergent abilities</strong>. The
        mechanism is still debated - some argue the “jumps” are partly an artifact of
        how we score them - but the practical pattern held long enough to drive a
        decade of “train it bigger and see what it can suddenly do.”
      </Beat>

      <Beat>
        <CitationCard ids={['emergent-2022']} />
      </Beat>

      <Beat>
        <Callout emoji="⚖️">
          <strong>Scale isn't a different idea - it's the same idea, louder.</strong>{' '}
          Every mechanism you built still runs unchanged: tokenize, embed, attend,
          predict the next token. Nothing here teaches the model new tricks by hand. We
          just give it more room and more to read, and capabilities fall out. That's the
          uncomfortable, remarkable lesson of the last decade.
        </Callout>
      </Beat>

      <Beat as="p">
        But scale alone gives you a brilliant <em>mimic</em>, not a helpful assistant -
        a model that will happily continue your question with more questions. Turning
        that raw power into something that answers you takes a few more moves. That's
        the last step.
      </Beat>
    </ChapterFrame>
  );
}
