import type { ReactNode } from 'react';

/**
 * The little tip/insight box from the starter design. `emoji` sets the icon;
 * `tone="neutral"` switches from the coral tint to a plain card.
 */
export function Callout({
  emoji = '💡',
  tone = 'coral',
  children,
}: {
  emoji?: string;
  tone?: 'coral' | 'neutral';
  children: ReactNode;
}) {
  return (
    <div className={`callout${tone === 'neutral' ? ' neutral' : ''}`}>
      <div className="emoji" aria-hidden="true">
        {emoji}
      </div>
      <div className="body">{children}</div>
    </div>
  );
}
