import { Link } from 'react-router-dom';
import { chapterById, chapterNumber } from '../../content/curriculum';

/**
 * An in-prose reference to another chapter: "Chapter 4", linked to it.
 *
 * The number is derived from the curriculum, never typed by hand, so inserting
 * or reordering a chapter can't leave a sentence pointing at the wrong place.
 * Pass `short` for a bare number ("4") when the surrounding text already says
 * the word "chapter".
 */
export function ChapterRef({ id, short = false }: { id: string; short?: boolean }) {
  const ch = chapterById(id);
  if (!ch) throw new Error(`Unknown chapter id: ${id}`);
  const n = chapterNumber(id);
  return (
    <Link to={`/c/${id}`} className="chapter-ref" title={ch.title}>
      {short ? n : `Chapter ${n}`}
    </Link>
  );
}
