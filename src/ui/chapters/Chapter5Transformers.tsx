import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { LossCurve } from '../viz/LossCurve';
import { AttentionHeatmap } from '../viz/AttentionHeatmap';
import { useRafTrainer } from '../useRafTrainer';
import { TinyTransformer } from '../../llm/transformer';
import { corpusText } from '../../llm/corpus/little-kingdom';
import txSource from '../../llm/transformer.ts?raw';

function TransformerLab() {
  const t = useRafTrainer(
    () => new TinyTransformer(corpusText, { dim: 24, context: 32, lr: 0.01, seed: 3 }),
    (m) => m.trainStep(),
    4000,
    20,
  );
  const m = t.model;
  const [prompt, setPrompt] = useState('the queen ');
  const [output, setOutput] = useState('');

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
            loss <b>{t.loss === null ? '—' : t.loss.toFixed(3)}</b>
          </span>
        </span>
      </div>

      <LossCurve history={t.lossHistory} max={3.4} />

      <div>
        <div className="field">
          <label>Prompt</label>
          <input
            className="tokenize-input"
            style={{ marginBottom: 0, maxWidth: 260 }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            className="btn btn-run"
            onClick={() => setOutput(m.generate(prompt, 110, 0.6, 0.9))}
          >
            Generate ▶
          </button>
        </div>
        <div className="gen-output" style={{ marginTop: 10 }}>
          {output ? (
            <>
              <span className="prompt">{prompt}</span>
              {output.slice(prompt.length)}
            </>
          ) : (
            <span className="dim">
              {t.epoch < 400
                ? 'Train for a bit first, then generate — an untrained model just babbles.'
                : 'Press Generate ▶.'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AttentionWidget() {
  const t = useRafTrainer(
    () => new TinyTransformer(corpusText, { dim: 24, context: 32, lr: 0.01, seed: 5 }),
    (m) => m.trainStep(),
    2500,
    25,
  );
  const m = t.model;
  const [text, setText] = useState('the queen sat');
  const attn = useMemo(() => m.attentionFor(text.slice(-16)), [m, text, t.tick]);

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
        </span>
      </div>
      <div className="field">
        <label>Text</label>
        <input
          className="tokenize-input"
          style={{ marginBottom: 0, maxWidth: 260 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <AttentionHeatmap tokens={attn.tokens} alpha={attn.alpha} />
    </div>
  );
}

export function Chapter5Transformers() {
  return (
    <ChapterFrame id="transformers">
      <Beat as="p" className="lead">
        Embeddings give words meaning, but not <em>context</em>. “The bank of the
        river” and “money in the bank” share a word that means two different
        things — and order matters: “dog bites man” ≠ “man bites dog”. For years,
        models read one word at a time and forgot the start of a long sentence by
        the end. Then, in 2017, a paper with a cheeky title changed everything.
      </Beat>

      <Beat>
        <CitationCard ids={['attention-2014', 'gnmt-2016', 'attention-is-all-2017']} />
      </Beat>

      <Beat as="h2">The big idea: let every word look at every other word</Beat>
      <Beat as="p">
        A <strong>transformer</strong> reads the whole sequence at once. At each
        position it asks: <em>which other words here matter to me right now?</em>{' '}
        — and pulls in information from them. That “looking around” is called{' '}
        <strong>self-attention</strong>, and it's the entire engine.
      </Beat>

      <Beat as="h3">Self-attention: query, key, value</Beat>
      <Beat as="p">
        Every word produces three little vectors. A <strong>query</strong> (“what
        am I looking for?”), a <strong>key</strong> (“what do I offer?”), and a{' '}
        <strong>value</strong> (“what will I hand over if you pick me?”). A word
        compares its query to everyone's keys; strong matches get more weight; and
        it blends their values in proportion. To keep it honest for predicting the
        <em> next</em> word, we add a <strong>causal mask</strong>: a word may
        only look <em>backward</em>, never at the future.
      </Beat>

      <Beat>
        <Callout emoji="👀">
          <strong>Query · Key = attention.</strong> If my query lines up with your
          key, I pay attention to your value. Do that for every pair of words at
          once and you get a table of “who's looking at whom” — which we can draw.
        </Callout>
      </Beat>

      <Beat as="p">
        Train the tiny model below, then type a phrase. Each row of the heatmap is
        one character deciding where to look; brighter = more attention. Notice it
        can only look left of the diagonal — the causal mask in action.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Real attention weights from a model trained live in your browser. Rows look back at columns; the future is masked out.">
          <AttentionWidget />
        </Figure>
      </Beat>

      <Beat as="h3">Feed-forward, stacking, and position</Beat>
      <Beat as="p">
        Two more pieces complete a real transformer block. After attention mixes
        information between words, a small <strong>feed-forward network</strong>{' '}
        lets each position “think” on its own for a moment. Then you{' '}
        <strong>stack</strong> these blocks — attention, think, attention, think —
        a dozen or more times, each layer refining the last. And because attention
        alone is orderless, each token also gets a <strong>positional</strong>{' '}
        signal so the model knows what came first. (Our runnable model uses one
        attention head and a readout to stay small and legible; the idea scales up
        unchanged.)
      </Beat>

      <Beat as="h2">Watch it actually generate</Beat>
      <Beat as="p">
        Here's the same architecture, training on the Little Kingdom text. Hit{' '}
        <strong>Train</strong> and watch the loss fall; then <strong>Generate</strong>.
        A single tiny head won't write poetry, but you'll see it grab the
        kingdom's words and rhythms out of thin air — learned only by predicting
        the next character, over and over.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · Loss falling as a from-scratch transformer learns; generation improves the longer you train.">
          <TransformerLab />
        </Figure>
      </Beat>

      <Beat as="h2">The code (self-attention, by hand)</Beat>
      <Beat as="p">
        No libraries — the forward pass and the full backprop through attention
        are written out. Look for the causal loop <code>for (s = 0; s ≤ t; s++)</code>:
        that one bound is the entire “don't look at the future” rule.
      </Beat>

      <Beat>
        <CodeViewer code={txSource} filename="src/llm/transformer.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        The model now outputs a <em>score for every possible next token</em>. But
        how do we turn those scores into an actual choice — and keep doing it to
        build a whole sentence? That's the final mechanism: sampling.
      </Beat>
    </ChapterFrame>
  );
}
