import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { useProgress } from '../progress';

function FullPipeline() {
  const steps = [
    { t: 'text', s: 'ch 0' },
    { t: 'tokens', s: 'ch 3' },
    { t: 'embeddings', s: 'ch 4' },
    { t: 'attention', s: 'ch 5' },
    { t: 'sample', s: 'ch 6' },
    { t: 'next token', s: 'loop ⟳' },
  ];
  const W = 720;
  const bw = 104;
  const gap = (W - bw * steps.length) / (steps.length - 1);
  return (
    <svg viewBox={`0 0 ${W} 170`} width="100%" role="img" aria-label="The full LLM pipeline">
      <defs>
        <marker id="fp-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#c0b199" />
        </marker>
      </defs>
      {steps.map((st, i) => {
        const x = i * (bw + gap);
        const last = i === steps.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={40} width={bw} height={58} rx={12} fill={last ? '#fde7de' : '#fff'} stroke={last ? '#f0663e' : '#eae0d3'} />
            <text x={x + bw / 2} y={66} textAnchor="middle" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="700" fontSize="14" fill="#2b2622">
              {st.t}
            </text>
            <text x={x + bw / 2} y={84} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="10" fill="#a2917a">
              {st.s}
            </text>
            {i < steps.length - 1 && (
              <line x1={x + bw} y1={69} x2={x + bw + gap} y2={69} stroke="#c0b199" strokeWidth="2" markerEnd="url(#fp-arrow)" />
            )}
          </g>
        );
      })}
      {/* loop arrow from last back to tokens */}
      <path
        d={`M ${W - bw / 2} 98 C ${W - bw / 2} 150, ${bw + gap + bw / 2} 150, ${bw + gap + bw / 2} 100`}
        fill="none"
        stroke="#f0663e"
        strokeWidth="2"
        strokeDasharray="4 3"
        markerEnd="url(#fp-arrow)"
      />
    </svg>
  );
}

const SUMMIT = [
  { emoji: '🎭', name: 'ELIZA', role: 'Faked conversation with pure rules (1966).' },
  { emoji: '🧠', name: 'The Perceptron', role: 'Learned from examples — then hit the XOR wall (1958).' },
  { emoji: '🧩', name: 'BPE', role: 'Grew a vocabulary from raw characters (1994).' },
  { emoji: '✨', name: 'Word2Vec', role: 'Turned words into meaningful vectors (2013).' },
  { emoji: '👀', name: 'The Transformer', role: 'Let every word attend to every other (2017).' },
  { emoji: '🧑‍🏫', name: 'RLHF', role: 'Taught the mimic some manners (2022).' },
];

export function Chapter8Epilogue() {
  const { reset, doneCount, total } = useProgress();
  return (
    <ChapterFrame id="epilogue">
      <Beat as="p" className="lead">
        Look how far we came. We started with a chatbot that couldn't understand a
        thing, and ended by building — with our own hands, in a browser tab —{' '}
        <strong>a tiny version of every piece of a modern language model.</strong>
      </Beat>

      <Beat as="h2">The whole machine, on one line</Beat>
      <Beat as="p">
        Here it is, assembled. Text becomes tokens, tokens become meaningful
        vectors, attention mixes them with context, and a sampler picks the next
        token — which gets fed right back in. Every box is a chapter you just
        lived through.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The complete pipeline. The dashed arrow is the autoregressive loop — the model writing one token at a time.">
          <FullPipeline />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🎉">
          Every “magic” step a big model performs is one of these pieces, scaled up
          by billions of parameters and trillions of words. Bigger — but not
          fundamentally different from what you built.
        </Callout>
      </Beat>

      <Beat as="h2">The AI summit</Beat>
      <Beat as="p">
        Before we close, a curtain call for the ideas that got us here — decades of
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
        Everything you ran here lives in this repo — the readable{' '}
        <code>src/llm</code> files are yours to fork, break, and rebuild. Change
        the corpus. Add a second attention head. Make the transformer bigger and
        see what it writes. That's the best way to truly get it.
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
