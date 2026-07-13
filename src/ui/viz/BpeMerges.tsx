import { useEffect, useMemo, useRef, useState } from 'react';
import { trainBpe, tokenize, type Merge } from '../../llm/bpe';
import { corpusText } from '../../llm/corpus/little-kingdom';

const SAMPLE_WORDS = ['queen', 'throne', 'morning', 'children'];

function TokenRow({ label, toks, fresh }: { label: string; toks: string[]; fresh?: string }) {
  return (
    <div className="word-row">
      <span className="word-label">{label}</span>
      <span className="tokens">
        {toks.map((t, i) => (
          <span key={i} className={`tok${fresh && t === fresh ? ' fresh' : ''}`}>
            {t}
          </span>
        ))}
      </span>
    </div>
  );
}

/**
 * Steps through BPE training on the Little Kingdom corpus: at each step it shows
 * the most frequent pair being glued together and how the showcase words shrink
 * from many character-tokens toward whole-word tokens.
 */
export function BpeMerges() {
  const result = useMemo(() => trainBpe(corpusText, 80, 2, SAMPLE_WORDS), []);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const maxStep = result.steps.length;

  useEffect(() => {
    if (!playing) return;
    if (step >= maxStep) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setStep((s) => Math.min(maxStep, s + 1)), 650);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, step, maxStep]);

  const current = step > 0 ? result.steps[step - 1] : null;
  const vocab = current ? current.vocab : result.baseVocab;
  const vocabSize = vocab.length;

  const sampleFor = (word: string): string[] =>
    current ? current.sample[word] ?? word.split('') : word.split('');

  return (
    <div className="lab">
      <div className="lab-controls">
        <button
          className="btn btn-run"
          onClick={() => (step >= maxStep ? undefined : setPlaying((p) => !p))}
          disabled={step >= maxStep}
        >
          {playing ? 'Pause' : 'Auto-merge ▶'}
        </button>
        <button
          className="btn btn-light"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0}
        >
          ◀ Step
        </button>
        <button
          className="btn btn-light"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(maxStep, s + 1));
          }}
          disabled={step >= maxStep}
        >
          Step ▶
        </button>
        <button
          className="btn btn-light"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          Reset
        </button>
      </div>

      <div className="lab-stats">
        <span>
          merge <b>{step}</b> / {maxStep}
        </span>
        <span>
          vocabulary <b>{vocabSize}</b> tokens
        </span>
      </div>

      {current ? (
        <div className="merge-eq">
          glue&nbsp;
          <span className="tok">{current.pair[0]}</span>
          <span>+</span>
          <span className="tok">{current.pair[1]}</span>
          <span className="arrow">→</span>
          <span className="tok fresh">{current.merged}</span>
          <span className="count">(seen {current.count}×)</span>
        </div>
      ) : (
        <div className="merge-eq dim">Every word starts as individual characters. Press Auto-merge.</div>
      )}

      <div className="vocab-strip">
        <span className="vocab-strip-label">
          {current ? 'vocabulary' : 'starting vocabulary — every character in the text'}
        </span>
        <span className="tokens">
          {vocab.map((t) => (
            <span key={t} className={`tok${current && t === current.merged ? ' fresh' : ''}`}>
              {t}
            </span>
          ))}
        </span>
      </div>

      <div>
        {SAMPLE_WORDS.map((w) => (
          <TokenRow key={w} label={w} toks={sampleFor(w)} fresh={current?.merged} />
        ))}
      </div>
    </div>
  );
}

/** A live tokenizer: type text, see how the learned merges split it. */
export function TokenizeBox() {
  const merges = useMemo<Merge[]>(() => trainBpe(corpusText, 80, 2).merges, []);
  const [text, setText] = useState('the queen wears a golden crown');
  const toks = tokenize(text, merges);
  const chars = text.replace(/[^a-z]/gi, '').length;

  return (
    <div className="lab">
      <input
        className="tokenize-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Text to tokenize"
        placeholder="Type a sentence…"
      />
      <div className="tokens">
        {toks.map((t, i) => (
          <span key={i} className="tok">
            {t}
          </span>
        ))}
      </div>
      <div className="token-count">
        <span>
          <b>{toks.length}</b> tokens
        </span>
        <span>
          <b>{chars}</b> letters
        </span>
        <span className="dim">≈ {(chars / Math.max(1, toks.length)).toFixed(1)} letters / token</span>
      </div>
    </div>
  );
}
