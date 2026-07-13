import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CodeViewer } from '../components/CodeViewer';
import { ProbBars } from '../viz/ProbBars';
import { softmaxT, topP, sample } from '../../llm/sampling';
import samplingSource from '../../llm/sampling.ts?raw';

const CANDIDATES: [string, number][] = [
  ['gold', 4.2],
  ['silk', 3.4],
  ['crown', 3.0],
  ['warm', 1.7],
  ['red', 1.4],
  ['dragon', 0.6],
  ['sword', 0.2],
  ['banana', -1.8],
];

function SamplingLab() {
  const labels = CANDIDATES.map((c) => c[0]);
  const logits = CANDIDATES.map((c) => c[1]);
  const [temp, setTemp] = useState(0.8);
  const [p, setP] = useState(0.9);
  const [counts, setCounts] = useState<number[] | null>(null);

  const probs = useMemo(() => topP(softmaxT(logits, temp), p), [temp, p]);

  const items = labels.map((label, i) => ({
    label,
    p: probs[i],
    count: counts ? counts[i] : undefined,
  }));

  function roll() {
    const c = new Array(labels.length).fill(0);
    for (let i = 0; i < 100; i++) c[sample(probs)]++;
    setCounts(c);
  }

  return (
    <div className="lab">
      <div className="slider-row">
        <label>temperature</label>
        <input
          type="range"
          min={0.1}
          max={2}
          step={0.05}
          value={temp}
          onChange={(e) => {
            setTemp(+e.target.value);
            setCounts(null);
          }}
        />
        <span className="val">{temp.toFixed(2)}</span>
      </div>
      <div className="slider-row">
        <label>top-p (nucleus)</label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={p}
          onChange={(e) => {
            setP(+e.target.value);
            setCounts(null);
          }}
        />
        <span className="val">{p.toFixed(2)}</span>
      </div>

      <ProbBars items={items} />

      <div className="lab-controls">
        <button className="btn btn-run" onClick={roll}>
          Sample 100× 🎲
        </button>
        {counts && <span className="dim">counts shown after each bar</span>}
      </div>
    </div>
  );
}

const WINDOW_TOKENS =
  'the king lived in a castle on a hill by the river near the dark forest where the fox slept'.split(
    ' ',
  );

function ContextWindow() {
  const W = 8;
  const [start, setStart] = useState(6);
  return (
    <div className="lab">
      <div className="tokens" style={{ gap: 4 }}>
        {WINDOW_TOKENS.map((tok, i) => {
          const inside = i >= start && i < start + W;
          return (
            <span
              key={i}
              className="tok"
              style={{
                opacity: inside ? 1 : 0.28,
                background: inside ? 'var(--coral-tint)' : '#f6eee1',
                borderColor: inside ? 'var(--coral-tint-line)' : 'var(--line)',
                color: inside ? 'var(--coral-deep)' : 'var(--muted)',
              }}
            >
              {tok}
            </span>
          );
        })}
      </div>
      <div className="slider-row">
        <label>window position</label>
        <input
          type="range"
          min={0}
          max={WINDOW_TOKENS.length - W}
          value={start}
          onChange={(e) => setStart(+e.target.value)}
        />
        <span className="val">{start}</span>
      </div>
      <div className="dim" style={{ fontSize: 13 }}>
        The model only “sees” the {W} highlighted tokens. Slide the window: tokens
        that fall outside are, for this step, forgotten.
      </div>
    </div>
  );
}

export function Chapter6Sampling() {
  return (
    <ChapterFrame id="sampling">
      <Beat as="p" className="lead">
        Our transformer hands us a <strong>score for every possible next
        token</strong>. Two questions remain, and they're the last of the whole
        story: how do we turn those scores into one <em>choice</em>, and how do we
        keep choosing to build a whole sentence?
      </Beat>

      <Beat as="h2">Softmax: scores → probabilities</Beat>
      <Beat as="p">
        First we convert raw scores into probabilities that sum to 1, using{' '}
        <strong>softmax</strong>. Bigger score → bigger share. Then comes the fun
        part: two dials that reshape those probabilities before we pick.
      </Beat>

      <Beat as="h3">Temperature — the boldness dial</Beat>
      <Beat as="p">
        <strong>Temperature</strong> stretches or flattens the distribution. Turn
        it down toward 0 and the model almost always takes the single most likely
        token — safe and repetitive. Turn it up and unlikely tokens get a real
        shot — creative, but riskier. <strong>Top-p</strong> then trims the
        long tail, keeping only the most plausible options. Play with both:
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The next-token distribution for “the queen wears a ___”. Temperature reshapes it; top-p trims the tail; the dice show what you'd actually draw.">
          <SamplingLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🌡️">
          <strong>Good default:</strong> temperature ≈ 0.7. Lower for facts and
          code (you want the safe pick); higher for brainstorming and stories
          (you want surprise).
        </Callout>
      </Beat>

      <Beat as="h2">The autoregressive loop</Beat>
      <Beat as="p">
        Here's the engine of generation, and it's almost silly how simple it is:
      </Beat>
      <Beat>
        <ol className="point-list">
          <li>
            <span className="point-num">1</span>
            <div>Feed in the text so far → get scores for the next token.</div>
          </li>
          <li>
            <span className="point-num">2</span>
            <div>Sample one token (with temperature + top-p).</div>
          </li>
          <li>
            <span className="point-num">3</span>
            <div>Glue it onto the end, and go back to step 1.</div>
          </li>
        </ol>
      </Beat>
      <Beat as="p">
        That loop — predict, pick, append, repeat — is <em>all</em> that's
        happening when you watch a model “type” an answer. Every token you see was
        chosen one at a time, each one fed back in as part of the next prompt.
      </Beat>

      <Beat as="h2">The context window</Beat>
      <Beat as="p">
        But the model can't feed <em>everything</em> back in forever. It has a
        fixed-size <strong>context window</strong> — a maximum number of tokens it
        can look at in one step. Slide the window below: whatever scrolls off the
        edge is gone for that step. That's why long chats “forget” the beginning,
        and why context length is such a big deal.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · A fixed context window sliding over a longer text. Everything counts against one token budget.">
          <ContextWindow />
        </Figure>
      </Beat>

      <Beat as="h2">The code</Beat>
      <Beat>
        <CodeViewer code={samplingSource} filename="src/llm/sampling.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        And that's the complete machine. Tokenize → embed → attention → predict →
        sample → repeat. You've now seen every moving part of a modern language
        model. But there's a puzzle left: a model trained this way just{' '}
        <em>continues text</em>. How does it become something that answers your
        questions and follows instructions? That's the final chapter.
      </Beat>
    </ChapterFrame>
  );
}
