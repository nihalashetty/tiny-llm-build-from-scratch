import { useMemo, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { ProbBars } from '../viz/ProbBars';
import { WarmupBar } from '../components/WarmupBar';
import { useInferenceModel } from '../useInferenceModel';

/**
 * The last step of a forward pass: the readout turns the final vector into one
 * score per vocabulary word, and softmax makes those into probabilities. Type a
 * prompt, read the model's real bet on the next word.
 */
function LogitsLab() {
  const { model, ready, progress, tick } = useInferenceModel({ seed: 3 });
  const [text, setText] = useState('the queen wears a');

  const top = useMemo(() => {
    const dist = model.nextDistribution(text);
    return [...dist]
      .sort((a, b) => b.p - a.p)
      .slice(0, 10)
      .map((d) => ({ label: d.char === '.' ? '· (period)' : d.char, p: d.p }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, model, tick]);

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
      <div className="dim" style={{ fontSize: 12, margin: '2px 0 10px' }}>
        The model scores all <b>{model.V}</b> tokens in its vocabulary; here are its top 10
        bets for what comes next. Try “the king is a” or “the fox ran into the”.
      </div>
      <ProbBars items={top} />
    </div>
  );
}

export function ChapterInferenceLogits() {
  return (
    <ChapterFrame id="inference-logits">
      <Beat as="p" className="lead">
        The forward pass is done. The last position holds one vector, packed with
        everything the model gleaned from your prompt. Now we ask the only question the
        model was ever trained to answer: <strong>what word comes next?</strong>
      </Beat>

      <Beat as="h2">One final multiply: the readout</Beat>
      <Beat as="p">
        That last vector passes through one more learned matrix, the{' '}
        <strong>readout</strong> (or “unembedding”). Out comes not one number but a whole
        list: <strong>one score for every single token in the vocabulary.</strong> These
        raw scores are called <strong>logits</strong>. A big logit means “this word fits
        well here”; a very negative one means “almost certainly not this.”
      </Beat>

      <Beat as="p">
        For our toy that’s a few dozen scores. For GPT-4 it’s a fresh list of{' '}
        ~100,000 numbers, every time it wants a single word.
      </Beat>

      <Beat as="h2">Softmax: from scores to a real bet</Beat>
      <Beat as="p">
        Logits can be any size, positive or negative, and they don’t add up to anything
        tidy. To turn them into <strong>probabilities</strong>, all positive, summing to
        exactly 100%, we run them through <strong>softmax</strong>: exponentiate each
        score, then divide by the total. Bigger logit → exponentially bigger share. Now we
        have a genuine probability distribution over “what’s next.”
      </Beat>

      <Beat>
        <Callout emoji="📊">
          <strong>This distribution is the model’s entire opinion.</strong> Everything the
          network computed (attention, feed-forward, all of it) exists to shape these
          numbers. After this point there’s no more “understanding” to do; there’s just a
          list of words with probabilities, waiting for us to pick one.
        </Callout>
      </Beat>

      <Beat as="h2">See the model’s real bet</Beat>
      <Beat as="p">
        Type a prompt and read the top of the distribution straight from our live model.
        Notice how confident it gets on easy continuations (“the queen wears a …”) and how
        it spreads its bets when several words are plausible. That spread is the model
        telling you how sure it is.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · The model’s probability distribution for the next token, top 10 shown. These are real softmax outputs from the tiny transformer, computed live.">
          <LogitsLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🎯" tone="neutral">
          <strong>Confidence is just the shape of this curve.</strong> One tall bar means
          the model is sure; a field of short, even bars means it genuinely isn’t. There’s
          no separate “confidence meter” inside an LLM, this distribution <em>is</em> the
          confidence.
        </Callout>
      </Beat>

      <Beat as="p">
        We’ve reached the fork in the road. The model has handed us a probability for every
        possible next word. But it won’t choose for us, <em>we</em> decide how to turn this
        distribution into one actual word. And then we do the surprising thing: we feed it
        back in and go again. That loop is the final mechanism.
      </Beat>
    </ChapterFrame>
  );
}
