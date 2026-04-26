'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionSection {
  title: string;
  body: ReactNode;
}

interface ProductAccordionProps {
  sections: AccordionSection[];
  defaultOpen?: number;
}

export function ProductAccordion({ sections, defaultOpen = 0 }: ProductAccordionProps) {
  const [openIndex, setOpenIndex] = useState(defaultOpen);

  return (
    <div className="flex flex-col divide-y divide-border overflow-hidden rounded-card border border-border bg-white">
      {sections.map((s, i) => {
        const isOpen = i === openIndex;
        return (
          <div key={s.title}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-page"
            >
              <span className="font-raleway text-sm font-bold text-navy md:text-base">
                {s.title}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-navy transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 font-sans text-sm leading-relaxed text-charcoal">
                  {s.body}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
