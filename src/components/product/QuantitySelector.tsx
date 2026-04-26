'use client';

import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className="inline-flex items-center overflow-hidden rounded-btn border-2 border-border bg-white">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center text-navy transition-colors hover:bg-page disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={16} strokeWidth={2.5} aria-hidden />
      </button>
      <span className="flex h-10 min-w-[3rem] items-center justify-center border-x-2 border-border font-raleway text-base font-bold text-navy">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center text-navy transition-colors hover:bg-page disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={16} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
