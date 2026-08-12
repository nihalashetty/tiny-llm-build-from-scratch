import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { AttentionHeatmap } from '../viz/AttentionHeatmap';
import { StackedBlocks } from '../viz/TransformerDiagrams';
import { WarmupBar } from '../components/WarmupBar';
import { useInferenceModel } from '../useInferenceModel';

/**
 * The forward pass at read-time: feed a whole prompt in at once and watch the
 * real attention weights, every token reading the tokens before it. No training
 * button; the model is already warm and frozen.
 */
function ForwardLab() {
  const { model, ready, progress, tick } = useInferenceModel({ seed: 5 });
  const [text, setText] = useState('the queen sits on the throne');
  const attn = useMemo(() => model.attentionFor(text), [model, text, tick]);

  return (
    <div className="lab">
      <WarmupBar ready={ready} progress={progress} />
      <div className="field">
        <label>Prompt</label>
        <input
          className="tokenize-input"
          style={{ marginBottom: 0, maxWidth: 320 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="dim" style={{ fontSize: 12, margin: '2px 0 8px' }}>
        Use words from the story (e.g. “the king wears a gold crown”); unknown words are skipped.
        Each row is one token deciding where to look; brighter = more attention.
      </div>
      <AttentionHeatmap tokens={attn.tokens} alpha={attn.alpha} />
    </div>
  );
}

export function ChapterInferenceForward() {
  return (
    <ChapterFrame id="inference-forward">
      <Beat as="p" className="lead">
        We now have a stack of vectors, one per token of your prompt, waiting at the
        door of the network. The <strong>forward pass</strong> is what happens when we
        push them through. It’s the heaviest step, and also the calmest: no learning, no
        weight changes, just one clean flow from input to output.
      </Beat>

      <Beat as="h2">Training’s round trip vs. inference’s one-way street</Beat>
      <Beat as="p">
        In Part 1, every training step did a <em>forward</em> pass to make a prediction,
        then a <em>backward</em> pass to measure the error and nudge the weights. At
        inference, the backward half is gone entirely. The weights are frozen, so there’s
        nothing to nudge. We only ever run forward, which is why answering is thousands of
        times cheaper than training.
      </Beat>

      <Beat>
        <Callout emoji="➡️">
          <strong>Inference = forward only.</strong> Data goes in one end, a prediction
          comes out the other, and nothing about the model is left changed. Same machine
          you built; we just unplugged the learning half.
        </Callout>
      </Beat>

      <Beat as="h2">Inside the sweep: attention, then thinking, stacked</Beat>
      <Beat as="p">
        You already dissected what’s inside, so here it’s only a reminder in its new
        costume. The vectors flow through a stack of identical <strong>blocks</strong>. In
        each block: <strong>attention</strong> lets every token look back at earlier tokens
        and pull in what it needs (the “communication” step), then a small{' '}
        <strong>feed-forward</strong> network lets each token think about what it gathered
        (the “computation” step). Residual highways and normalization keep the signal clean
        as it climbs.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The vectors climb a stack of identical blocks. Early blocks tend to sort out grammar, middle blocks meaning, later blocks intent, labour the layers divide up on their own.">
          <StackedBlocks />
        </Figure>
      </Beat>

      <Beat as="h2">Watch a real prompt being read</Beat>
      <Beat as="p">
        Here is the actual attention from our tiny model, reading your prompt in one pass.
        Every row is a token asking “what should I look at?”, and the bright cells are the
        earlier tokens it leans on. The whole upper triangle is dark because of the{' '}
        <strong>causal mask</strong>: a token may look backward and at itself, never
        forward. Reading the future would be cheating, the model’s job is to predict it.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · Real attention weights, computed live at inference. The entire prompt is processed in a single forward pass, this is often called the “prefill”.">
          <ForwardLab />
        </Figure>
      </Beat>

      <Beat as="h2">The whole prompt goes in, but we only need the last exit</Beat>
      <Beat as="p">
        Here’s a subtlety that pays off in the next two chapters. The forward pass produces
        an output vector at <em>every</em> position. But to predict the <em>next</em> word,
        we only care about the output at the <strong>very last token</strong>, it’s the
        one that has legally seen the entire prompt. All the earlier positions did their
        work by feeding information forward through attention; their final vectors are, for
        prediction purposes, just scaffolding.
      </Beat>

      <Beat>
        <Callout emoji="🏗️" tone="neutral">
          <strong>Prefill, then decode.</strong> Processing your whole prompt in one big
          pass is called the <em>prefill</em>. Producing each new word afterward, one
          token at a time, is called <em>decode</em>. Same forward pass either way; the
          difference is just how much text goes in at once. We’ll see in the loop chapter
          why keeping the prefill’s work around (the “KV cache”) is what makes streaming fast.
        </Callout>
      </Beat>

      <Beat as="p">
        So the sweep is done, and the last position now holds a vector soaked in the entire
        prompt’s meaning. One step remains before we can pick a word: turning that single
        vector into a score for every word the model knows.
      </Beat>
    </ChapterFrame>
  );
}
