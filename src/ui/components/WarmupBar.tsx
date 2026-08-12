/**
 * A slim "warming up the pretrained model…" bar shown by Part 2 labs while the
 * shared TinyTransformer finishes its background warm-up. Once `ready`, it
 * collapses to a tiny "weights frozen" badge - reinforcing that inference never
 * changes the model.
 */
export function WarmupBar({ ready, progress }: { ready: boolean; progress: number }) {
  if (ready) {
    return (
      <div className="warmup ready" aria-live="polite">
        <span className="warmup-badge">❄ weights frozen · running inference</span>
      </div>
    );
  }
  return (
    <div className="warmup" aria-live="polite">
      <span className="warmup-label">warming up the pretrained model…</span>
      <span className="warmup-track">
        <span className="warmup-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </span>
    </div>
  );
}
