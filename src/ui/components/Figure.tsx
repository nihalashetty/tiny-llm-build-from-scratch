import type { ReactNode } from 'react';

/**
 * A framed visual with a caption. Unlike the starter design's dashed
 * placeholders, this holds real, self-drawn diagrams and interactive widgets —
 * never scanned figures from papers.
 */
export function Figure({
  caption,
  children,
}: {
  caption?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="figure">
      <div className="figure-frame">{children}</div>
      {caption && <figcaption className="figure-cap">{caption}</figcaption>}
    </figure>
  );
}
