import { cn } from '@/lib/utils';

/**
 * A compact, JSON-ish readout of a network's actual weight numbers - the same
 * thing CJ shows as a weights file in the video. It updates live as the network
 * trains, and highlights (labelled "final weights") once training settles, so
 * you can read exactly what the model learned.
 */
export function WeightsReadout({
  title,
  rows,
  final = false,
}: {
  title: string;
  rows: { label: string; value: string }[];
  final?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 self-stretch overflow-x-auto rounded-lg border bg-zinc-900 p-3.5 font-mono text-[0.78rem]',
        final ? 'border-emerald-600' : 'border-zinc-800',
      )}
    >
      <div
        className={cn(
          'mb-2 text-[0.66rem] tracking-widest uppercase',
          final ? 'text-emerald-500' : 'text-zinc-500',
        )}
      >
        {final ? 'final weights ✓' : title}
      </div>
      {rows.map((r, i) => (
        <div className="flex justify-between gap-3.5 py-0.5 whitespace-nowrap" key={i}>
          <span className="text-amber-300">{r.label}</span>
          <span className="text-lime-300">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
