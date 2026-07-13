/**
 * Citation registry.
 *
 * Every historical claim in the course points back to a real paper or a
 * reputable summary. We deliberately DO NOT reproduce figures or scans from
 * these papers — each card just links out to the source (arXiv / Wikipedia /
 * publisher). Titles, authors and years are facts, not creative content.
 */

export interface Citation {
  id: string;
  year: string;
  title: string;
  authors: string;
  url: string;
}

const list: Citation[] = [
  // --- Prologue: the seed ideas ---
  {
    id: 'shannon-1948',
    year: '1948',
    title: 'A Mathematical Theory of Communication',
    authors: 'Claude Shannon',
    url: 'https://en.wikipedia.org/wiki/A_Mathematical_Theory_of_Communication',
  },
  {
    id: 'shannon-1951',
    year: '1951',
    title: 'Prediction and Entropy of Printed English',
    authors: 'Claude Shannon',
    url: 'https://www.princeton.edu/~wbialek/rome/refs/shannon_51.pdf',
  },
  {
    id: 'turing-1950',
    year: '1950',
    title: 'Computing Machinery and Intelligence',
    authors: 'Alan Turing',
    url: 'https://en.wikipedia.org/wiki/Computing_machinery_and_intelligence',
  },

  // --- Chapter 1: rule-based chatbots ---
  {
    id: 'eliza-1966',
    year: '1966',
    title: 'ELIZA — A Computer Program for the Study of Natural Language Communication',
    authors: 'Joseph Weizenbaum',
    url: 'https://dl.acm.org/doi/10.1145/365153.365168',
  },
  {
    id: 'parry-1971',
    year: '1971',
    title: 'Artificial Paranoia (PARRY)',
    authors: 'Kenneth Colby',
    url: 'https://en.wikipedia.org/wiki/PARRY',
  },
  {
    id: 'alice-1995',
    year: '1995',
    title: 'A.L.I.C.E. — Artificial Linguistic Internet Computer Entity',
    authors: 'Richard Wallace',
    url: 'https://en.wikipedia.org/wiki/Artificial_Linguistic_Internet_Computer_Entity',
  },
  {
    id: 'smarterchild-2001',
    year: '2001',
    title: 'SmarterChild',
    authors: 'ActiveBuddy',
    url: 'https://en.wikipedia.org/wiki/SmarterChild',
  },

  // --- Chapter 2: neural networks ---
  {
    id: 'mcculloch-pitts-1943',
    year: '1943',
    title: 'A Logical Calculus of the Ideas Immanent in Nervous Activity',
    authors: 'Warren McCulloch & Walter Pitts',
    url: 'https://en.wikipedia.org/wiki/A_logical_calculus_of_the_ideas_immanent_in_nervous_activity',
  },
  {
    id: 'perceptron-1958',
    year: '1958',
    title: 'The Perceptron: A Probabilistic Model for Information Storage',
    authors: 'Frank Rosenblatt',
    url: 'https://en.wikipedia.org/wiki/Perceptron',
  },
  {
    id: 'perceptrons-1969',
    year: '1969',
    title: 'Perceptrons (and the XOR problem)',
    authors: 'Marvin Minsky & Seymour Papert',
    url: 'https://en.wikipedia.org/wiki/Perceptrons_(book)',
  },
  {
    id: 'backprop-1986',
    year: '1986',
    title: 'Learning Representations by Back-Propagating Errors',
    authors: 'Rumelhart, Hinton & Williams',
    url: 'https://www.nature.com/articles/323533a0',
  },

  // --- Chapter 3: tokenization ---
  {
    id: 'bpe-1994',
    year: '1994',
    title: 'A New Algorithm for Data Compression (Byte Pair Encoding)',
    authors: 'Philip Gage',
    url: 'https://en.wikipedia.org/wiki/Byte_pair_encoding',
  },
  {
    id: 'bpe-nmt-2015',
    year: '2015',
    title: 'Neural Machine Translation of Rare Words with Subword Units',
    authors: 'Sennrich, Haddow & Birch',
    url: 'https://arxiv.org/abs/1508.07909',
  },

  // --- Chapter 4: embeddings ---
  {
    id: 'frege-1884',
    year: '1884',
    title: 'The Foundations of Arithmetic (the context principle)',
    authors: 'Gottlob Frege',
    url: 'https://en.wikipedia.org/wiki/The_Foundations_of_Arithmetic',
  },
  {
    id: 'firth-1957',
    year: '1957',
    title: 'A Synopsis of Linguistic Theory ("know a word by the company it keeps")',
    authors: 'J. R. Firth',
    url: 'https://en.wikipedia.org/wiki/John_Rupert_Firth',
  },
  {
    id: 'word2vec-2013',
    year: '2013',
    title: 'Efficient Estimation of Word Representations in Vector Space',
    authors: 'Mikolov, Chen, Corrado & Dean',
    url: 'https://arxiv.org/abs/1301.3781',
  },
  {
    id: 'word2vec-ns-2013',
    year: '2013',
    title: 'Distributed Representations of Words and Phrases (negative sampling)',
    authors: 'Mikolov et al.',
    url: 'https://arxiv.org/abs/1310.4546',
  },

  // --- Chapter 5: transformers ---
  {
    id: 'attention-2014',
    year: '2014',
    title: 'Neural Machine Translation by Jointly Learning to Align and Translate',
    authors: 'Bahdanau, Cho & Bengio',
    url: 'https://arxiv.org/abs/1409.0473',
  },
  {
    id: 'gnmt-2016',
    year: '2016',
    title: "Google's Neural Machine Translation System",
    authors: 'Wu et al.',
    url: 'https://arxiv.org/abs/1609.08144',
  },
  {
    id: 'xavier-2010',
    year: '2010',
    title: 'Understanding the Difficulty of Training Deep Feedforward Networks',
    authors: 'Glorot & Bengio',
    url: 'https://proceedings.mlr.press/v9/glorot10a.html',
  },
  {
    id: 'attention-is-all-2017',
    year: '2017',
    title: 'Attention Is All You Need',
    authors: 'Vaswani et al.',
    url: 'https://arxiv.org/abs/1706.03762',
  },

  // --- Chapter 7: from base model to assistant ---
  {
    id: 'common-crawl',
    year: '2008',
    title: 'Common Crawl — an open crawl of the web',
    authors: 'Common Crawl Foundation',
    url: 'https://en.wikipedia.org/wiki/Common_Crawl',
  },
  {
    id: 'rlhf',
    year: '2022',
    title: 'Reinforcement Learning from Human Feedback',
    authors: 'Overview',
    url: 'https://en.wikipedia.org/wiki/Reinforcement_learning_from_human_feedback',
  },
  {
    id: 'dartmouth-1956',
    year: '1956',
    title: 'The Dartmouth Summer Research Project on AI',
    authors: 'McCarthy, Minsky, Rochester & Shannon',
    url: 'https://en.wikipedia.org/wiki/Dartmouth_workshop',
  },

  // --- Epilogue: the frontier ---
  {
    id: 'mamba-2023',
    year: '2023',
    title: 'Mamba: Linear-Time Sequence Modeling with Selective State Spaces',
    authors: 'Gu & Dao',
    url: 'https://arxiv.org/abs/2312.00752',
  },
  {
    id: 'xlstm-2024',
    year: '2024',
    title: 'xLSTM: Extended Long Short-Term Memory',
    authors: 'Beck et al.',
    url: 'https://arxiv.org/abs/2405.04517',
  },
  {
    id: 'jamba-2024',
    year: '2024',
    title: 'Jamba: A Hybrid Transformer-Mamba Language Model',
    authors: 'Lieber et al.',
    url: 'https://arxiv.org/abs/2403.19887',
  },
  {
    id: 'jepa-2022',
    year: '2022',
    title: 'A Path Towards Autonomous Machine Intelligence (JEPA)',
    authors: 'Yann LeCun',
    url: 'https://openreview.net/pdf?id=BZ5a1r-kVsf',
  },
];

const byId: Record<string, Citation> = Object.fromEntries(list.map((c) => [c.id, c]));

export function cite(id: string): Citation {
  const c = byId[id];
  if (!c) throw new Error(`Unknown citation id: ${id}`);
  return c;
}

export const allCitations = list;
