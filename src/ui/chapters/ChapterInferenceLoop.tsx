import { useMemo, useRef, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CodeViewer } from '../components/CodeViewer';
import { ProbBars } from '../viz/ProbBars';
import { WarmupBar } from '../components/WarmupBar';
import { useInferenceModel } from '../useInferenceModel';
import { softmaxT, topP, sample } from '../../llm/sampling';
import samplingSource from '../../llm/sampling.ts?raw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const EPS = 1e-9;

/** Re-teach temperature + top-p, but on the LIVE model's real distribution. */
function SamplingLab() {
  const { model, ready, progress, tick } = useInferenceModel({ seed: 3 });
  const [prompt, setPrompt] = useState('the queen');
  const [temp, setTemp] = useState(0.8);
  const [p, setP] = useState(1);
  const [counts, setCounts] = useState<number[] | null>(null);

  const { labels, probs } = useMemo(() => {
    const dist = [...model.nextDistribution(prompt)].sort((a, b) => b.p - a.p).slice(0, 8);
    const logits = dist.map((d) => Math.log(d.p + EPS));
    const shaped = topP(softmaxT(logits, temp), p);
    return { labels: dist.map((d) => (d.char === '.' ? '·' : d.char)), probs: shaped };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, prompt, temp, p, tick]);

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
      <WarmupBar ready={ready} progress={progress} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-xs text-muted-foreground">Prompt</label>
        <Input
          style={{ marginBottom: 0, maxWidth: 260 }}
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setCounts(null); }}
        />
      </div>
      <div className="dim" style={{ fontSize: 12, margin: '2px 0 8px' }}>
        Next-token bets for <code>“{prompt} ___”</code>, straight from the live model. Open-ended
        prompts (“the”, “the fox”) spread the odds so temperature has room to work; a nailed-on
        prompt (“the king is a”) barely moves.
      </div>
      <div className="flex items-center gap-3 my-2">
        <label className="min-w-[130px] font-mono text-xs text-foreground/90">temperature</label>
        <input className="flex-1 accent-primary" type="range" min={0.1} max={2} step={0.05} value={temp}
          onChange={(e) => { setTemp(+e.target.value); setCounts(null); }} />
        <span className="min-w-[46px] text-right font-mono text-xs text-foreground">{temp.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-3 my-2">
        <label className="min-w-[130px] font-mono text-xs text-foreground/90">top-p (nucleus)</label>
        <input className="flex-1 accent-primary" type="range" min={0.1} max={1} step={0.05} value={p}
          onChange={(e) => { setP(+e.target.value); setCounts(null); }} />
        <span className="min-w-[46px] text-right font-mono text-xs text-foreground">{p.toFixed(2)}</span>
      </div>
      <ProbBars items={items} />
      <div className="lab-controls">
        <Button size="sm" onClick={roll} disabled={!ready}>Sample 100× 🎲</Button>
        {counts && <span className="dim">counts shown after each bar</span>}
      </div>
    </div>
  );
}

/** The autoregressive loop, one visible click at a time. */
function LoopStepper() {
  const { model, ready, progress } = useInferenceModel({ seed: 3 });
  const prompt = 'the queen';
  const promptIds = useMemo(() => model.encodeIds(prompt), [model]);
  const [ids, setIds] = useState<number[]>(() => promptIds.slice());
  const [last, setLast] = useState<{ word: string; p: number } | null>(null);

  // Source of truth kept in a ref so several quick clicks each append correctly
  // (state alone would batch and lose tokens on rapid clicks).
  const idsRef = useRef<number[]>(ids);
  idsRef.current = ids;

  function step() {
    const cur = idsRef.current;
    const ctx = cur.slice(-model.T);
    const cache = model.forward(ctx);
    const probsRaw = cache.probs[cache.probs.length - 1];
    const shaped = topP(softmaxT(probsRaw.map((x) => Math.log(x + EPS)), 0.8), 0.9);
    const chosen = sample(shaped);
    const next = [...cur, chosen];
    idsRef.current = next;
    setLast({ word: model.vocab[chosen], p: probsRaw[chosen] });
    setIds(next);
  }

  function reset() {
    const seed = promptIds.slice();
    idsRef.current = seed;
    setIds(seed);
    setLast(null);
  }

  const shown = ids;
  const generatedFrom = promptIds.length;

  return (
    <div className="lab">
      <WarmupBar ready={ready} progress={progress} />
      <div
        className="rounded-xl border bg-zinc-900 p-4 font-mono text-[0.85rem] leading-relaxed text-zinc-100 whitespace-pre-wrap break-words min-h-[54px]"
        style={{ minHeight: 54 }}
      >
        {shown.map((id, i) => (
          <span
            key={i}
            className={cn(
              i < generatedFrom && 'font-bold text-amber-300',
              i === shown.length - 1 &&
                shown.length > generatedFrom &&
                'rounded bg-muted px-0.5 text-foreground',
            )}
          >
            {(i > 0 && model.vocab[id] !== '.' ? ' ' : '') + model.vocab[id]}
          </span>
        ))}
      </div>
      <div className="lab-controls" style={{ marginTop: 10 }}>
        <Button size="sm" onClick={step} disabled={!ready || shown.length >= model.T}>
          + Next token
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>Reset</Button>
        {last && (
          <span className="lab-stats">
            <span>picked <b>{last.word === '.' ? '·' : last.word}</b></span>
            <span>p&nbsp;<b>{(last.p * 100).toFixed(0)}%</b></span>
          </span>
        )}
      </div>
      <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        Each click runs the <em>entire</em> network once to produce a single word, glues it
        on (highlighted), and gets ready to go again. That’s the whole loop, the model is
        doing exactly this, just very fast.
      </div>
    </div>
  );
}

