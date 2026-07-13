/**
 * The "Little Kingdom" corpus.
 *
 * This is our original, hand-written training text — no copyright strings
 * attached. It is deliberately:
 *   - small and very repetitive, so a tiny model trained in your browser can
 *     actually produce plausible text instead of noise;
 *   - seeded with clean semantic structure, so later chapters shine:
 *       • gender axis:  king↔queen, man↔woman, boy↔girl, prince↔princess
 *       • royalty:      king, queen, prince, princess, crown, throne, castle
 *       • animals:      fox, owl, deer, wolf, rabbit, bear
 *       • size:         big↔small, tall↔short
 *       • places:       forest, river, village, mountain, meadow
 *
 * Those parallel sentences ("the king is a man", "the queen is a woman", …) are
 * what let the embeddings chapter pull off king − man + woman ≈ queen.
 */

export const sentences: string[] = [
  // --- the gender / royalty axis (repeated on purpose) ---
  'the king is a man',
  'the queen is a woman',
  'the prince is a boy',
  'the princess is a girl',
  'the king is a man',
  'the queen is a woman',
  'the boy becomes a man',
  'the girl becomes a woman',
  'the prince becomes a king',
  'the princess becomes a queen',
  'the king loves the queen',
  'the man loves the woman',
  'the prince loves the princess',
  'the boy loves the girl',
  'the king wears a gold crown',
  'the queen wears a gold crown',
  'the king sits on the throne',
  'the queen sits on the throne',

  // --- the castle and the village ---
  'the king lives in the castle',
  'the queen lives in the castle',
  'the castle stands on the mountain',
  'the village rests by the river',
  'the people love the kind queen',
  'the people love the kind king',
  'the guard watches the castle gate',
  'the guard is tall and brave',

  // --- the forest and its animals ---
  'the fox runs through the forest',
  'the deer runs through the forest',
  'the owl sleeps in the tall tree',
  'the wolf howls at the moon',
  'the rabbit hides in the meadow',
  'the bear sleeps in the cave',
  'the fox is small and quick',
  'the bear is big and slow',
  'the owl is wise and quiet',
  'the deer is quick and shy',

  // --- size and color ---
  'the big bear eats the red berry',
  'the small rabbit eats the green leaf',
  'the tall guard carries a long spear',
  'the short baker bakes warm bread',
  'the red apple falls from the tree',
  'the blue river flows to the sea',
  'the gold crown shines in the sun',
  'the green forest is dark and deep',

  // --- gentle daily life ---
  'the baker bakes bread every morning',
  'the children play in the meadow',
  'the river flows past the village',
  'the sun rises over the mountain',
  'the moon rises over the forest',
  'the king walks through the village',
  'the queen walks through the garden',
  'the prince rides a brown horse',
  'the princess sings a sweet song',
  'the people dance at the feast',
  'the feast fills the castle hall',
  'the fire warms the cold night',
];

/** The whole corpus as one string (handy for the tokenizer chapter). */
export const corpusText: string = sentences.join('. ') + '.';

/** A short, friendly sample used as the default input in demos. */
export const sampleSentence = 'the queen wears a gold crown';
