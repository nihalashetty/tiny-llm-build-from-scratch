import { useEffect, useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { ChapterRef } from '../components/ChapterRef';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { DualLossCurve } from '../viz/DualLossCurve';
import { useRafTrainer } from '../useRafTrainer';
import { TinyTransformer } from '../../llm/transformer';
import { corpusText } from '../../llm/corpus/little-kingdom';

/** Format a possibly-huge perplexity compactly. */
function ppl(loss: number | null): string {
  if (loss === null) return '-';
  const p = Math.exp(loss);
  if (p >= 1000) return `${Math.round(p).toLocaleString()}×`;
  return `${p.toFixed(1)}×`;
}

function EvaluationLab() {
  // Same from-scratch transformer as Chapter 5 - but we HIDE the last 30% of the
  // corpus. It trains only on the first 70%; the rest is unseen "exam" text.
  const t = useRafTrainer(
    () => new TinyTransformer(corpusText, { dim: 16, context: 12, lr: 0.006, seed: 4, holdout: 0.3 }),
    (m) => m.trainStep(),
    600,
    2,
  );

  // Record both losses once per animation frame, measured the same way.
  const [train, setTrain] = useState<number[]>([]);
  const [val, setVal] = useState<number[]>([]);
  useEffect(() => {
    if (t.loss === null) {
      setTrain([]);
      setVal([]);
      return;
    }
    setTrain((s) => [...s, t.model.trainLoss()]);
    setVal((v) => [...v, t.model.evalLoss()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.tick]);

  const lastTrain = train.length ? train[train.length - 1] : null;
  const lastVal = val.length ? val[val.length - 1] : null;
  const baseline = Math.log(t.model.vocab.length); // loss of a model that just guesses

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

      <DualLossCurve train={train} val={val} baseline={baseline} />

      <div className="lab-stats" style={{ marginTop: 6 }}>
        <span style={{ color: 'var(--coral-deep)' }}>
          training loss <b>{lastTrain === null ? '-' : lastTrain.toFixed(2)}</b> · perplexity{' '}
          <b>{ppl(lastTrain)}</b>
        </span>
        <span style={{ color: '#3e6ff0' }}>
          held-out loss <b>{lastVal === null ? '-' : lastVal.toFixed(2)}</b> · perplexity{' '}
          <b>{ppl(lastVal)}</b>
        </span>
      </div>
      <div className="lab-hint">
        The <b style={{ color: 'var(--coral-deep)' }}>coral</b> line is loss on text the model
        trains on; the <b style={{ color: '#3e6ff0' }}>blue</b> line is loss on the held-out tail
        it never sees. Watch them start together and fan apart - coral diving toward zero while blue
        climbs past “random guess.” That growing gap <em>is</em> overfitting.
      </div>
    </div>
  );
}

export function ChapterEvaluation() {
  return (
    <ChapterFrame id="evaluation">
      <Beat as="p" className="lead">
        In <ChapterRef id="transformers" /> you watched a loss curve dive and
        thought, reasonably,{' '}
        <em>“it's working.”</em> But a falling training loss can be a lie. Before we
        make anything bigger, we need the one habit that separates a model that's{' '}
        <strong>learning</strong> from one that's just <strong>memorizing</strong>:
        testing it on words it has never seen.
      </Beat>

      <Beat as="h2">The number you've been watching: loss</Beat>
      <Beat as="p">
        Every training demo in this course reports a <strong>loss</strong> - one
        number for “how wrong.” For a language model it's the{' '}
        <strong>cross-entropy</strong>: essentially the model's <em>surprise</em> at
        the token that actually came next. Guess the right word with high confidence
        and the loss is tiny; get blindsided and it spikes. Training just nudges the
        weights to be surprised a little less, over and over.
      </Beat>

      <Beat as="h2">A perfect score on an exam you wrote yourself</Beat>
      <Beat as="p">
        Here's the trap. If we grade the model on the <em>same</em> text it trained
        on, a big enough model can simply <strong>memorize</strong> it and score
        perfectly - while having learned nothing that transfers to a new sentence.
        That's like acing a test because you'd already seen the answer key.
      </Beat>
      <Beat as="p">
        The fix is a rule as old as machine learning: <strong>split your data.</strong>{' '}
        Train on one part, then measure the loss on a <strong>held-out</strong> part
        the model never touched. Low loss on <em>held-out</em> text is the real thing -
        it means the model captured patterns of the language, not just the answer key.
      </Beat>

      <Beat as="h2">Watch it overfit, live</Beat>
      <Beat as="p">
        Same from-scratch transformer as <ChapterRef id="transformers" /> - but this
        time we hide the last
        30% of the Little Kingdom text. The model trains only on the first 70%; the
        rest is its exam. Press <strong>Train</strong> and watch the two losses:
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Training loss (coral) vs. loss on held-out text (blue). They start together, then the model memorizes the training half - coral keeps falling while blue climbs past the ‘random guess’ line. That gap is overfitting, drawn live.">
          <EvaluationLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="⚠️">
          <strong>Overfitting</strong> is when a model keeps getting better on the text
          it studies and <em>worse</em> on everything else. It happens fastest when the
          model is large relative to the data - and our corpus is only a few hundred
          words, so it overfits almost immediately. Real models fight it with the
          opposite ratio: an ocean of data (<ChapterRef id="scaling" />), plus tricks
          like early stopping
          and dropout. The held-out curve is the alarm bell that tells you when to stop.
        </Callout>
      </Beat>

      <Beat as="h2">Perplexity: the loss in plain English</Beat>
      <Beat as="p">
        Loss is measured in awkward units (log-probabilities), so people often quote{' '}
        <strong>perplexity</strong> instead - just <code>e</code> raised to the loss.
        It has a lovely interpretation: <em>how many equally-likely words the model
        feels torn between</em> at each step. Perplexity 1 means dead certain;
        perplexity 20 means “as unsure as rolling a fair 20-sided die.”
      </Beat>
      <Beat as="p">
        Watch the two perplexities in the demo. On text it trained on, it drops toward
        1 - near-certain, because it memorized. On held-out text it balloons into the
        thousands: with a vocabulary of only ~100 words, it's <em>more</em> lost than
        blind guessing, confidently predicting the wrong word. This is exactly the
        redundancy Shannon measured in 1951 - a good model is one that finds English
        (or Little-Kingdom-ish) genuinely <em>un</em>-surprising.
      </Beat>

      <Beat>
        <CitationCard ids={['shannon-1951', 'perplexity']} />
      </Beat>

      <Beat as="h2">Past perplexity: does it actually help?</Beat>
      <Beat as="p">
        Low held-out perplexity says a model is <em>fluent</em> - but not that it's{' '}
        <em>useful</em>. So real models are also scored on <strong>benchmarks</strong>:
        big suites of questions across grade-school math, coding, trivia, reading
        comprehension and reasoning, plus head-to-head <strong>human preference</strong>
        votes. Perplexity is the cheap daily check-up; benchmarks and human ratings are
        the real exam - and, as the next chapters show, both improve in a strikingly
        predictable way as you add scale.
      </Beat>

      <Beat as="p">
        So generalization is the goal, and more data is one big lever. What <em>else</em>
        does sheer scale buy - and why did the whole field bet on “just make it bigger”?
        That's next.
      </Beat>
    </ChapterFrame>
  );
}
