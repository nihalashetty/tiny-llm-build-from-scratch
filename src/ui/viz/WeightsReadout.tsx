/**
 * A compact, JSON-ish readout of a network's actual weight numbers — the same
 * thing CJ shows as a weights file in the video. It updates live as the network
 * trains, and turns green (labelled "final weights") once training settles, so
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
    <div className={`weights-readout${final ? ' final' : ''}`}>
      <div className="wr-title">{final ? 'final weights ✓' : title}</div>
      {rows.map((r, i) => (
        <div className="wr-row" key={i}>
          <span className="wr-label">{r.label}</span>
          <span className="wr-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
