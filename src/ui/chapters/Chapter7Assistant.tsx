import { useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';

function BaseVsAssistant() {
  const [mode, setMode] = useState<'base' | 'assistant'>('base');
  const prompt = 'How do I bake bread?';
  const base =
    'How do I bake bread? How do I bake a cake? How do I make pizza dough? ' +
    '10 easy recipes for beginners. Sign up for our newsletter to get…';
  const assistant =
    "Sure! Here's a simple loaf:\n1. Mix 500g flour, 7g yeast, 10g salt, 350ml warm water.\n" +
    '2. Knead 10 min, rest 1 hr until doubled.\n3. Shape, then bake at 230°C for 30 min.';
  return (
    <div className="lab">
      <div className="seg">
        <button className={mode === 'base' ? 'on' : ''} onClick={() => setMode('base')}>
          Base model
        </button>
        <button className={mode === 'assistant' ? 'on' : ''} onClick={() => setMode('assistant')}>
          After fine-tuning
        </button>
      </div>
      <div className="gen-output">
        <span className="prompt">{prompt}</span>
        {'\n\n'}
        {mode === 'base' ? base : assistant}
      </div>
      <div className="dim" style={{ fontSize: 13 }}>
        {mode === 'base'
          ? 'A raw model just continues the text — here, like a page of FAQ links it saw online. Technically fluent, totally unhelpful.'
          : 'Same weights, gently fine-tuned on examples of instructions being followed. Now it answers the question.'}
      </div>
    </div>
  );
}

const PAIRS = [
  {
    q: 'Explain gravity to a 6-year-old.',
    a: 'Gravity is the curvature of spacetime described by the Einstein field equations G﹢Λg = κT.',
    b: 'Gravity is the invisible pull that makes things fall down — it\'s why your ball always comes back to the ground!',
    better: 'b',
  },
];

function RlhfRanker() {
  const pair = PAIRS[0];
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="lab">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>
        Prompt: “{pair.q}” — which answer is better?
      </div>
      {(['a', 'b'] as const).map((key) => (
        <div
          key={key}
          className={`rank-card${picked === key ? ' picked' : ''}`}
          onClick={() => setPicked(key)}
        >
          <span className="tag">Answer {key.toUpperCase()}</span>
          {pair[key]}
        </div>
      ))}
      {picked && (
        <Callout emoji={picked === pair.better ? '✅' : '🤔'}>
          {picked === pair.better
            ? 'That\'s the pick most people make too. Multiply your one click by millions of human ratings, and the model learns a "sense" of what a good answer feels like. That\'s RLHF.'
            : 'Interesting choice! Either way — your preference becomes a training signal. Millions of these ratings teach the model what humans tend to prefer. That\'s RLHF.'}
        </Callout>
      )}
    </div>
  );
}

function PipelineDiagram() {
  const stages = [
    { t: 'Pretrain', s: 'Predict the next token on ~all the web', c: '#f0663e' },
    { t: 'Fine-tune', s: 'Copy examples of instructions being followed', c: '#e0913c' },
    { t: 'RLHF', s: 'Learn what humans rate as “good”', c: '#1f9e7a' },
    { t: 'Tools', s: 'Look things up, run code, act', c: '#3e6ff0' },
  ];
  const W = 700;
  const bw = 150;
  const gap = (W - bw * 4) / 3;
  return (
    <svg viewBox={`0 0 ${W} 150`} width="100%" role="img" aria-label="How a base model becomes an assistant">
      <defs>
        <marker id="pl-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#c0b199" />
        </marker>
      </defs>
      {stages.map((st, i) => {
        const x = i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={30} width={bw} height={78} rx={14} fill="#fff" stroke={st.c} strokeWidth="1.5" />
            <text x={x + bw / 2} y={58} textAnchor="middle" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="16" fill={st.c}>
              {st.t}
            </text>
            <foreignObject x={x + 8} y={66} width={bw - 16} height={40}>
              <div style={{ fontFamily: 'Figtree, sans-serif', fontSize: 10.5, color: '#857c72', lineHeight: 1.25, textAlign: 'center' }}>
                {st.s}
              </div>
            </foreignObject>
            {i < stages.length - 1 && (
              <line
                x1={x + bw}
                y1={69}
                x2={x + bw + gap}
                y2={69}
                stroke="#c0b199"
                strokeWidth="2"
                markerEnd="url(#pl-arrow)"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Chapter7Assistant() {
  return (
    <ChapterFrame id="assistant">
      <Beat as="p" className="lead">
        You've now built every mechanical part of a language model. But if you
        trained one on a huge slice of the internet, you'd get something{' '}
        <em>strange</em>: a brilliant mimic that just keeps <strong>continuing
        text</strong>, not a helpful assistant. Ask it a question and it might
        reply with more questions. Turning that mimic into ChatGPT-style help
        takes three more moves.
      </Beat>

      <Beat as="h2">Step 1 — Pretraining makes a mimic</Beat>
      <Beat as="p">
        Feed the model enormous amounts of text (much of the public web, via
        crawls like Common Crawl) and have it do only one thing: predict the next
        token. It becomes astonishingly fluent — and completely unhelpful, because
        “continue this text” is not the same as “answer me.” See for yourself:
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Same model, before and after fine-tuning. Pretraining gives fluency; fine-tuning gives helpfulness.">
          <BaseVsAssistant />
        </Figure>
      </Beat>

      <Beat>
        <CitationCard ids={['common-crawl']} />
      </Beat>

      <Beat as="h2">Step 2 — Fine-tuning teaches it to follow instructions</Beat>
      <Beat as="p">
        Take that fluent base model and keep training it, now on a smaller,
        curated set of <strong>instruction → good answer</strong> examples. Same
        machinery as before (predict the next token), just on better-shaped data.
        The model learns the <em>format</em> of being helpful.
      </Beat>

      <Beat as="h2">Step 3 — RLHF learns human taste</Beat>
      <Beat as="p">
        There's no single “correct” answer to “write me a poem.” So instead of
        copying answers, we let the model generate a few, ask <strong>humans which
        they prefer</strong>, and train it to produce more of the preferred kind.
        This is <strong>Reinforcement Learning from Human Feedback</strong>. Try
        being the human rater:
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · One human preference is a tiny signal. Millions of them shape the model's “taste”.">
          <RlhfRanker />
        </Figure>
      </Beat>

      <Beat>
        <CitationCard ids={['rlhf']} />
      </Beat>

      <Beat as="h2">Step 4 — Tools let it act</Beat>
      <Beat as="p">
        Finally, the model learns to say “I need to look this up” or “let me run
        this” — emitting a special request that something <em>outside</em> the
        model answers (a search, a calculator, your code), then continuing with
        the result. That's <strong>tool calling</strong>, and it's how a text
        predictor reaches into the real world.
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · The whole recipe: pretrain → fine-tune → RLHF → tools.">
          <PipelineDiagram />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🧑‍🍳">
          <strong>The big reframe:</strong> the intelligence comes from
          pretraining. Fine-tuning and RLHF don't teach the model facts — they
          teach it <em>manners</em>: how to be helpful, honest, and safe with what
          it already knows.
        </Callout>
      </Beat>

      <Beat as="p">
        That's the whole assembly line. One chapter left — let's stand back and
        look at the entire machine you've built, and where it all goes next.
      </Beat>
    </ChapterFrame>
  );
}
