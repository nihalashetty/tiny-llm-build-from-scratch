import { ChapterFrame } from '../components/ChapterFrame';
import { Callout } from '../components/Callout';
import { chapterById } from '../../content/curriculum';

/**
 * Placeholder for chapters that aren't fully written yet. The reader can still
 * see the whole journey in the sidebar and know what's coming.
 */
export function ComingSoon({ id }: { id: string }) {
  const ch = chapterById(id)!;
  return (
    <ChapterFrame id={id}>
      <p className="lead">{ch.blurb}</p>
      <Callout emoji="🚧">
        This chapter is being built next. The engine underneath - the story
        layout, animations, and the run-it-yourself code - is already working;
        we're rolling chapters out one polished piece at a time so nothing feels
        half-baked.
      </Callout>
      <p className="dim">
        In the meantime, hop back to a finished chapter from the sidebar. Your
        progress is saved automatically as you go.
      </p>
    </ChapterFrame>
  );
}
