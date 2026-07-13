import { useMemo } from 'react';
import { sentences, corpusText } from '../../llm/corpus/little-kingdom';

/**
 * Simply shows the entire Little Kingdom corpus — the exact text the tokenizer
 * below reads. Seeing it makes the demo's pair counts obvious: words like "the"
 * repeat constantly, so their pieces are what get merged first.
 */
export function CorpusView() {
  const stats = useMemo(() => {
    const words = corpusText.toLowerCase().match(/[a-z]+/g) ?? [];
    return {
      sentences: sentences.length,
      words: words.length,
      uniqueWords: new Set(words).size,
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
          only <b>{stats.uniqueWords}</b> unique words
        </span>
      </div>

      <div className="corpus-text">
        {sentences.map((s, i) => (
          <div key={i} className="corpus-line">
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}
