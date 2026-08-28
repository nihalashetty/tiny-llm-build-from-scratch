/**
 * The curriculum - the spine of the whole course.
 *
 * The order here IS the story. It never reorders: each chapter sets up a
 * tension that the next one resolves. The sidebar, breadcrumbs, prev/next
 * navigation and progress bar are all derived from this single list.
 *
 * Two levels of grouping sit above the chapters:
 *   Part  - the big arc ("Training" then "Inference")
 *   Group - a module within a part ("Learning to learn", …)
 *
 * `built: false` chapters render a friendly "coming soon" page so the reader
 * can still see the full journey ahead.
 */

export interface Chapter {
  /** slug used in the URL: #/c/<id> */
  id: string;
  /** 0-based position in the story */
  index: number;
  /** top-level arc shown as a header in the sidebar */
  part: string;
  /** module grouping shown in the sidebar */
  group: string;
  /** full chapter title */
  title: string;
  /** short label for the sidebar */
  navTitle: string;
  /** approximate reading time in minutes */
  minutes: number;
  /** one-line teaser */
  blurb: string;
  /** whether the full chapter is implemented yet */
  built: boolean;
}

/** The two big arcs of the course. */
export const PART_TRAINING = 'Part 1 · Training: how an LLM is built';
export const PART_INFERENCE = 'Part 2 · Inference: how an LLM responds';

/**
 * How a part title is broken up for display - the sidebar shows these as a
 * three-line heading (badge / name / tagline) so the two big arcs read as the
 * top level of the hierarchy rather than as another group label.
 */
export interface PartMeta {
  /** short badge, e.g. "Part 1" */
  badge: string;
  /** the arc's one-word name, e.g. "Training" */
  name: string;
  /** the explanatory tail, e.g. "how an LLM is built" */
  tagline: string;
}

const PART_META: Record<string, PartMeta> = {
  [PART_TRAINING]: { badge: 'Part 1', name: 'Training', tagline: 'how an LLM is built' },
  [PART_INFERENCE]: { badge: 'Part 2', name: 'Inference', tagline: 'how an LLM responds' },
};

/**
 * Display pieces for a part heading. Falls back to splitting the raw title on
 * "·" and ":" so a new part still renders sensibly before it's added above.
 */
export function partMeta(title: string): PartMeta {
  const known = PART_META[title];
  if (known) return known;
  const [head, ...tail] = title.split(':');
  const [badge, name] = head.split('·').map((s) => s.trim());
  return {
    badge: badge || title,
    name: name || '',
    tagline: tail.join(':').trim(),
  };
}

