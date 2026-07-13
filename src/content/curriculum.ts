/**
 * The curriculum — the spine of the whole course.
 *
 * The order here IS the story. It never reorders: each chapter sets up a
 * tension that the next one resolves. The sidebar, breadcrumbs, prev/next
 * navigation and progress bar are all derived from this single list.
 *
 * `built: false` chapters render a friendly "coming soon" page so the reader
 * can still see the full journey ahead.
 */

export interface Chapter {
  /** slug used in the URL: #/c/<id> */
  id: string;
  /** 0-based position in the story */
  index: number;
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

const raw: Omit<Chapter, 'index'>[] = [
  {
    id: 'prologue',
    group: 'Beginnings',
    title: 'Can a machine really talk?',
    navTitle: 'Prologue',
    minutes: 4,
    blurb: 'The one question this whole course answers — and the two people who asked it first.',
    built: true,
  },
  {
    id: 'chatbots',
    group: 'Beginnings',
    title: 'The Illusion: faking a conversation',
    navTitle: 'Rule-based chatbots',
    minutes: 9,
    blurb: 'A fake therapist fooled the world in 1966 — using nothing but if-statements.',
    built: true,
  },
  {
    id: 'neural-networks',
    group: 'Learning to learn',
    title: 'Learning instead of writing rules',
    navTitle: 'Neural networks',
    minutes: 11,
    blurb: 'Stop writing rules. Show examples instead — and watch a network teach itself XOR.',
    built: false,
  },
  {
    id: 'tokenization',
    group: 'Learning to learn',
    title: 'Breaking text into pieces',
    navTitle: 'Tokenization',
    minutes: 8,
    blurb: 'Before a model can read, text must be chopped into tokens. Watch them form.',
    built: false,
  },
  {
    id: 'embeddings',
    group: 'Learning to learn',
    title: 'Giving words meaning',
    navTitle: 'Embeddings',
    minutes: 10,
    blurb: 'Turn words into arrows in space, where king − man + woman lands on queen.',
    built: false,
  },
  {
    id: 'transformers',
    group: 'The Transformer',
    title: 'Paying attention',
    navTitle: 'Transformers',
    minutes: 12,
    blurb: 'The 2017 idea that changed everything: let every word glance at every other.',
    built: false,
  },
  {
    id: 'sampling',
    group: 'The Transformer',
    title: 'Choosing the next word — and doing it again',
    navTitle: 'Sampling & the loop',
    minutes: 8,
    blurb: 'Softmax, temperature, top-p, and the loop that turns one guess into paragraphs.',
    built: false,
  },
  {
    id: 'assistant',
    group: 'Becoming an assistant',
    title: 'From a base model to a helpful assistant',
    navTitle: 'Fine-tuning & RLHF',
    minutes: 7,
    blurb: 'A model trained on the whole internet is a mimic. Here is how it learns to help.',
    built: false,
  },
  {
    id: 'epilogue',
    group: 'Becoming an assistant',
    title: 'The full picture, and a party',
    navTitle: 'Epilogue',
    minutes: 5,
    blurb: 'Every piece you built, assembled into one machine — plus where it all goes next.',
    built: false,
  },
];

export const chapters: Chapter[] = raw.map((c, index) => ({ ...c, index }));

export const totalChapters = chapters.length;

/** Sidebar groups, in order, each with its chapters. */
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

export function chapterById(id: string | undefined): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function neighbors(id: string): { prev?: Chapter; next?: Chapter } {
  const i = chapters.findIndex((c) => c.id === id);
  if (i === -1) return {};
  return { prev: chapters[i - 1], next: chapters[i + 1] };
}
