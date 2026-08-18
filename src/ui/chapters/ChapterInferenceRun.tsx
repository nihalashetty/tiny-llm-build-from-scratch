import { useEffect, useMemo, useRef, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CodeViewer } from '../components/CodeViewer';
import { WarmupBar } from '../components/WarmupBar';
import { useInferenceModel } from '../useInferenceModel';
import { softmaxT, topP, sample } from '../../llm/sampling';
import txSource from '../../llm/transformer.ts?raw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const EPS = 1e-9;

/** End-to-end: type a prompt and watch the real model stream tokens, one at a time. */
function StreamingRunLab() {
  const { model, ready, progress } = useInferenceModel({ seed: 3 });
  const [prompt, setPrompt] = useState('the queen');
  const [ids, setIds] = useState<number[]>([]);
  const [running, setRunning] = useState(false);

  const idsRef = useRef<number[]>([]);
  const timer = useRef<number | null>(null);
  const promptLenRef = useRef(0);

  function stop() {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setRunning(false);
  }

  function run() {
    stop();
    const pIds = model.encodeIds(prompt);
    if (pIds.length === 0) return;
    idsRef.current = pIds.slice();
    promptLenRef.current = pIds.length;
    setIds(pIds.slice());
    setRunning(true);
    const maxLen = Math.min(model.T, pIds.length + 24);
    timer.current = window.setInterval(() => {
      const cur = idsRef.current;
      if (cur.length >= maxLen) {
        stop();
        return;
      }
      const ctx = cur.slice(-model.T);
      const cache = model.forward(ctx);
      const probsRaw = cache.probs[cache.probs.length - 1];
      const shaped = topP(softmaxT(probsRaw.map((x) => Math.log(x + EPS)), 0.8), 0.9);
      const chosen = sample(shaped);
      const next = [...cur, chosen];
      idsRef.current = next;
      setIds(next);
    }, 110);
  }

  useEffect(() => () => stop(), []);

  return (
    <div className="lab">
      <WarmupBar ready={ready} progress={progress} />
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-xs text-muted-foreground">Prompt</label>
        <Input
          style={{ marginBottom: 0, maxWidth: 260 }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button size="sm" onClick={run} disabled={!ready || running}>
          {running ? 'Writing…' : 'Generate ▶'}
        </Button>
        {running && (
          <Button size="sm" variant="outline" onClick={stop}>Stop</Button>
        )}
      </div>
      <div
        className="rounded-xl border bg-zinc-900 p-4 font-mono text-[0.85rem] leading-relaxed text-zinc-100 whitespace-pre-wrap break-words min-h-[54px]"
        style={{ marginTop: 10, minHeight: 60 }}
      >
        {ids.length === 0 ? (
          <span className="dim">
            {ready ? 'Press Generate ▶ and watch it write one token at a time.' : 'Warming up the model…'}
          </span>
        ) : (
          <>
            {ids.map((id, i) => (
              <span key={i} className={i < promptLenRef.current ? 'font-bold text-amber-300' : undefined}>
                {(i > 0 && model.vocab[id] !== '.' ? ' ' : '') + model.vocab[id]}
              </span>
            ))}
            {running && <span className="cursor-blink">▊</span>}
          </>
        )}
      </div>
      <div className="rounded-lg border bg-muted/40 px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-foreground/90">
        Use kingdom words (“the king”, “the fox”, “the princess”). A single tiny head won’t
        write poetry, but every word you see was tokenized, embedded, swept through
        attention, scored, and sampled, live, in your browser.
      </div>
    </div>
  );
}

const RECAP = [
  ['✍️', 'Your message', 'plain text you typed'],
  ['🧾', 'Chat wrapper', 'roles + special tokens frame it'],
  ['✂️', 'Tokens', 'text → known pieces → integer ids'],
  ['📐', 'Vectors', 'each id looks up a vector, + position'],
  ['🔀', 'Forward pass', 'attention + feed-forward, layer by layer'],
  ['📊', 'Scores', 'one logit per word → softmax → probabilities'],
  ['🎲', 'Pick a word', 'temperature + top-p, then sample one token'],
  ['🔁', 'Loop', 'append it, feed back, repeat, until a stop'],
];

function Recap() {
  return (
    <div className="flex flex-col">
      {RECAP.map(([g, t, d], i) => (
        <div className="grid grid-cols-[22px_26px_130px_1fr] items-center gap-2.5 border-b py-2 last:border-b-0" key={i}>
          <span className="text-center font-mono text-[0.7rem] text-muted-foreground">{i + 1}</span>
          <span className="text-center text-[17px]">{g}</span>
          <span className="font-bold text-[0.84rem]">{t}</span>
          <span className="text-[0.8rem] text-foreground/90">{d}</span>
        </div>
      ))}
    </div>
  );
}

export function ChapterInferenceRun() {
  const engine = useMemo(() => txSource, []);
  return (
    <ChapterFrame id="inference-run">
      <Beat as="p" className="lead">
        This is the payoff. Every mechanism from Part 2 (tokenizing, the chat wrapper,
        embeddings, the forward pass, the scores, sampling, the loop) now runs together, on
        a real model, in your browser. Type a prompt and watch a reply assemble itself one
        token at a time.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The whole inference pipeline, live. Each token streams in the instant it’s sampled, exactly what you see when a chatbot “types”.">
          <StreamingRunLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🎬">
          <strong>That flicker of words is the entire trick.</strong> There’s no plan, no
          draft, no lookahead. The model committed to one word, fed the longer text back
          into itself, and chose again, a few dozen times, and a sentence fell out. Fluency
          is what a very good next-word guesser looks like when you run it in a loop.
        </Callout>
      </Beat>

      <Beat as="h2">The journey, start to finish</Beat>
      <Beat as="p">
        Here’s the whole trip your message took, in order. Read it top to bottom and notice
        how little of it is new: almost every step is a piece you built in Part 1, now
        working in reverse-gear to <em>use</em> the model instead of train it.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · One message → one reply, every stop on the way. Steps 5–8 repeat once per generated word.">
          <Recap />
        </Figure>
      </Beat>

      <Beat as="h2">The complete engine, in one file</Beat>
      <Beat as="p">
        And here is the actual model running above, the same <code>transformer.ts</code>{' '}
        you studied in Part 1, no libraries. Everything the streaming demo does calls into
        this: <code>forward</code> is the sweep through the layers, the readout produces the
        scores, and <code>generate</code> is the loop. You’ve now watched every line of it
        turn, from both sides, training and inference.
      </Beat>

      <Beat>
        <CodeViewer code={engine} filename="src/llm/transformer.ts" lang="typescript" />
      </Beat>

      <Beat as="h2">What we deliberately left out</Beat>
      <Beat as="p">
        To keep the machine legible, this Part covered only the raw act of turning a message
        into a reply. Real assistants wrap more around it, but notice that all of it is{' '}
        <em>plumbing that changes the input text or post-processes the output</em>; the
        engine in the middle is exactly what you just saw.
      </Beat>
      <Beat>
        <ul className="point-list">
          <li><span className="point-num">+</span><div><strong>Tools &amp; retrieval.</strong> The model can be given text from a search, a database, or a function call, but that just becomes more tokens in the prompt.</div></li>
          <li><span className="point-num">+</span><div><strong>Streaming infrastructure, batching, quantization.</strong> Engineering that makes inference fast and cheap at scale, without changing what’s computed.</div></li>
          <li><span className="point-num">+</span><div><strong>Safety filters &amp; system prompts.</strong> Extra instructions and checks around the edges of the same loop.</div></li>
        </ul>
      </Beat>

      <Beat>
        <Callout emoji="🎓" tone="neutral">
          <strong>You now understand both halves.</strong> Part 1 built and trained a
          language model from nothing. Part 2 followed a single message all the way through
          the finished machine and back out as words. Tokenize, embed, attend, score, sample,
          repeat, that loop, at staggering scale, is every answer you’ve ever gotten from an
          LLM.
        </Callout>
      </Beat>

      <Beat as="p">
        That’s the whole story, end to end. If you want to see where all of this is heading
        next, longer memories, new architectures, models that act, the epilogue back in
        Part 1 is waiting.
      </Beat>
    </ChapterFrame>
  );
}
