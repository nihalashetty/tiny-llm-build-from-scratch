import type { ComponentType } from 'react';
import { Prologue } from './Prologue';
import { Chapter1Eliza } from './Chapter1Eliza';

/**
 * Maps a chapter id to its page component. Chapters not listed here fall back
 * to the "coming soon" page, so the sidebar can show the full journey while we
 * build it out.
 */
export const chapterComponents: Record<string, ComponentType> = {
  prologue: Prologue,
  chatbots: Chapter1Eliza,
};
