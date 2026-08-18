import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

/**
 * A framed visual with a caption. Unlike the starter design's dashed
 * placeholders, this holds real, self-drawn diagrams and interactive widgets -
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
    <figure className="my-9">
      <Card className="gap-0 overflow-hidden p-5 sm:p-6">{children}</Card>
      {caption && (
        <figcaption className="mt-2.5 text-[0.8rem] leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