/** A tiny schematic of why the KV cache exists. */
function KVCacheDiagram() {
  const steps = ['the', 'queen', 'sat', 'on'];
  const n = steps.length;
  const rowH = 30;
  const cell = 62;
  const x0 = 150;
  const labelH = 24;
  const gap = 22;
  const top = 8;
  const blockH = labelH + n * rowH;
  const W = x0 + n * cell + 8;
  const H = top + blockH + gap + blockH + 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label="Without a cache each step reprocesses the whole sequence; with a cache only the new token is processed">
      {[0, 1].map((mode) => {
        const y0 = top + mode * (blockH + gap);
        return (
          <g key={mode}>
            <text x={0} y={y0 + 14} fontFamily="'Geist', sans-serif" fontWeight="800" fontSize="12"
              fill={mode === 0 ? '#c0392b' : '#10866a'}>
              {mode === 0 ? 'no cache' : 'KV cache'}
            </text>
            {steps.map((_, r) => (
              <g key={r}>
                <text x={0} y={y0 + labelH + r * rowH + 15} fontFamily="'Geist Mono', monospace" fontSize="10" fill="#9c8d76">
                  step {r + 1}
                </text>
                {steps.map((tok, c) => {
                  const done = c <= r;
                  // no-cache recomputes all c<=r; cache only computes the new one (c===r)
                  const active = mode === 0 ? done : c === r;
                  const reused = mode === 1 && done && c < r;
                  return (
                    <g key={c}>
                      <rect x={x0 + c * cell} y={y0 + labelH + r * rowH} width={cell - 6} height={rowH - 6} rx={5}
                        fill={active ? (mode === 0 ? '#f6ccc0' : '#c7ecdf') : reused ? '#eef4f1' : '#f1f3f6'}
                        stroke={active ? (mode === 0 ? '#e07a5f' : '#10866a') : '#e6dcc8'} strokeWidth="1" opacity={done ? 1 : 0.35} />
                      <text x={x0 + c * cell + (cell - 6) / 2} y={y0 + labelH + r * rowH + 18} textAnchor="middle"
                        fontFamily="'Geist Mono', monospace" fontSize="10"
                        fill={done ? '#5b5348' : '#c9bca6'}>{tok}</text>
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function ChapterInferenceLoop() {
  return (
    <ChapterFrame id="inference-loop">
      <Beat as="p" className="lead">
        We’re holding a probability for every word the model knows. Two questions are all
        that stand between us and a finished answer: <strong>how do we pick one word</strong>,
        and <strong>how do we keep going</strong> to write a whole paragraph?
      </Beat>

      <Beat as="h2">Picking a word: greedy vs. rolling the dice</Beat>
      <Beat as="p">
        The simplest choice is <strong>greedy</strong>: always take the single highest-
        probability word. Safe, but it makes the model repetitive and a little robotic, the same prompt always gives the identical answer. So instead we usually{' '}
        <strong>sample</strong>: draw a word at random, in proportion to its probability.
        The likeliest word usually wins, but not always, and that wiggle is where variety
        and “creativity” come from.
      </Beat>

      <Beat as="h3">Two dials that reshape the odds</Beat>
      <Beat as="p">
        Before we draw, we bend the distribution with two knobs you’ve met in API settings.{' '}
        <strong>Temperature</strong> stretches or flattens it: near 0 it becomes almost
        greedy (safe, repetitive); above 1 it flattens so long-shot words get a real chance
        (surprising, riskier). <strong>Top-p</strong> (nucleus) then trims the tail: keep
        only the most likely words whose probabilities add up to <em>p</em>, and ignore the
        rest. Play with both on the live model:
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Temperature reshapes the model’s real next-word distribution; top-p trims the unlikely tail; the dice show what you’d actually draw over 100 tries.">
          <SamplingLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🌡️">
          <strong>Good defaults:</strong> temperature ≈ 0.7, top-p ≈ 0.9. Turn temperature
          down for facts, code, and math (you want the safe pick); turn it up for
          brainstorming and stories (you want surprise).
        </Callout>
      </Beat>

      <Beat as="h2">The loop that writes everything</Beat>
      <Beat as="p">
        Now the move that turns one word into an essay, and it’s almost comically simple:
      </Beat>
      <Beat>
        <ol className="point-list">
          <li><span className="point-num">1</span><div>Run the forward pass on the text so far → get the next-word distribution.</div></li>
          <li><span className="point-num">2</span><div>Sample one token (with temperature + top-p).</div></li>
          <li><span className="point-num">3</span><div>Glue it onto the end of the text, and go back to step 1.</div></li>
        </ol>
      </Beat>
      <Beat as="p">
        This is called <strong>autoregression</strong>, the model’s own output becomes part
        of its next input. Click through it yourself and watch the sentence grow one token
        per press:
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · The autoregressive loop, one click per token. Every new word (highlighted) was produced by running the whole model again on everything so far.">
          <LoopStepper />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🔁">
          <strong>This is why answers stream in word by word.</strong> The model literally
          cannot produce the whole reply at once, each token needs the previous one to
          exist first. So the interface shows them the moment they’re chosen, and you watch
          the sentence assemble in real time.
        </Callout>
      </Beat>

      <Beat as="h2">The KV cache: don’t redo the same work</Beat>
      <Beat as="p">
        There’s an obvious inefficiency in that loop. To pick word 100, step 1 says “run the
        forward pass on the text so far”, all 99 previous words, again. Word 101 reprocesses
        100. That’s enormous, repeated work. The fix is the <strong>KV cache</strong>: during
        attention, every token produces a Key and a Value (remember Q/K/V?). Those never
        change once computed, so we <em>store</em> them. Each new step only computes the
        Key/Value for the one new token and reuses the rest.
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · Without a cache, every step recomputes the whole sequence (red). With a KV cache, past keys/values are reused (pale green) and only the new token is processed (green).">
          <KVCacheDiagram />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="⚡" tone="neutral">
          <strong>The cache is why the first token feels slow and the rest fly.</strong>{' '}
          Processing your prompt (the “prefill”) fills the cache in one big pass, that’s the
          pause before the answer starts. After that, each new word is cheap, so text pours
          out quickly. It’s also why a longer conversation slowly uses more memory: the cache
          grows with every token.
        </Callout>
      </Beat>

      <Beat as="h2">Knowing when to stop</Beat>
      <Beat as="p">
        A loop needs an exit. A chat model has three:
      </Beat>
      <Beat>
        <ul className="point-list">
          <li><span className="point-num">1</span><div><strong>An end token.</strong> During fine-tuning the model learned to emit a special “end of turn” token when its answer is complete. When sampling draws that token, the loop stops, the model decided it was done.</div></li>
          <li><span className="point-num">2</span><div><strong>A length limit.</strong> A hard cap (max tokens) stops runaway generation, whatever the model wants. This is the setting behind a reply that cuts off mid-sentence.</div></li>
          <li><span className="point-num">3</span><div><strong>Stop sequences.</strong> The caller can name specific strings that, once produced, halt generation, handy when you’re using the model inside a larger program.</div></li>
        </ul>
      </Beat>

      <Beat as="h2">The code (sampling, by hand)</Beat>
      <Beat as="p">
        The same four functions the widgets above call, softmax-with-temperature, top-p,
        top-k, and the actual dice roll. This is the last real code in the whole pipeline.
      </Beat>
      <Beat>
        <CodeViewer code={samplingSource} filename="src/llm/sampling.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        That’s every mechanism, start to finish. In the last chapter we put them all in one
        room: type a prompt and watch the real model tokenize, sweep, score, sample, and
        loop, live, end to end.
      </Beat>
    </ChapterFrame>
  );
}
