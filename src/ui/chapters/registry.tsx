import type { ComponentType } from 'react';
import { Prologue } from './Prologue';
import { Chapter1Eliza } from './Chapter1Eliza';
import { Chapter2NeuralNets } from './Chapter2NeuralNets';
import { Chapter3Tokenization } from './Chapter3Tokenization';
import { Chapter4Embeddings } from './Chapter4Embeddings';
import { Chapter5Transformers } from './Chapter5Transformers';
import { Chapter6Sampling } from './Chapter6Sampling';
import { ChapterEvaluation } from './ChapterEvaluation';
import { ChapterScaling } from './ChapterScaling';
import { Chapter7Assistant } from './Chapter7Assistant';
import { Chapter8Epilogue } from './Chapter8Epilogue';
import { ChapterInferenceOverview } from './ChapterInferenceOverview';
import { ChapterInferenceTokenize } from './ChapterInferenceTokenize';
import { ChapterInferenceChatFormat } from './ChapterInferenceChatFormat';
import { ChapterInferenceEmbed } from './ChapterInferenceEmbed';
import { ChapterInferenceForward } from './ChapterInferenceForward';
import { ChapterInferenceLogits } from './ChapterInferenceLogits';
import { ChapterInferenceLoop } from './ChapterInferenceLoop';
import { ChapterInferenceRun } from './ChapterInferenceRun';

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
  evaluation: ChapterEvaluation,
  scaling: ChapterScaling,
  assistant: Chapter7Assistant,
  epilogue: Chapter8Epilogue,
  'inference-overview': ChapterInferenceOverview,
  'inference-tokenize': ChapterInferenceTokenize,
  'inference-chat-format': ChapterInferenceChatFormat,
  'inference-embed': ChapterInferenceEmbed,
  'inference-forward': ChapterInferenceForward,
  'inference-logits': ChapterInferenceLogits,
  'inference-loop': ChapterInferenceLoop,
  'inference-run': ChapterInferenceRun,
};
