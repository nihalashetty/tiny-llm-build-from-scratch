import { useState } from 'react';
import { ChapterFrame } from '../components/ChapterFrame';
import { Beat } from '../components/Beat';
import { Callout } from '../components/Callout';
import { Figure } from '../components/Figure';
import { CitationCard } from '../components/CitationCard';
import { ChapterRef } from '../components/ChapterRef';
import { CodeViewer } from '../components/CodeViewer';
import { LossCurve } from '../viz/LossCurve';
import { EmbeddingScatter } from '../viz/EmbeddingScatter';
import {
  VectorArrowDiagram,
  DimensionLadder,
  DimensionScale,
  CosineDiagram,
} from '../viz/VectorDiagrams';
import { SkipGramWalk } from '../viz/SkipGramWalk';
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
  const trained = t.epoch > 0;

  const [near, setNear] = useState('fox');
  const [a, setA] = useState('man');
  const [b, setB] = useState('king');
  const [c, setC] = useState('woman');

  const neighbors = m.nearest(near, 5);
  const analogy = m.analogy(a, b, c, 1);
  const result = analogy[0]?.word;

  const highlight = [
    { word: a, color: '#3e6ff0' },
    { word: b, color: '#e0553a' },
    { word: c, color: '#10866a' },
    ...(trained && result ? [{ word: result, color: '#a63a25' }] : []),
  ];
  const arrows =
    trained && result
      ? [
          { from: a, to: b, color: '#e0553a' },
          { from: c, to: result, color: '#10866a' },
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
            loss <b>{t.loss === null ? '-' : t.loss.toFixed(3)}</b>
          </span>
        </span>
      </div>

      <div className="lab-two" style={{ gridTemplateColumns: '340px 1fr', gap: 22 }}>
        <EmbeddingScatter points={m.positions2D()} labelWords={LABELS} highlight={highlight} arrows={arrows} />

        <div className="explorer">
          <div className="panel-block">
            <div className="panel-title">Training loss</div>
            <LossCurve history={t.lossHistory} max={2.5} />
          </div>

          <div className="panel-block">
            <div className="panel-title">
              Nearest neighbours <span className="dim">· by cosine similarity</span>
            </div>
            <div className="field">
              <label>Nearest to</label>
              <select className="mini" value={near} onChange={(e) => setNear(e.target.value)}>
                {opts.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>
            {trained ? (
              <div className="neighbors" style={{ marginTop: 8 }}>
                {neighbors.map((n) => (
                  <span className="neighbor" key={n.word}>
                    {n.word} <b>{n.score.toFixed(2)}</b>
                  </span>
                ))}
              </div>
            ) : (
              <div className="panel-empty">Press Train ▶ - until the vectors learn, neighbours are random.</div>
            )}
          </div>

          <div className="panel-block">
            <div className="panel-title">Word analogy</div>
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
              {b} − {a} + {c} = <span className="big">{trained ? result ?? '…' : '?'}</span>
            </div>
            {!trained && <div className="panel-empty">Train first - this should resolve to “queen”.</div>}
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
        First, something worth stopping on: <strong>from here on there are no words.</strong>{' '}
        The tokenizer in <ChapterRef id="tokenization" /> was the last place text
        existed. It reads “the queen sits”, looks each piece up in its vocabulary, and
        hands the model back <code>[5, 42, 31]</code> - and that row of integers is all
        the model ever sees. Every chapter after this one is arithmetic on numbers like
        those.
      </Beat>

      <Beat as="p">
        Which leaves us with a problem. An ID is just a shelf number: <code>queen</code>{' '}
        is 42 because it happened to be the 42nd entry, and <code>king</code> is 17 for
        no better reason. Nothing about 42 and 17 says those two belong together, and
        <code> rock</code> at 43 would look like queen's closest relative. That's
        hopeless for language. We need to give each token a{' '}
        <strong>position in space</strong>, placed so that meaning becomes geometry.
      </Beat>

      <Beat as="h2">What's a vector? (an arrow with meaning)</Beat>
      <Beat as="p">
        A <strong>vector</strong> is nothing scary - it's just a list of numbers.
        Each number is a <em>coordinate</em>, and together they point to one exact
        spot. Take two numbers, read them as <code>(x, y)</code>, and the word
        becomes an arrow from the origin to a point on a plane. Place words well and
        the geometry starts to mean something: similar words point to nearby spots,
        unrelated words point off on their own.
      </Beat>

      <Beat>
        <Figure caption="Fig 1 · A word as an arrow. Give “king” the numbers [.78, .82] and it points to a spot; “queen” lands nearby (similar meaning), while “rock” points somewhere else entirely.">
          <VectorArrowDiagram />
        </Figure>
      </Beat>

      <Beat as="p">
        The idea is centuries old in disguise. Frege said a word's meaning lives in
        its context; the linguist J. R. Firth put it memorably: “you shall know a
        word by the company it keeps.” <strong>Word2Vec</strong> (2013) turned that
        slogan into an algorithm - train each word to predict its neighbours, and
        words used alike drift together.
      </Beat>

      <Beat>
        <CitationCard ids={['frege-1884', 'firth-1957', 'word2vec-2013', 'word2vec-ns-2013']} />
      </Beat>

      <Beat as="h2">What's a dimension?</Beat>
      <Beat as="p">
        Each number in that list is one <strong>dimension</strong> - one independent
        axis you're free to move along. One number pins a point on a line; two, a
        point on a plane; three, a point floating in a box of space. Every extra
        number is simply one more direction to move in.
      </Beat>

      <Beat>
        <Figure caption="Fig 2 · Each extra number is one more axis. One → a line, two → a plane, three → space.">
          <DimensionLadder />
        </Figure>
      </Beat>

      <Beat as="p">
        Here's the mind-bender: nothing forces us to stop at three. A word can be a
        list of 16, or 300, or thousands of numbers - a point in a space with that
        many axes. We can't <em>picture</em> 300-dimensional space, but every formula
        we care about (distance, direction, the analogy arithmetic) works there
        exactly the same. The pictures run out; the math never does.
      </Beat>

      <Beat as="h2">How many dimensions do real models use?</Beat>
      <Beat as="p">
        More dimensions means more room to encode subtle distinctions - royalty
        <em>and</em> gender <em>and</em> size <em>and</em> a hundred shades you'd
        never name. Our toy uses just <strong>16</strong> so it trains in a blink and
        can be drawn. Real models are far wider:
      </Beat>

      <Beat>
        <Figure caption="Fig 3 · Embedding width (log scale): our 16-dim toy vs. classic Word2Vec (300), GPT-2 (768), and GPT-3 (12,288 numbers per token).">
          <DimensionScale />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="🖼️">
          <strong>So how do we draw 16-D on a flat screen?</strong> The map below
          squashes each 16-number vector down to 2 with a trick called <em>PCA</em> -
          like photographing a sculpture from its single most informative angle. The
          clusters you'll see are real; the exact positions are a flattened shadow of
          the full space.
        </Callout>
      </Beat>

      <Beat as="h2">Measuring closeness: cosine similarity</Beat>
      <Beat as="p">
        If words are arrows, how do we score two as “similar”? Not by the gap between
        their tips, but by the <strong>angle</strong> between them. Two arrows aimed
        the same way mean the same thing even if one is longer. Turn that angle into a
        single number and you get <strong>cosine similarity</strong>:{' '}
        <strong>+1</strong> for the same direction, <strong>0</strong> for a right
        angle (unrelated), <strong>−1</strong> for dead opposite.
      </Beat>

      <Beat>
        <Figure caption="Fig 4 · Cosine similarity is the angle between two vectors, not the distance between their tips.">
          <CosineDiagram />
        </Figure>
      </Beat>

      <Beat as="p">
        Those <code>0.85</code>-style scores in the <strong>nearest neighbours</strong>{' '}
        box below are exactly this - the cosine between one word's arrow and every
        other word's.
      </Beat>

      <Beat as="h2">So how do the vectors actually get set?</Beat>
      <Beat as="p">
        This is the part that matters most, and it's easy to miss: nobody{' '}
        <em>assigns</em> these numbers. We start from pure nonsense - every word is
        handed a <strong>random</strong> vector, a random point in space - and then a
        training loop turns Firth's slogan (“a word is known by the company it keeps”)
        into millions of tiny nudges:
      </Beat>

      <Beat>
        <ol className="point-list">
          <li>
            <span className="point-num">1</span>
            <div>
              <strong>Slide a window over the corpus.</strong> For each word (the{' '}
              <em>centre</em>), the few words on either side are its{' '}
              <em>neighbours</em> - the company it keeps in that spot.
            </div>
          </li>
          <li>
            <span className="point-num">2</span>
            <div>
              <strong>Pull neighbours together.</strong> Nudge the centre word's
              vector a little toward each real neighbour's, so words that keep showing
              up together end up pointing the same way.
            </div>
          </li>
          <li>
            <span className="point-num">3</span>
            <div>
              <strong>Push random words apart.</strong> Also pick a handful of words
              that <em>didn't</em> appear nearby and nudge them away. This is{' '}
              <strong>negative sampling</strong> - without it every vector would
              collapse into one useless blob.
            </div>
          </li>
          <li>
            <span className="point-num">4</span>
            <div>
              <strong>Repeat, thousands of times.</strong> Do it for every
              centre/neighbour pair, epoch after epoch. The loss falls, and words that
              keep similar company drift into the same corner of space.
            </div>
          </li>
        </ol>
      </Beat>

      <Beat as="p">
        Said in one line: <strong>we read the corpus one word at a time, and every
        time two words turn up beside each other we move them a little closer.</strong>{' '}
        See “king” next to “throne” once and they barely budge. See it a hundred times
        and they end up neighbours.
      </Beat>

      <Beat as="p">
        Easier to watch than to read. Below is a five-line corpus and eleven words
        dropped at random on a map. Press <strong>Play</strong> - or drag the slider to
        move the window yourself - and each stop is one step: the sentence in the
        middle says what's happening, and the dots underneath actually move.
      </Beat>

      <Beat>
        <Figure caption="Fig 5 · Slide the window across the corpus. Green = seen together, so move closer. Red dashed = wasn't there, so push away. After three passes the royal words have found each other and the fox words are off in their own corner - nobody arranged that.">
          <SkipGramWalk />
        </Figure>
      </Beat>

      <Beat as="p">
        Notice that “king” and “queen” drift together even though they never appear in
        the same line. They don't have to - they keep the <em>same company</em>{' '}
        (“sits”, “throne”, “wears”, “crown”), and that's enough. That is Firth's
        slogan turning into geometry, right in front of you.
      </Beat>

      <Beat as="p">
        The real thing works exactly like this, just bigger: the map above is 2D
        because you have to see it, while our vectors live in 16 dimensions. The demo
        below flattens those 16 back down to 2 with the PCA trick. The dots drift while
        you train for the same reason they drift above - the vectors themselves are
        still moving.
      </Beat>

      <Beat as="h2">Watch words find their place</Beat>
      <Beat as="p">
        Every word in our Little Kingdom starts as a random dot. Press{' '}
        <strong>Train</strong> and watch them organize: royalty and people cluster
        here, forest animals there. Zoom into a crowded corner (scroll or the{' '}
        <code>+</code> button) to read overlapping labels. Then play with the{' '}
        <strong>analogy</strong> tool - set “man → king”, ask what “woman” maps to,
        and watch the two dashed arrows come out parallel.
      </Beat>

      <Beat>
        <Figure caption="Fig 6 · Word vectors projected to 2D. Similar words cluster; after training, king − man + woman really does land on queen.">
          <EmbeddingLab />
        </Figure>
      </Beat>

      <Beat>
        <Callout emoji="✨">
          <strong>king − man + woman ≈ queen.</strong> Nobody programmed that. It
          falls out of the geometry once words are placed by the company they keep.
          Meaning became math.
        </Callout>
      </Beat>

      <Beat as="h2">The code</Beat>
      <Beat as="p">
        Skip-gram with negative sampling - push a word toward its real neighbours,
        shove it away from random ones. The vectors are the <code>Win</code>{' '}
        matrix; everything else is bookkeeping.
      </Beat>

      <Beat>
        <CodeViewer code={w2vSource} filename="src/llm/word2vec.ts" lang="typescript" />
      </Beat>

      <Beat as="p">
        We now have tokens with <em>meaning</em>. But there's still something big
        missing: <strong>order and context</strong>. “The dog bit the man” and “the
        man bit the dog” use identical words. A pile of vectors can't tell them apart.
        Solving that took until 2017 - and it changed everything.
      </Beat>
    </ChapterFrame>
  );
}
