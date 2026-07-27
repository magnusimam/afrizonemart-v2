'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { Faq } from './content';

/**
 * Accordion FAQ for the supplier marketing page. Single-open behaviour;
 * the first item starts open so the section never looks empty.
 */
export function SupplierFaq({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-card border border-border bg-white shadow-card"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-raleway text-base font-semibold text-navy">
                {item.q}
              </span>
              <ChevronDown
                size={20}
                aria-hidden
                className={`shrink-0 text-amber transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <p className="border-t border-border px-5 py-4 font-sans text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
