import { Check } from 'lucide-react';

export type CheckoutStepStatus = 'done' | 'active' | 'pending';

export interface CheckoutStep {
  num: number;
  label: string;
  status: CheckoutStepStatus;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
}

export function CheckoutProgress({ steps }: CheckoutProgressProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-2 md:gap-4">
      {steps.map((s, i) => (
        <div key={s.num} className="flex flex-1 items-center gap-2 md:gap-3">
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full font-raleway text-sm font-bold transition-colors md:h-10 md:w-10 md:text-base ${
                s.status === 'done'
                  ? 'bg-success text-white'
                  : s.status === 'active'
                    ? 'bg-navy text-white'
                    : 'bg-page text-muted ring-1 ring-border'
              }`}
              aria-hidden
            >
              {s.status === 'done' ? <Check size={16} strokeWidth={3} /> : s.num}
            </span>
            <span
              className={`font-raleway text-xs font-bold uppercase tracking-btn md:text-sm ${
                s.status === 'pending' ? 'text-muted' : 'text-navy'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <span
              className={`hidden h-px flex-1 md:block ${
                s.status === 'done' ? 'bg-success' : 'bg-border'
              }`}
              aria-hidden
            />
          )}
        </div>
      ))}
    </div>
  );
}
