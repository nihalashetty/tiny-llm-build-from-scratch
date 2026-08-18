import { Progress } from '@/components/ui/progress';

/**
 * A slim "warming up the pretrained model…" bar shown by Part 2 labs while the
 * shared TinyTransformer finishes its background warm-up. Once `ready`, it
 * collapses to a tiny "weights frozen" badge - reinforcing that inference never
 * changes the model.
 */
export function WarmupBar({ ready, progress }: { ready: boolean; progress: number }) {
  if (ready) {
    return (
      <div className="mb-3 flex items-center" aria-live="polite">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 font-mono text-[0.66rem] text-muted-foreground">
          ❄ weights frozen · running inference
        </span>
      </div>
    );
  }
  return (
    <div
      className="mb-3 flex items-center gap-2.5 font-mono text-[0.7rem] text-muted-foreground"
      aria-live="polite"
    >
      <span className="whitespace-nowrap">warming up the pretrained model…</span>
      <Progress value={Math.round(progress * 100)} className="h-1.5 max-w-[220px]" />
    </div>
  );
}
