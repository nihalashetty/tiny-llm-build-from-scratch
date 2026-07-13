import { useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { CodeViewer } from '../components/CodeViewer';
import { LossCurve } from '../viz/LossCurve';
import { EmbeddingScatter } from '../viz/EmbeddingScatter';
import { useRafTrainer } from '../useRafTrainer';
import { Word2Vec } from '../../llm/word2vec';
import { sentences } from '../../llm/corpus/little-kingdom';
import w2vSource from '../../llm/word2vec.ts?raw';

const LABELS = [
  'king', 'queen', 'prince', 'princess', 'man', 'woman', 'boy', 'girl',
  'fox', 'deer', 'wolf', 'rabbit', 'owl', 'bear',
  'forest', 'river', 'castle', 'mountain', 'village', 'garden',
  'crown', 'throne', 'gold', 'red', 'blue', 'big', 'small',
];

function EmbeddingLab() {
  const t = useRafTrainer(
    () => new Word2Vec(sentences, { dim: 16, window: 2, negatives: 5, lr: 0.05, seed: 1, targetEpochs: 400 }),
    (m) => m.trainEpoch(),
    400,
    4,
  );
  const m = t.model;

  const [near, setNear] = useState('fox');
  const [a, setA] = useState('man');
  const [b, setB] = useState('king');
  const [c, setC] = useState('woman');

  const neighbors = m.nearest(near, 5);
  const analogy = m.analogy(a, b, c, 1);
  const result = analogy[0]?.word;

  const highlight = [
    { word: a, color: '#3e6ff0' },
    { word: b, color: '#f0663e' },
    { word: c, color: '#1f9e7a' },
    ...(result ? [{ word: result, color: '#c24a28' }] : []),
  ];
  const arrows = result
    ? [
        { from: a, to: b, color: '#f0663e' },
        { from: c, to: result, color: '#1f9e7a' },
      ]
    : [];

  const opts = m.vocab.slice().sort();

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
            epoch <b>{t.epoch}</b>
          </span>
          <span>
            loss <b>{t.loss === null ? '—' : t.loss.toFixed(3)}</b>
          </span>
        </span>
      </div>

      <div className="lab-two" style={{ gridTemplateColumns: '340px 1fr' }}>
        <EmbeddingScatter points={m.positions2D()} labelWords={LABELS} highlight={highlight} arrows={arrows} />

        <div className="explorer">
          <LossCurve history={t.lossHistory} max={2.5} />

          <div>
            <div className="field">
              <label>Nearest to</label>
              <select className="mini" value={near} onChange={(e) => setNear(e.target.value)}>
                {opts.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="neighbors" style={{ marginTop: 8 }}>
              {neighbors.map((n) => (
                <span className="neighbor" key={n.word}>
                  {n.word} <b>{n.score.toFixed(2)}</b>
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="field">
              <select className="mini" value={a} onChange={(e) => setA(e.target.value)}>
                {opts.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <span>→</span>
              <select className="mini" value={b} onChange={(e) => setB(e.target.value)}>
                {opts.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <span className="dim">, so</span>
              <select className="mini" value={c} onChange={(e) => setC(e.target.value)}>
                {opts.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <span>→ ?</span>
            </div>
            <div className="analogy-result" style={{ marginTop: 8 }}>
              {b} − {a} + {c} = <span className="big">{result ?? '…'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Chapter4Embeddings() {
  return (
    <ChapterFrame id="embeddings">
      <Beat as="p" className="lead">
        We can tokenize now — but a token is just an ID. To the model,{' '}
        <code>queen</code> and <code>king</code> are two unrelated numbers, no
        closer than <code>queen</code> and <code>rock</code>. That's hopeless for
        language. We need to give each word a <strong>position in space</strong>,
        placed so that meaning becomes geometry.
      </Beat>

      <Beat as="h2">What's a vector? (arrows with meaning)</Beat>
      <Beat as="p">
        A vector is just a list of numbers — think of it as an arrow pointing to a
        spot in space. Two words with similar meaning should sit close together;
        the <em>direction</em> between words can capture a relationship. The wild
        part, discovered in 2013, is that these directions become arithmetic you
        can actually do.
      </Beat>

      <Beat as="p">
        The idea is centuries old in disguise. Frege said a word's meaning lives
        in its context; the linguist J. R. Firth put it memorably: “you shall
        know a word by the company it keeps.” <strong>Word2Vec</strong> turned
        that slogan into an algorithm — train each word to predict its neighbours,
        and words used alike drift together.
      </Beat>

      <Beat>
        <CitationCard ids={['frege-1884', 'firth-1957', 'word2vec-2013', 'word2vec-ns-2013']} />
      </Beat>

      <Beat as="h2">Watch words find their place</Beat>
      <Beat as="p">
        Below, every word in our Little Kingdom starts as a random dot. Press{' '}
        <strong>Train</strong> and watch them organize: royalty and people cluster
        here, forest animals there. Then play with the <strong>analogy</strong>{' '}
        tool — set “man → king”, and ask what “woman” maps to. The two dashed
        arrows should come out parallel.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · Word vectors projected to 2D. Similar words cluster; king − man + woman really does land on queen.">
          <EmbeddingLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="✨">
          <strong>king − man + woman ≈ queen.</strong> Nobody programmed that. It
          falls out of the geometry once words are placed by the company they
          keep. Meaning became math.
        </Callout>
      </Beat>

      <Beat as="h2">The code</Beat>
      <Beat as="p">
        Skip-gram with negative sampling — push a word toward its real neighbours,
        shove it away from random ones. The vectors are the <code>Win</code>{' '}
        matrix; everything else is bookkeeping.
      </Beat>

      <Beat>
        <CodeViewer code={w2vSource} filename="src/llm/word2vec.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        We now have tokens with <em>meaning</em>. But there's still something big
        missing: <strong>order and context</strong>. “The dog bit the man” and
        “the man bit the dog” use identical words. A pile of vectors can't tell
        them apart. Solving that took until 2017 — and it changed everything.
      </Beat>
    </ChapterFrame>
  );
}
