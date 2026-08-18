import { useEffect, useMemo, useRef, useState } from 'react';
import { trainBpe, tokenize, type Merge } from '../../llm/bpe';
import { corpusText } from '../../llm/corpus/little-kingdom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const SAMPLE_WORDS = ['queen', 'throne', 'morning', 'children'];

function TokenRow({ label, toks, fresh }: { label: string; toks: string[]; fresh?: string }) {
  return (
    <div className="my-2 flex items-center gap-3">
      <span className="min-w-[84px] text-right font-mono text-xs text-muted-foreground">{label}</span>
      <span className="tokens">
        {toks.map((t, i) => (
          <span key={i} className={cn('tok', fresh && t === fresh && 'fresh')}>
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
        <Button
          size="sm"
          onClick={() => (step >= maxStep ? undefined : setPlaying((p) => !p))}
          disabled={step >= maxStep}
        >
          {playing ? 'Pause' : 'Auto-merge ▶'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0}
        >
          ◀ Step
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(maxStep, s + 1));
          }}
          disabled={step >= maxStep}
        >
          Step ▶
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          Reset
        </Button>
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
        <div className="my-1 flex flex-wrap items-center gap-2.5 font-mono text-base">
          glue&nbsp;
          <span className="tok">{current.pair[0]}</span>
          <span>+</span>
          <span className="tok">{current.pair[1]}</span>
          <span className="text-muted-foreground">→</span>
          <span className="tok fresh">{current.merged}</span>
          <span className="text-xs text-muted-foreground">
            most common pair - seen {current.count}× across the whole corpus
          </span>
        </div>
      ) : (
        <div className="my-1 flex flex-wrap items-center gap-2.5 font-mono text-base text-muted-foreground">
          Every word starts as individual characters. Press Auto-merge.
        </div>
      )}

      <div className="my-3 max-h-[132px] overflow-y-auto rounded-xl border border-dashed p-3">
        <span className="mb-2 block font-mono text-[0.72rem] text-muted-foreground">
          {current ? 'vocabulary' : 'starting vocabulary - every character in the text'}
        </span>
        <span className="tokens">
          {vocab.map((t) => (
            <span key={t} className={cn('tok', current && t === current.merged && 'fresh')}>
              {t}
            </span>
          ))}
        </span>
      </div>

      <div className="my-3 max-w-[62ch] font-mono text-xs text-muted-foreground">
        A few example words to watch (not the whole corpus - the counts above are
        tallied over every word in the text):
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
      <Input
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
      <div className="mt-2.5 flex gap-4.5 font-mono text-[0.8rem] text-muted-foreground">
        <span>
          <b className="font-bold text-foreground">{toks.length}</b> tokens
        </span>
        <span>
          <b className="font-bold text-foreground">{chars}</b> letters
        </span>
        <span>≈ {(chars / Math.max(1, toks.length)).toFixed(1)} letters / token</span>
      </div>
    </div>
  );
}
