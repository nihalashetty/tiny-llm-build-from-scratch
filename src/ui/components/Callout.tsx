import type { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

/**
 * The little tip/insight box from the starter design. `emoji` sets the icon;
 * `tone="neutral"` switches from the subtle filled card to a plain bordered one.
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
    <Alert
      className={cn(
        'my-6 grid-cols-[auto_1fr] items-start gap-x-3.5',
        tone === 'coral' && 'border-transparent bg-muted',
      )}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {emoji}
      </span>
      <AlertDescription className="block text-[0.97rem] leading-relaxed text-foreground">
        {children}
      </AlertDescription>
    </Alert>
  );
}
