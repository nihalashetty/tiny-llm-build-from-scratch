import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { ChapterRef } from '../components/ChapterRef';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { AttentionHeatmap } from '../viz/AttentionHeatmap';
import { ProbBars } from '../viz/ProbBars';
import { useRafTrainer } from '../useRafTrainer';
import { TinyTransformer } from '../../llm/transformer';
import { sample } from '../../llm/sampling';
import { corpusText } from '../../llm/corpus/little-kingdom';
import { useProgress } from '../progress';
import { chapterNumber } from '../../content/curriculum';

/**
 * The capstone: one input flowing through every stage you built - tokenize,
 * attention, next-token scores, sample - using the real from-scratch transformer,
 * trained live. Press "sample" and it appends the chosen token and loops, so you
 * watch the whole autoregressive machine turn end to end.
 */
function PipelinePlayground() {
  const t = useRafTrainer(
    () => new TinyTransformer(corpusText, { dim: 24, context: 16, lr: 0.01, seed: 3 }),
    (m) => m.trainStep(),
    900,
    2,
  );
  const m = t.model;
  const [text, setText] = useState('the queen sits on the');
  const attn = useMemo(() => m.attentionFor(text), [m, text, t.tick]);
  const dist = useMemo(() => m.nextDistribution(text), [m, text, t.tick]);
  const top = useMemo(() => [...dist].sort((a, b) => b.p - a.p).slice(0, 6), [dist]);
  const trained = t.epoch > 60;

  function pick() {
    const idx = sample(dist.map((d) => d.p));
    const tok = dist[idx].char;
    setText((s) => (tok === '.' ? s + '.' : s + ' ' + tok));
  }

  return (
    <div className="lab">
      <div className="lab-controls">
        <button className="btn btn-run" onClick={t.start} disabled={t.running || t.done}>
          {t.epoch > 0 ? 'Resume ▶' : 'Train ▶'}
        </button>
        <button className="btn btn-light" onClick={t.pause} disabled={!t.running}>
          Pause
        </button>
        <button className="btn btn-light" onClick={t.reset}>
          Reset
        </button>
        <span className="lab-stats">
          <span>
            step <b>{t.epoch}</b>
          </span>
          <span>
            loss <b>{t.loss === null ? '-' : t.loss.toFixed(3)}</b>
          </span>
        </span>
      </div>

      <div className="field">
        <label>Input</label>
        <input
          className="tokenize-input"
          style={{ marginBottom: 0, maxWidth: 320 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {!trained ? (
        <div className="panel-empty" style={{ marginTop: 10 }}>
          Press <b>Train ▶</b> for a few seconds first - an untrained model has nothing to show.
        </div>
      ) : (
        <div style={{ marginTop: 12, display: 'grid', gap: 14 }}>
          <div>
            <div className="panel-title">1 · Tokenize → known words become IDs</div>
            <div className="tokens" style={{ marginTop: 6 }}>
              {attn.tokens.length ? (
                attn.tokens.map((tok, i) => (
                  <span className="tok" key={i}>
                    {tok}
                  </span>
                ))
              ) : (
                <span className="dim">No Little-Kingdom words recognized - try “the king wears a”.</span>
              )}
            </div>
            <div className="dim" style={{ fontSize: 12, marginTop: 4 }}>
              …then each ID becomes a 24-number embedding (<ChapterRef id="embeddings" />) with its position added on.
            </div>
          </div>

          {attn.tokens.length > 0 && (
            <>
              <div>
                <div className="panel-title">2 · Attention → every word looks back at earlier ones</div>
                <AttentionHeatmap tokens={attn.tokens} alpha={attn.alpha} maxSize={300} />
              </div>

              <div>
                <div className="panel-title">3 · Readout → a probability for every next token</div>
                <ProbBars items={top.map((d) => ({ label: d.char, p: d.p }))} />
              </div>

              <div>
                <div className="panel-title">4 · Sample → pick one, append it, and loop</div>
                <div className="lab-controls" style={{ marginTop: 4 }}>
                  <button className="btn btn-run" onClick={pick}>
                    Sample the next token 🎲
                  </button>
                  <span className="dim">each click feeds the result back in as step 1</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FullPipeline() {
  // Chapter numbers come from the curriculum so they can't drift out of sync
  // with the running order (see chapterNumber's note).
  const ch = (id: string) => `ch ${chapterNumber(id)}`;
  const steps = [
    { t: 'text', s: 'your input' },
    { t: 'tokens', s: ch('tokenization') },
    { t: 'embeddings', s: ch('embeddings') },
    { t: 'attention', s: ch('transformers') },
    { t: 'sample', s: ch('sampling') },
    { t: 'next token', s: 'loop ⟳' },
  ];
  const W = 720;
  const bw = 104;
  const gap = (W - bw * steps.length) / (steps.length - 1);
  return (
    <svg viewBox={`0 0 ${W} 170`} width="100%" role="img" aria-label="The full LLM pipeline">
      <defs>
        <marker id="fp-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#b6bcc6" />
        </marker>
      </defs>
      {steps.map((st, i) => {
        const x = i * (bw + gap);
        const last = i === steps.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={40} width={bw} height={58} rx={12} fill={last ? '#fdeeea' : '#fff'} stroke={last ? '#e0553a' : '#e2e5ea'} />
            <text x={x + bw / 2} y={66} textAnchor="middle" fontFamily="'Inter Tight', sans-serif" fontWeight="700" fontSize="14" fill="#16181d">
              {st.t}
            </text>
            <text x={x + bw / 2} y={84} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#79808e">
              {st.s}
            </text>
            {i < steps.length - 1 && (
              <line x1={x + bw} y1={69} x2={x + bw + gap} y2={69} stroke="#b6bcc6" strokeWidth="2" markerEnd="url(#fp-arrow)" />
            )}
          </g>
        );
      })}
      {/* loop arrow from last back to tokens */}
      <path
        d={`M ${W - bw / 2} 98 C ${W - bw / 2} 150, ${bw + gap + bw / 2} 150, ${bw + gap + bw / 2} 100`}
        fill="none"
        stroke="#e0553a"
        strokeWidth="2"
        strokeDasharray="4 3"
        markerEnd="url(#fp-arrow)"
      />
    </svg>
  );
}

const SUMMIT = [
  { emoji: '🎭', name: 'ELIZA', role: 'Faked conversation with pure rules (1966).' },
  { emoji: '🧠', name: 'The Perceptron', role: 'Learned from examples - then hit the XOR wall (1958).' },
  { emoji: '🧩', name: 'BPE', role: 'Grew a vocabulary from raw characters (1994).' },
  { emoji: '✨', name: 'Word2Vec', role: 'Turned words into meaningful vectors (2013).' },
  { emoji: '👀', name: 'The Transformer', role: 'Let every word attend to every other (2017).' },
  { emoji: '📈', name: 'Scaling laws', role: 'Loss falls predictably as models grow (2020).' },
  { emoji: '🧑‍🏫', name: 'RLHF', role: 'Taught the mimic some manners (2022).' },
];

export function Chapter8Epilogue() {
  const { reset, doneCount, total } = useProgress();
  return (
    <ChapterFrame id="epilogue">
      <Beat as="p" className="lead">
        Look how far we came. We started with a chatbot that couldn't understand a
        thing, and ended by building - with our own hands, in a browser tab -{' '}
        <strong>a tiny version of every piece of a modern language model.</strong>
      </Beat>

      <Beat as="h2">The whole machine, on one line</Beat>
      <Beat as="p">
        Here it is, assembled. Text becomes tokens, tokens become meaningful
        vectors, attention mixes them with context, and a sampler picks the next
        token - which gets fed right back in. Every box is a chapter you just
        lived through.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The complete pipeline. The dashed arrow is the autoregressive loop - the model writing one token at a time.">
          <FullPipeline />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🎉">
          Every “magic” step a big model performs is one of these pieces, scaled up
          by billions of parameters and trillions of words. Bigger - but not
          fundamentally different from what you built.
        </Callout>
      </Beat>

      <Beat as="h2">Now watch it run - the whole loop, live</Beat>
      <Beat as="p">
        The map is one thing; here's the territory. Below is the real from-scratch
        transformer, training in your browser. Give it a Little-Kingdom phrase, then
        follow one prediction through every stage you built - tokenize, attention, the
        next-token scores, the sampled pick - and press <strong>sample</strong> again
        to watch the loop feed itself.
      </Beat>
      <Beat>
        <Figure caption="Fig 2 · One input through the whole machine: tokens → attention → next-token probabilities → a sampled token, fed right back in. Train it first, then sample.">
          <PipelinePlayground />
        </Figure>
      </Beat>

      <Beat as="h2">The AI summit</Beat>
      <Beat as="p">
        Before we close, a curtain call for the ideas that got us here - decades of
        people chipping away at one deceptively simple question: <em>can a machine
        use language?</em>
      </Beat>

      <Beat>
        <div className="summit-grid">
          {SUMMIT.map((c) => (
            <div className="summit-card" key={c.name}>
              <div className="emoji">{c.emoji}</div>
              <div className="name">{c.name}</div>
              <div className="role">{c.role}</div>
            </div>
          ))}
        </div>
      </Beat>

      <Beat as="h2">Where it goes next</Beat>
      <Beat as="p">
        The transformer won't be the last word. Researchers are already exploring
        architectures that handle long sequences more cheaply, or learn more like
        we do. A few names worth watching:
      </Beat>

      <Beat>
        <CitationCard ids={['mamba-2023', 'xlstm-2024', 'jamba-2024', 'jepa-2022']} />
      </Beat>

      <Beat as="h2">Now go build</Beat>
      <Beat as="p">
        Everything you ran here lives in{' '}
        <a
          href="https://github.com/nihalashetty/tiny-llm-build-from-scratch"
          target="_blank"
          rel="noreferrer"
        >
          one small repo
        </a>{' '}
        - the readable{' '}
        <a
          href="https://github.com/nihalashetty/tiny-llm-build-from-scratch/tree/main/src/llm"
          target="_blank"
          rel="noreferrer"
        >
          <code>src/llm</code>
        </a>{' '}
        files are yours to fork, break, and rebuild. Change the corpus. Add a second
        attention head. Make the transformer bigger and see what it writes. That's the
        best way to truly get it.
      </Beat>

      <Beat as="p">
        And if you enjoyed this, the whole journey was inspired by{' '}
        <a href="https://youtu.be/YmLp8qe87A0" target="_blank" rel="noreferrer">
          CJ's talk “How LLMs Work”
        </a>{' '}
        and his{' '}
        <a href="https://github.com/w3cj/how-llms-work" target="_blank" rel="noreferrer">
          companion repo
        </a>
        . Go watch it for the full story, start to finish.
      </Beat>

      <Beat>
        <Callout emoji="🧭" tone="neutral">
          You finished {doneCount} of {total} chapters.{' '}
          <button
            className="btn btn-light"
            style={{ marginLeft: 8 }}
            onClick={reset}
          >
            Reset progress
          </button>
        </Callout>
      </Beat>
    </ChapterFrame>
  );
}
