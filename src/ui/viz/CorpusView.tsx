import { useMemo } from 'react';
import { sentences, corpusText } from '../../llm/corpus/little-kingdom';

/** Wrap every "th" in the line so the reader can see (and count) each one. */
function highlightTh(line: string) {
  return line.split(/(th)/gi).map((p, i) =>
    p.toLowerCase() === 'th' ? (
      <mark key={i} className="hl-th">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

/**
 * Shows the entire Little Kingdom corpus — the actual text BPE learns from — so
 * the pair counts in the merge demo aren't mysterious. Every "th" is highlighted
 * and tallied, which is exactly the 95 that makes t+h the first merge.
 */
export function CorpusView() {
  const stats = useMemo(() => {
    const words = corpusText.toLowerCase().match(/[a-z]+/g) ?? [];
    return {
      sentences: sentences.length,
      words: words.length,
      uniqueWords: new Set(words).size,
      the: words.filter((w) => w === 'the').length,
      th: (corpusText.toLowerCase().match(/th/g) ?? []).length,
      chars: new Set(corpusText.toLowerCase().match(/[a-z]/g) ?? []).size,
    };
  }, []);

  return (
    <div className="lab">
      <div className="lab-stats">
        <span>
          <b>{stats.sentences}</b> sentences
        </span>
        <span>
          <b>{stats.words}</b> words
        </span>
        <span>
          <b>{stats.uniqueWords}</b> unique words
        </span>
        <span>
          <b>{stats.chars}</b> distinct letters
        </span>
        <span>
          “the” ×<b>{stats.the}</b>
        </span>
      </div>

      <div className="corpus-text">
        {sentences.map((s, i) => (
          <div key={i} className="corpus-line">
            {highlightTh(s)}
          </div>
        ))}
      </div>

      <div className="sample-note">
        Every <mark className="hl-th">th</mark> is highlighted — count them and you
        get <b>{stats.th}</b>. That's where the demo's “seen {stats.th}×” comes
        from, and why <code>t</code>+<code>h</code> is the very first pair BPE glues.
      </div>
    </div>
  );
}
