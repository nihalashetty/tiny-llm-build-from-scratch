import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { ChapterRef } from '../components/ChapterRef';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { LossCurve } from '../viz/LossCurve';
import { AttentionHeatmap } from '../viz/AttentionHeatmap';
import {
  PipelineDiagram,
  QKVDiagram,
  AttentionArcs,
  FeedForwardDiagram,
  StackedBlocks,
} from '../viz/TransformerDiagrams';
import { useRafTrainer } from '../useRafTrainer';
import { TinyTransformer } from '../../llm/transformer';
import { corpusText } from '../../llm/corpus/little-kingdom';
import txSource from '../../llm/transformer.ts?raw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function TransformerLab() {
  const t = useRafTrainer(
    () => new TinyTransformer(corpusText, { dim: 24, context: 16, lr: 0.01, seed: 3 }),
    (m) => m.trainStep(),
    1200,
    2,
  );
  const m = t.model;
  const [prompt, setPrompt] = useState('the queen ');
  const [output, setOutput] = useState<{ prompt: string; text: string } | null>(null);

  return (
    <div className="lab">
      <div className="lab-controls">
        <Button size="sm" onClick={t.start} disabled={t.running || t.done}>
          {t.epoch > 0 ? 'Resume ▶' : 'Train ▶'}
        </Button>
        <Button size="sm" variant="outline" onClick={t.pause} disabled={!t.running}>
          Pause
        </Button>
        <Button size="sm" variant="outline" onClick={t.reset}>
          Reset
        </Button>
        <span className="lab-stats">
          <span>
            step <b>{t.epoch}</b>
          </span>
          <span>
            loss <b>{t.loss === null ? '-' : t.loss.toFixed(3)}</b>
          </span>
        </span>
      </div>

      <LossCurve history={t.lossHistory} max={5} />

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="font-mono text-xs text-muted-foreground">Prompt</label>
          <Input
            className="max-w-[260px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => setOutput(m.generate(prompt, 40, 0.8, 0.9))}
          >
            Generate ▶
          </Button>
        </div>
        <div className="mt-2.5 rounded-xl border bg-zinc-900 p-4 font-mono text-[0.8rem] leading-relaxed text-zinc-100 whitespace-pre-wrap break-words">
          {output ? (
            <>
              <span className="font-bold text-amber-300">{output.prompt}</span>
              {output.text.slice(output.prompt.length)}
            </>
          ) : (
            <span className="dim">
              {t.epoch < 250
                ? 'Train for a bit first, then generate - an untrained model just babbles.'
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
    () => new TinyTransformer(corpusText, { dim: 24, context: 16, lr: 0.01, seed: 5 }),
    (m) => m.trainStep(),
    800,
    2,
  );
  const m = t.model;
  const [text, setText] = useState('the queen sits on the throne');
  const attn = useMemo(() => m.attentionFor(text), [m, text, t.tick]);

  return (
    <div className="lab">
      <div className="lab-controls">
        <Button size="sm" onClick={t.start} disabled={t.running || t.done}>
          {t.epoch > 0 ? 'Resume ▶' : 'Train ▶'}
        </Button>
        <Button size="sm" variant="outline" onClick={t.pause} disabled={!t.running}>
          Pause
        </Button>
        <Button size="sm" variant="outline" onClick={t.reset}>
          Reset
        </Button>
        <span className="lab-stats">
          <span>
            step <b>{t.epoch}</b>
          </span>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-xs text-muted-foreground">Text</label>
        <Input
          className="max-w-[260px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="dim" style={{ fontSize: 12, margin: '2px 0 8px' }}>
        Use words from the story (e.g. “the king wears a gold crown”); unknown words are skipped.
      </div>
      <AttentionHeatmap tokens={attn.tokens} alpha={attn.alpha} />
    </div>
  );
}

export function Chapter5Transformers() {
  return (
    <ChapterFrame id="transformers">
      <Beat>
        <blockquote className="my-6 flex flex-col gap-2 rounded-r-xl border-l-4 border-primary bg-muted px-6 py-5">
          <span className="text-2xl sm:text-[2.2rem] font-bold leading-tight tracking-tight text-foreground">“Attention Is All You Need”</span>
          <span className="font-mono text-xs text-foreground/80">Vaswani et al., 2017 - the paper that created the transformer</span>
        </blockquote>
      </Beat>

      <Beat as="p" className="lead">
        Embeddings give words meaning, but not <em>context</em>. “The bank of the
        river” and “money in the bank” share a word that means two different
        things - and order matters: “dog bites man” ≠ “man bites dog”. For years,
        models read one word at a time and forgot the start of a long sentence by
        the end. Then, in 2017, a paper with a cheeky title changed everything.
      </Beat>

      <Beat>
        <CitationCard ids={['attention-2014', 'gnmt-2016', 'attention-is-all-2017']} />
      </Beat>

      <Beat as="p">
        This is the deepest machine in the whole course, so we'll go slowly and
        build it one honest piece at a time - using a single sentence,{' '}
        <strong>“The cat sat on the mat,”</strong> the whole way through. Don't
        worry if it feels like a lot; every piece is something you've basically
        already met.
      </Beat>

      <Beat as="h2">First, the whole machine at a glance</Beat>
      <Beat as="p">
        Before the parts, here's the shape of the whole thing. Text comes in as
        tokens; we stamp each with its position; the tokens flow through a{' '}
        <strong>stack of identical blocks</strong> (this is where all the thinking
        happens); a final <strong>readout</strong> turns the last position into a
        score for every possible next token; we pick one and feed the whole thing
        back in to get the next. That's it - everything below is just{' '}
        <em>what's inside one block.</em>
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The whole transformer, end to end. Everything interesting lives in the repeated block - attention, then feed-forward - which we're about to open up.">
          <PipelineDiagram />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🎯">
          <strong>The only goal, ever:</strong> given the words so far, predict the
          next one. Every gear inside exists to make that one guess better. Keep
          that in mind and the whole design starts to make sense.
        </Callout>
      </Beat>

      <Beat as="h2">Step 1 - every word becomes three things: Query, Key, Value</Beat>
      <Beat as="p">
        Picture the six words of our sentence standing in a room, each needing to
        figure out what it means <em>here</em>, in this company. To do that, every
        word produces three small vectors from its embedding - think of them as
        three roles it plays at once:
      </Beat>

      <Beat>
        <ul className="point-list">
          <li>
            <span className="point-num" style={{ background: '#d9534f' }}>Q</span>
            <div>
              <strong>Query - “what am I looking for?”</strong> The word{' '}
              <code>sat</code> is a verb; its query is essentially the question{' '}
              <em>“who did the sitting?”</em>
            </div>
          </li>
          <li>
            <span className="point-num" style={{ background: '#3e6ff0' }}>K</span>
            <div>
              <strong>Key - “what do I offer?”</strong> A little advertisement of
              what this word is. <code>cat</code>'s key basically says{' '}
              <em>“I'm a noun, an animal, a subject.”</em>
            </div>
          </li>
          <li>
            <span className="point-num" style={{ background: '#10866a' }}>V</span>
            <div>
              <strong>Value - “what will I hand over if you pick me?”</strong> The
              actual content a word contributes once someone decides to listen to it.
            </div>
          </li>
        </ul>
      </Beat>

      <Beat as="p">
        Where do these come from? Each is just the word's vector multiplied by a
        learned weight matrix - <code>Wq</code>, <code>Wk</code>, <code>Wv</code>.
        That's the exact same “multiply by weights” move from the neural-network
        chapter, three times over. Nothing new; just three different lenses on the
        same word.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · Every word spins off a Query (what it wants), a Key (what it advertises), and a Value (what it contributes). Just the word's vector times three learned matrices.">
          <QKVDiagram />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🤔">
          <strong>Why three vectors, not just one?</strong> Because a word plays three
          roles a single vector can't. What a word <em>is</em> (“I'm cat”) is not what
          it's <em>looking for</em> (<code>sat</code> is hunting for a subject) or what
          it <em>offers</em> to share. If words just compared their raw embeddings,{' '}
          <code>sat</code> could only find words similar to <em>itself</em> - other
          verbs. The separate Query and Key let <code>sat</code> advertise one thing
          (“I'm a verb”) while searching for another (“who's my subject?”). That
          mismatch is the whole trick.
        </Callout>
      </Beat>

      <Beat as="h2">Step 2 - attention: each word looks around and pulls in what matters</Beat>
      <Beat as="p">
        Here's the heart of it. Take <code>sat</code>, holding its query{' '}
        <em>“who did the sitting?”</em> It compares that query against{' '}
        <em>every</em> other word's key, one by one. “Comparing” is just a{' '}
        <strong>dot product</strong> - a single number that's large when two vectors
        point the same way (remember cosine from the last chapter? same idea). The
        query for <code>sat</code> lines up strongly with the key for{' '}
        <code>cat</code> (“I'm the subject!”) and weakly with everything else.
      </Beat>

      <Beat as="p">
        Those raw scores get squashed through <strong>softmax</strong> into
        percentages that add up to 100% - the <em>attention weights.</em> Then{' '}
        <code>sat</code> builds its new vector by <strong>blending the Values</strong>{' '}
        of the words it scored, in exactly those proportions. If it put 60% of its
        attention on <code>cat</code>, it pulls in 60% of <code>cat</code>'s value.
        After this step, the vector for <code>sat</code> literally carries a big dose
        of “cat” - the word now <em>knows who sat.</em>
      </Beat>

      <Beat as="p">
        Try it. Click any word below to make it the “current” one and watch which
        earlier words it reaches back to, and how their values get blended into its
        new vector.
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · Attention, one word at a time. The current word compares its query to every earlier key, then blends their values by the resulting weights. Click a word to move the spotlight.">
          <AttentionArcs />
        </Figure>
      </Beat>

      <Beat as="p">
        And this happens for <em>every</em> word at once, in parallel - a whole
        table of “who is looking at whom,” computed in one shot. That parallelism is
        exactly why transformers train so much faster than the old read-one-word-at-
        a-time models, and it's the literal meaning of the paper's title:{' '}
        <em>attention is all you need.</em>
      </Beat>

      <Beat as="h3">The one rule: no peeking at the future</Beat>
      <Beat as="p">
        Because the whole job is to predict the <em>next</em> word, we can't let a
        word look at words that come after it - that would be reading the answer off
        the back of the book. So we add a <strong>causal mask</strong>: each word may
        attend only to itself and the words before it. In the diagram above, that's
        why the words to the right go grey. In the live heatmap below, it's why every
        row is blank past the diagonal.
      </Beat>

      <Beat as="p">
        Enough schematics - here's a real transformer, training in your browser on
        whole-word tokens. (Real models use <em>subword</em> tokens like the BPE
        pieces from <ChapterRef id="tokenization" />; we use whole words here so the
        grid stays readable.)
        Train it a moment, then type a phrase and read the heatmap: each row is one
        word deciding where to look, brighter meaning more attention.
      </Beat>

      <Beat>
        <Figure caption="Fig 4 · Real attention weights from a model trained live - now over whole words. Each row (a word) looks back at earlier columns; everything past the diagonal is masked, so the future stays off-limits.">
          <AttentionWidget />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="💡">
          <strong>So what did attention actually buy us?</strong> Before it, the vector
          for <code>the</code> was identical everywhere it appeared - useless for
          guessing what follows. <em>After</em> it, every word's vector is soaked in its
          context: <code>sat</code> now carries “a cat did this”; the second{' '}
          <code>the</code> knows it comes right after <code>on</code>. To predict what
          follows “the cat sat on the ___”, the model needs that final slot to know
          about <code>sat</code> and <code>on</code> - and attention is precisely how
          that information travelled there. No attention, no context; no context, no
          sensible next word.
        </Callout>
      </Beat>

      <Beat>
        <Callout emoji="👓">
          <strong>One more thing, so you're not surprised later: multiple heads.</strong>{' '}
          Real models don't run attention once - they run several{' '}
          <em>heads</em> in parallel, each with its own Q/K/V lenses. One head might
          track grammatical subjects, another might track nearby words, another
          long-range links. Their results are stitched together. Our runnable model
          uses a single head to stay legible; the idea is just “do this a few times
          at once, looking for different things.”
        </Callout>
      </Beat>

      <Beat as="h2">Step 3 - feed-forward: each word thinks for itself</Beat>
      <Beat as="p">
        Attention was the <em>social</em> step: words gathered information from each
        other. The next step is the <em>private</em> one. Each word - now carrying
        everything it just pulled in - passes through a small{' '}
        <strong>feed-forward network</strong> all on its own: expand the vector into
        a much bigger space, apply a nonlinearity (<strong>ReLU</strong> - keep the
        positive parts, zero out the rest), then compress back to the original size.
      </Beat>

      <Beat as="p">
        If attention is walking around the party collecting gossip, the feed-forward
        is going home afterward and quietly thinking it over. It's applied to every
        position separately with the same weights, and it's where a huge share of the
        model's raw “knowledge” - patterns, facts, associations - actually lives.
      </Beat>

      <Beat>
        <Figure caption="Fig 5 · The feed-forward network: expand each word's vector into a wider space, apply ReLU, compress back. Same little network, run on every position independently.">
          <FeedForwardDiagram />
        </Figure>
      </Beat>

      <Beat as="p">
        Why do we need this <em>on top of</em> attention? Because attention only{' '}
        <em>moves information around</em> - at heart it's a weighted average, a fairly
        gentle, linear operation. It can carry <code>cat</code> over to <code>sat</code>,
        but it can't, by itself, compute a rule like “a royal subject followed by{' '}
        <code>wears</code> tends to precede <code>crown</code>.” The feed-forward's
        nonlinearity (that ReLU) is what lets the model actually detect patterns and
        recall associations - it's where a lot of what the model “knows” is stored.
        The cleanest way to hold the two apart:{' '}
        <strong>attention decides what to look at; the feed-forward decides what to
        make of it.</strong> Communication, then computation.
      </Beat>

      <Beat>
        <Callout emoji="🛣️">
          <strong>Two quiet helpers hold it together.</strong> Each sub-step doesn't
          <em> replace</em> a word's vector - it <em>adds</em> a correction to it.
          That's a <strong>residual connection</strong>, a highway that lets the
          original signal (and, during training, the gradient) flow straight through
          many layers without getting lost. And between steps we{' '}
          <strong>normalize</strong> the numbers (layer norm) so nothing balloons or
          vanishes. Add + normalize, over and over - that's what makes very deep
          stacks trainable at all.
        </Callout>
      </Beat>

      <Beat as="h2">Step 4 - stack the blocks: syntax → meaning → reasoning</Beat>
      <Beat as="p">
        Put it together and <strong>one block</strong> is: attention (look around),
        then feed-forward (think), with residual-add and normalize around each. Now
        the trick that makes it powerful - <strong>do it again. And again.</strong>{' '}
        Feed the output of one block straight into the next, a dozen or a hundred
        times.
      </Beat>

      <Beat as="p">
        Something remarkable emerges from the repetition. The <em>early</em> blocks
        tend to sort out surface structure - word order, parts of speech, which words
        clump together. <em>Middle</em> blocks resolve meaning - which <code>the</code>
        {' '}refers to which noun, what sense a word is being used in, who the named
        entities are. <em>Later</em> blocks handle the genuinely abstract - intent,
        sentiment, what ought to come next. Nobody assigns these jobs; the layers
        divide the labour on their own.
      </Beat>

      <Beat>
        <Figure caption="Fig 6 · Stacking blocks builds understanding in layers: grammar first, then meaning, then reasoning. Each row is a rough sense of what deeper blocks tend to figure out.">
          <StackedBlocks />
        </Figure>
      </Beat>

      <Beat as="h3">Where does word order come from?</Beat>
      <Beat as="p">
        One loose end. Attention, by itself, treats the words as an unordered{' '}
        <em>bag</em> - swap two words and the math barely notices. But “dog bites man”
        and “man bites dog” are not the same sentence! The fix is small and clever:
        before the first block, we <strong>add a positional stamp</strong> to each
        token's vector - a distinct pattern for position 1, 2, 3, and so on. Now the
        same word in a different slot arrives as a slightly different vector, and
        attention can tell them apart. That's the “+ position” box back in Fig 1.
      </Beat>

      <Beat as="h2">Watch it actually generate</Beat>
      <Beat as="p">
        Here's the whole architecture - Q/K/V attention, feed-forward, residuals,
        positions, all of it - training on the Little Kingdom text. Hit{' '}
        <strong>Train</strong> and watch the loss fall; then <strong>Generate</strong>.
        A single tiny head won't write poetry, but you'll watch it pull the kingdom's
        words and rhythms out of thin air - learned only by predicting the next
        word, over and over, using every mechanism you just met.
      </Beat>

      <Beat>
        <Figure caption="Fig 7 · A real, from-scratch transformer - one block, one head, plus the feed-forward - learning live. The loss falls fast; generation holds together for a clause or two of real kingdom text, then wanders - the ceiling for a model this tiny.">
          <TransformerLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🔍">
          <strong>It reads like a half-dream - do we need more data?</strong> Not really.
          Because it works with whole words now, it only ever emits real kingdom words -
          so it nails local phrases (“the queen sat on the…”) and then wanders, because
          it simply hasn't the room to hold a whole thought. It's <em>one</em> block,{' '}
          <em>one</em> attention head, 24 numbers per token, trained for a few seconds on
          a few hundred words. A model this small can't hold much no matter how much text
          you pour in - more data would barely move it. Fluency is a matter of{' '}
          <strong>scale</strong>: more blocks, more heads, wider vectors, subword tokens,
          and vastly more text and training (remember <ChapterRef id="tokenization" /> -
          real models train on{' '}
          <em>trillions</em> of tokens). Our goal here wasn't to rival GPT; it was to
          watch every gear of the real machine turn with our own eyes.
        </Callout>
      </Beat>

      <Beat as="h2">The code (self-attention, by hand)</Beat>
      <Beat as="p">
        No libraries - the forward pass and the full backprop through attention{' '}
        <em>and</em> the feed-forward are written out by hand (it's one block with a
        single head; multi-head, stacking and layer-norm are the pieces we left out). You now
        know every idea in it: the Q/K/V projections, the dot-product scores, the
        softmax, the value blend, the feed-forward. Look for the causal loop{' '}
        <code>for (s = 0; s ≤ t; s++)</code>: that one bound is the entire “don't look
        at the future” rule.
      </Beat>

      <Beat>
        <CodeViewer code={txSource} filename="src/llm/transformer.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        The model now outputs a <em>score for every possible next token</em>. But
        how do we turn those scores into an actual choice - and keep doing it to
        build a whole sentence? That's the final mechanism: sampling.
      </Beat>
    </ChapterFrame>
  );
}
