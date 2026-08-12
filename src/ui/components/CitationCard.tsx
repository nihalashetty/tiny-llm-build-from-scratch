import { cite } from '../../content/citations';

/**
 * Renders a set of citation cards from their registry ids. Each card links out
 * to the real source (arXiv / Wikipedia / publisher) - we never reproduce the
 * papers' own figures or text.
 */
export function CitationCard({ ids }: { ids: string[] }) {
  return (
    <div className="cites">
      {ids.map((id) => {
        const c = cite(id);
        return (
          <a className="cite" key={id} href={c.url} target="_blank" rel="noreferrer">
            <span className="cite-year">{c.year}</span>
            <span className="cite-body">
              <span className="cite-title">{c.title}</span>
              <span className="cite-authors">{c.authors}</span>
            </span>
            <span className="cite-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        );
      })}
    </div>
  );
}