const raw: Omit<Chapter, 'index'>[] = [
  // ─────────────────────────────  PART 1 · TRAINING  ─────────────────────────────
  {
    id: 'prologue',
    part: PART_TRAINING,
    group: 'Beginnings',
    title: 'Can a machine really talk?',
    navTitle: 'Prologue',
    minutes: 4,
    blurb: 'The one question this whole course answers - and the two people who asked it first.',
    built: true,
  },
  {
    id: 'chatbots',
    part: PART_TRAINING,
    group: 'Beginnings',
    title: 'The Illusion: faking a conversation',
    navTitle: 'Rule-based chatbots',
    minutes: 9,
    blurb: 'A fake therapist fooled the world in 1966 - using nothing but if-statements.',
    built: true,
  },
  {
    id: 'neural-networks',
    part: PART_TRAINING,
    group: 'Learning to learn',
    title: 'Learning instead of writing rules',
    navTitle: 'Neural networks',
    minutes: 11,
    blurb: 'Stop writing rules. Show examples instead - and watch a network teach itself XOR.',
    built: true,
  },
  {
    id: 'tokenization',
    part: PART_TRAINING,
    group: 'Learning to learn',
    title: 'Breaking text into pieces',
    navTitle: 'Tokenization',
    minutes: 8,
    blurb: 'Before a model can read, text must be chopped into tokens. Watch them form.',
    built: true,
  },
  {
    id: 'embeddings',
    part: PART_TRAINING,
    group: 'Learning to learn',
    title: 'Giving words meaning',
    navTitle: 'Embeddings',
    minutes: 10,
    blurb: 'Turn words into arrows in space, where king − man + woman lands on queen.',
    built: true,
  },
  {
    id: 'transformers',
    part: PART_TRAINING,
    group: 'The Transformer',
    title: 'Paying attention',
    navTitle: 'Transformers',
    minutes: 12,
    blurb: 'The 2017 idea that changed everything: let every word glance at every other.',
    built: true,
  },
  {
    id: 'sampling',
    part: PART_TRAINING,
    group: 'The Transformer',
    title: 'Choosing the next word - and doing it again',
    navTitle: 'Sampling & the loop',
    minutes: 8,
    blurb: 'Softmax, temperature, top-p, and the loop that turns one guess into paragraphs.',
    built: true,
  },
  {
    id: 'evaluation',
    part: PART_TRAINING,
    group: 'Making it real',
    title: 'Is it actually learning?',
    navTitle: 'Evaluation',
    minutes: 7,
    blurb: 'A falling loss can be a lie. Hold out some text, and watch a model overfit in real time.',
    built: true,
  },
  {
    id: 'scaling',
    part: PART_TRAINING,
    group: 'Making it real',
    title: 'Why bigger works',
    navTitle: 'Scaling laws',
    minutes: 7,
    blurb: 'The dumb, powerful idea behind modern AI: make it bigger - and watch loss fall on a curve.',
    built: true,
  },
  {
    id: 'assistant',
    part: PART_TRAINING,
    group: 'Becoming an assistant',
    title: 'From a base model to a helpful assistant',
    navTitle: 'Fine-tuning & RLHF',
    minutes: 7,
    blurb: 'A model trained on the whole internet is a mimic. Here is how it learns to help.',
    built: true,
  },
  {
    id: 'epilogue',
    part: PART_TRAINING,
    group: 'Becoming an assistant',
    title: 'The full picture, and a party',
    navTitle: 'Epilogue',
    minutes: 5,
    blurb: 'Every piece you built, assembled into one machine - plus where it all goes next.',
    built: true,
  },
  {
    id: 'neuroevolution-car',
    part: PART_TRAINING,
    group: 'Bonus round',
    title: 'Teaching a car to drive itself',
    navTitle: 'Neuroevolution',
    minutes: 10,
    blurb: 'No teacher, no labels, no backprop - breed a population of neural nets until one learns to drive a track.',
    built: true,
  },

  // ─────────────────────────────  PART 2 · INFERENCE  ─────────────────────────────
  {
    id: 'inference-overview',
    part: PART_INFERENCE,
    group: 'The journey begins',
    title: 'You hit send, now what?',
    navTitle: 'The journey of a message',
    minutes: 6,
    blurb: 'Follow one message from your keyboard to the words streaming back, the whole map, before we zoom in.',
    built: true,
  },
  {
    id: 'inference-tokenize',
    part: PART_INFERENCE,
    group: 'The journey begins',
    title: 'Your words become tokens',
    navTitle: 'Message → tokens',
    minutes: 7,
    blurb: 'The same tokenizer from training runs in reverse-gear at read time. Watch your sentence shatter into ids.',
    built: true,
  },
  {
    id: 'inference-chat-format',
    part: PART_INFERENCE,
    group: 'The journey begins',
    title: 'Wrapping your words: the chat format',
    navTitle: 'The chat template',
    minutes: 8,
    blurb: 'You typed one line, but the model sees a script with roles and special tokens. Meet the hidden wrapper.',
    built: true,
  },
  {
    id: 'inference-embed',
    part: PART_INFERENCE,
    group: 'One pass through the network',
    title: 'Tokens become vectors',
    navTitle: 'Tokens → vectors',
    minutes: 7,
    blurb: 'Every id looks up a learned vector and gets stamped with its position. The model finally has numbers to think with.',
    built: true,
  },
  {
    id: 'inference-forward',
    part: PART_INFERENCE,
    group: 'One pass through the network',
    title: 'One sweep through the layers',
    navTitle: 'The forward pass',
    minutes: 10,
    blurb: 'No learning now, just one flow forward, where every token reads every earlier token, layer after layer.',
    built: true,
  },
  {
    id: 'inference-logits',
    part: PART_INFERENCE,
    group: 'One pass through the network',
    title: 'Scoring every possible next word',
    navTitle: 'Logits & probabilities',
    minutes: 7,
    blurb: 'The last layer hands back one score for every word it knows. Softmax turns that into a bet on what comes next.',
    built: true,
  },
  {
    id: 'inference-loop',
    part: PART_INFERENCE,
    group: 'Writing the reply, word by word',
    title: 'Choosing a word, then doing it again',
    navTitle: 'Sampling & the loop',
    minutes: 9,
    blurb: 'Pick one token, glue it on, feed it back. Temperature, top-p, the KV cache, streaming, and when to stop.',
    built: true,
  },
  {
    id: 'inference-run',
    part: PART_INFERENCE,
    group: 'Writing the reply, word by word',
    title: 'The whole answer, end to end',
    navTitle: 'The full run',
    minutes: 7,
    blurb: 'Every piece assembled: type a prompt and watch the real model tokenize, think, and write back live.',
    built: true,
  },
];

export const chapters: Chapter[] = raw.map((c, index) => ({ ...c, index }));

export const totalChapters = chapters.length;

/** Sidebar groups, in order, each with its chapters (flat - kept for search). */
export const groups: { title: string; chapters: Chapter[] }[] = (() => {
  const out: { title: string; chapters: Chapter[] }[] = [];
  for (const ch of chapters) {
    let g = out.find((x) => x.title === ch.group);
    if (!g) {
      g = { title: ch.group, chapters: [] };
      out.push(g);
    }
    g.chapters.push(ch);
  }
  return out;
})();

/** The full two-tier structure: parts, each holding its ordered groups. */
export const parts: {
  title: string;
  groups: { title: string; chapters: Chapter[] }[];
}[] = (() => {
  const out: { title: string; groups: { title: string; chapters: Chapter[] }[] }[] = [];
  for (const ch of chapters) {
    let p = out.find((x) => x.title === ch.part);
    if (!p) {
      p = { title: ch.part, groups: [] };
      out.push(p);
    }
    let g = p.groups.find((x) => x.title === ch.group);
    if (!g) {
      g = { title: ch.group, chapters: [] };
      p.groups.push(g);
    }
    g.chapters.push(ch);
  }
  return out;
})();

export function chapterById(id: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

/**
 * 1-based position of a chapter, for prose that says "Chapter 4".
 *
 * Always look numbers up through here (or the <ChapterRef> component) rather
 * than hard-coding them in a sentence: inserting one chapter shifts every
 * number after it, and hand-written ones silently go stale.
 */
export function chapterNumber(id: string): number {
  const i = chapters.findIndex((c) => c.id === id);
  if (i === -1) throw new Error(`Unknown chapter id: ${id}`);
  return i + 1;
}

export function neighbors(id: string): { prev?: Chapter; next?: Chapter } {
  const i = chapters.findIndex((c) => c.id === id);
  if (i === -1) return {};
  return { prev: chapters[i - 1], next: chapters[i + 1] };
}
