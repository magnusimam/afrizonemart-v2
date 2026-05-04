'use client';

import { useState } from 'react';
import { AfricaMap } from '@/components/sections/AfricaMap';
import type { ApiPageSection, AfricaMapSectionConfig } from '@/lib/api/page-builder';

interface Props {
  section: ApiPageSection;
}

/// Client wrapper because AfricaMap is interactive (click → country
/// detail panel). The underlying selectedCountry state lives here so
/// the section is self-contained — admins don't have to wire a
/// callback in the builder.
export function BuilderAfricaMapSection({ section }: Props) {
  const config = section.config as AfricaMapSectionConfig;
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);

  return (
    <section className="bg-white py-10 md:py-14">
      <div className="mx-auto max-w-site px-4">
        {(config.headline || section.headline) && (
          <header className="mb-6 text-center">
            <h2 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              {config.headline ?? section.headline}
            </h2>
            {config.subheadline && (
              <p className="mt-1 font-sans text-sm text-muted md:text-base">
                {config.subheadline}
              </p>
            )}
          </header>
        )}
        <AfricaMap
          selectedCountry={selectedCountry}
          onCountrySelect={(countryName) => setSelectedCountry(countryName)}
        />
      </div>
    </section>
  );
}
