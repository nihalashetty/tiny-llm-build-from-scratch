import type { ComponentType } from 'react';
import { Prologue } from './Prologue';
import { Chapter1Eliza } from './Chapter1Eliza';
import { Chapter2NeuralNets } from './Chapter2NeuralNets';
import { Chapter3Tokenization } from './Chapter3Tokenization';
import { Chapter4Embeddings } from './Chapter4Embeddings';
import { Chapter5Transformers } from './Chapter5Transformers';
import { Chapter6Sampling } from './Chapter6Sampling';
import { Chapter7Assistant } from './Chapter7Assistant';
import { Chapter8Epilogue } from './Chapter8Epilogue';

/**
 * Maps a chapter id to its page component. Chapters not listed here fall back
 * to the "coming soon" page, so the sidebar can show the full journey while we
 * build it out.
 */
export const chapterComponents: Record<string, ComponentType> = {
  prologue: Prologue,
  chatbots: Chapter1Eliza,
  'neural-networks': Chapter2NeuralNets,
  tokenization: Chapter3Tokenization,
  embeddings: Chapter4Embeddings,
  transformers: Chapter5Transformers,
  sampling: Chapter6Sampling,
  assistant: Chapter7Assistant,
  epilogue: Chapter8Epilogue,
};
