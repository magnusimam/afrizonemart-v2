'use client';

/**
 * Stylized constellation map of Africa for the New Arrivals hero.
 *
 * Each country is a dot positioned at its approximate geographic location
 * in the SVG viewBox (0-100 × 0-110). Faint lines join neighbours so the
 * dots form a constellation that suggests the continent without redrawing
 * borders. Countries with new arrivals pulse amber.
 *
 * Click a dot → smooth-scrolls to the country chapter below.
 */

import type { CountryCode } from '@/lib/countries';
import { COUNTRIES } from '@/lib/countries';

interface DotPos {
  code: CountryCode;
  x: number;
  y: number;
}

// Approximate positions on a 100×110 viewBox. Calibrated by eye against
// a real continental map — close enough for an editorial visual.
const DOTS: DotPos[] = [
  { code: 'MA', x: 20, y: 14 },
  { code: 'DZ', x: 33, y: 18 },
  { code: 'TN', x: 42, y: 13 },
  { code: 'EG', x: 60, y: 21 },
  { code: 'ML', x: 25, y: 32 },
  { code: 'SN', x: 14, y: 35 },
  { code: 'CI', x: 26, y: 44 },
  { code: 'GH', x: 33, y: 46 },
  { code: 'NG', x: 40, y: 48 },
  { code: 'CM', x: 47, y: 52 },
  { code: 'ET', x: 67, y: 44 },
  { code: 'UG', x: 60, y: 56 },
  { code: 'RW', x: 58, y: 60 },
  { code: 'KE', x: 67, y: 58 },
  { code: 'TZ', x: 63, y: 67 },
  { code: 'AO', x: 47, y: 73 },
  { code: 'MZ', x: 64, y: 80 },
  { code: 'ZW', x: 56, y: 80 },
  { code: 'BW', x: 51, y: 86 },
  { code: 'NA', x: 44, y: 86 },
  { code: 'ZA', x: 50, y: 94 },
];

// Lightweight neighbour graph used to draw faint connecting lines —
// makes the constellation read as a coherent shape rather than scatter.
const EDGES: Array<[CountryCode, CountryCode]> = [
  ['MA', 'DZ'], ['DZ', 'TN'], ['DZ', 'ML'], ['TN', 'EG'],
  ['ML', 'SN'], ['ML', 'CI'], ['CI', 'GH'], ['GH', 'NG'],
  ['NG', 'CM'], ['CM', 'AO'], ['EG', 'ET'], ['ET', 'KE'],
  ['ET', 'UG'], ['UG', 'KE'], ['UG', 'RW'], ['RW', 'TZ'],
  ['KE', 'TZ'], ['TZ', 'MZ'], ['TZ', 'ZW'], ['MZ', 'ZA'],
  ['ZW', 'BW'], ['BW', 'NA'], ['BW', 'ZA'], ['NA', 'ZA'],
  ['AO', 'NA'], ['AO', 'ZW'],
];

interface Props {
  /** Country codes that currently have new arrivals — these dots pulse. */
  activeCodes: Set<CountryCode>;
  /** Map from country code → DOM id of its chapter section. */
  chapterIds?: Partial<Record<CountryCode, string>>;
}

export function AfricaMap({ activeCodes, chapterIds = {} }: Props) {
  const dotsByCode = Object.fromEntries(DOTS.map((d) => [d.code, d]));

  const handleClick = (code: CountryCode) => {
    const id = chapterIds[code];
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md md:max-w-lg">
      <svg
        viewBox="0 0 100 110"
        className="h-full w-full"
        aria-label="Map of Africa with countries shipping new products this week"
      >
        <defs>
          <radialGradient id="africa-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#FBAC34" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FBAC34" stopOpacity="0" />
          </radialGradient>
          {/* Glow for active dots */}
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Soft amber wash behind the constellation */}
        <circle cx="50" cy="55" r="50" fill="url(#africa-bg)" />

        {/* Edges — faint connectors */}
        <g stroke="#0D1F4E" strokeOpacity="0.12" strokeWidth="0.4">
          {EDGES.map(([a, b], i) => {
            const da = dotsByCode[a];
            const db = dotsByCode[b];
            if (!da || !db) return null;
            return <line key={i} x1={da.x} y1={da.y} x2={db.x} y2={db.y} />;
          })}
        </g>

        {/* Dots */}
        {DOTS.map((d) => {
          const active = activeCodes.has(d.code);
          const country = COUNTRIES[d.code];
          const clickable = !!chapterIds[d.code];
          return (
            <g
              key={d.code}
              transform={`translate(${d.x},${d.y})`}
              className={clickable ? 'cursor-pointer' : ''}
              onClick={clickable ? () => handleClick(d.code) : undefined}
            >
              {active && (
                <>
                  {/* Pulsing ring */}
                  <circle
                    r="2.4"
                    fill="none"
                    stroke="#FBAC34"
                    strokeWidth="0.5"
                    opacity="0.7"
                    style={{ animation: 'africa-ping 2.4s cubic-bezier(0,0,.2,1) infinite' }}
                  />
                  <circle
                    r="2.4"
                    fill="none"
                    stroke="#FBAC34"
                    strokeWidth="0.5"
                    opacity="0.5"
                    style={{
                      animation: 'africa-ping 2.4s cubic-bezier(0,0,.2,1) infinite',
                      animationDelay: '0.8s',
                    }}
                  />
                </>
              )}
              <circle
                r={active ? 2 : 1.3}
                fill={active ? '#FBAC34' : '#0D1F4E'}
                opacity={active ? 1 : 0.35}
                filter={active ? 'url(#dot-glow)' : undefined}
              />
              <title>
                {country.name}
                {active ? ' — new arrivals this week' : ''}
              </title>
            </g>
          );
        })}
      </svg>

      <style>{`
        @keyframes africa-ping {
          0% { r: 1.6; opacity: 0.7; }
          80% { r: 7; opacity: 0; }
          100% { r: 7; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
