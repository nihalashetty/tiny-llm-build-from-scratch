import { ArrowUpRight } from 'lucide-react';
import { cite } from '../../content/citations';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Renders a set of citation cards from their registry ids. Each card links out
 * to the real source (arXiv / Wikipedia / publisher) - we never reproduce the
 * papers' own figures or text.
 */
export function CitationCard({ ids }: { ids: string[] }) {
  return (
    <div className="my-6 grid gap-2.5">
      {ids.map((id) => {
        const c = cite(id);
        return (
          <a className="group block" key={id} href={c.url} target="_blank" rel="noreferrer">
            <Card className="flex-row items-center gap-3.5 px-4 py-3 transition-colors group-hover:border-ring">
              <Badge
                variant="secondary"
                className="min-w-[52px] justify-center rounded-md py-1 font-mono text-xs font-bold"
              >
                {c.year}
              </Badge>
              <span className="min-w-0 flex-1">
                <span className="block leading-tight font-semibold">{c.title}</span>
                <span className="mt-0.5 block text-[0.8rem] text-muted-foreground">
                  {c.authors}
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </Card>
          </a>
        );
      })}
    </div>
  );
}
