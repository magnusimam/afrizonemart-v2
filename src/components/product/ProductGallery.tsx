'use client';

import Image from 'next/image';
import { useState } from 'react';
import { getCountry } from '@/lib/countries';
import type { ProductImage } from '@/lib/products';

interface ProductGalleryProps {
  images: ProductImage[];
  origin?: string;
  discountPercent?: number;
}

export function ProductGallery({ images, origin, discountPercent }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const country = getCountry(origin);
  const isDeal = typeof discountPercent === 'number';
  const main = images[activeIndex];

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-4">
      <div className="group relative aspect-square overflow-hidden rounded-card bg-page shadow-card">
        <Image
          src={main.src}
          alt={main.alt}
          width={1200}
          height={1200}
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {country && (
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-input bg-white/95 px-2.5 py-1 font-sans text-xs font-semibold text-charcoal shadow-sm backdrop-blur">
            <span aria-hidden>{country.flag}</span>
            <span>Made in {country.name}</span>
          </div>
        )}

        {isDeal && (
          <div className="absolute right-4 top-4 rounded-input bg-amber px-3 py-1.5 font-raleway text-sm font-bold text-navy shadow-sm">
            −{discountPercent}%
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === activeIndex}
              className={`overflow-hidden rounded-card transition-all ${
                i === activeIndex
                  ? 'ring-2 ring-navy ring-offset-2'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <div className="aspect-square">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
