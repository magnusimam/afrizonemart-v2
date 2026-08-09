'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SupplierFAQ } from '@/lib/supplier/support';

/**
 * Accordion of supplier FAQs. One open at a time, smooth height/opacity
 * transition, fully keyboard- and screen-reader-friendly (button +
 * aria-expanded + region). Data comes from `support.ts`.
 */
export function SupplierFAQList({ faqs }: { faqs: SupplierFAQ[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-card border bg-white shadow-card transition-colors ${
              isOpen ? 'border-amber/50' : 'border-border hover:border-navy/30'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
              <span
                className={`font-raleway text-sm font-bold transition-colors ${
                  isOpen ? 'text-navy' : 'text-charcoal'
                }`}
              >
                {faq.q}
              </span>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  isOpen ? 'rotate-180 bg-amber text-navy' : 'bg-page text-muted'
                }`}
              >
                <ChevronDown size={16} aria-hidden />
              </span>
            </button>
            <div
              id={`faq-panel-${i}`}
              role="region"
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 font-sans text-sm leading-relaxed text-muted">
                  {faq.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
