import * as React from 'react';
import { formatMessageDateHeader } from '@/shared/lib/formatters';

export interface DateDividerProps {
  date: string;
}

export const DateDivider: React.FC<DateDividerProps> = ({ date }) => {
  const label = formatMessageDateHeader(date);
  if (!label) return null;

  return (
    <div className="relative my-4 flex items-center justify-center px-4 select-none">
      <div className="absolute inset-0 flex items-center px-4">
        <div className="w-full border-t border-border/40" />
      </div>
      <span className="relative rounded-full border border-border/60 bg-background px-3 py-0.5 text-xs font-semibold text-muted-foreground shadow-2xs">
        {label}
      </span>
    </div>
  );
};
