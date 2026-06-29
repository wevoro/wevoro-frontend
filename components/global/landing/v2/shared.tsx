import { cn } from '@/lib/utils';
import React from 'react';

// Hairline border color from the Figma: rgba(26, 92, 56, 0.12)
export const HAIRLINE = 'border-[#1a5c38]/[0.12]';

// Serif italic accent used for emphasis words throughout the redesign.
export function Serif({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-[family-name:var(--font-newsreader)] font-normal italic',
        className
      )}
    >
      {children}
    </span>
  );
}

// Small uppercase tracked label that sits above each section heading.
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-xs font-semibold uppercase tracking-[1.2px] text-primary',
        className
      )}
    >
      {children}
    </span>
  );
}

// Constrained content wrapper matching the Figma frame (max 1440, ~65px gutters).
export function Bound({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1440px] px-5 sm:px-10 lg:px-[65px]',
        className
      )}
    >
      {children}
    </div>
  );
}
