'use client';

import { useMemo, useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { geoMercator } from 'd3-geo';
import {
  AFRICA_ISO,
  ALL_AFRICA_ENTRIES,
  LABEL_ABBREV,
  LABELED_COUNTRIES,
  REGION_HEX,
  REGION_TINT,
  padIso,
  type Region,
} from './africa-map-data';

interface AfricaMapProps {
  /** Fired when the user clicks a country.
   *  - countryName: display name ("Nigeria", "Côte d'Ivoire", …)
   *  - iso2: our internal ISO-2 code ("NG")
   *  - isOnPlatform: true if `activeIso2` includes the country */
  onCountrySelect: (countryName: string, iso2: string, isOnPlatform: boolean) => void;
  selectedCountry?: string;
  /** ISO-2 codes that currently have products. Anything outside this set
   *  is treated as "coming soon" — the map still renders it normally,
   *  the parent decides what to do on click. Pass `undefined` to make
   *  every country act as on-platform. */
  activeIso2?: Set<string>;
}

const PROJECTION_CONFIG = { scale: 480, center: [22, 3] as [number, number] };
const MAP_WIDTH = 900;
const MAP_HEIGHT = 900;

/**
 * Choropleth-style interactive map of Africa with regional tinting,
 * capital pulse dots, and a HUD of cartographic chrome.
 *
 * Built on react-simple-maps + the world-atlas Natural Earth 50m
 * topology served from /maps/world-50m.json. Filters geographies down
 * to the 54 AU members listed in `africa-map-data.ts`.
 */
export function AfricaMap({
  onCountrySelect,
  selectedCountry,
  activeIso2,
}: AfricaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<Region | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const selectedRegion: Region | null = useMemo(() => {
    if (!selectedCountry) return null;
    const entry = ALL_AFRICA_ENTRIES.find((e) => e.name === selectedCountry);
    return entry?.region ?? null;
  }, [selectedCountry]);

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(PROJECTION_CONFIG.scale)
        .center(PROJECTION_CONFIG.center)
        .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]),
    [],
  );

  function handleMouseMove(
    e: React.MouseEvent,
    countryName: string,
    region: Region,
  ) {
    setHoveredCountry(countryName);
    setHoveredRegion(region);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  function handleMouseLeave() {
    setHoveredCountry(null);
    setHoveredRegion(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[420px] md:min-h-[480px]"
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={PROJECTION_CONFIG}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <defs>
          <filter id="countryGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <Geographies geography="/maps/world-50m.json">
          {({ geographies }) =>
            geographies
              .filter((geo) => AFRICA_ISO[padIso(geo.id)])
              .map((geo) => {
                const entry = AFRICA_ISO[padIso(geo.id)];
                const { name, region } = entry;
                const isSelected = selectedCountry === name;
                const isHovered = hoveredCountry === name;
                const sameRegionRef = isHovered
                  ? region === hoveredRegion
                  : selectedRegion === region;
                const isRegionMate = sameRegionRef && !isSelected && !isHovered;

                // Light-theme palette so the map blends into the hero's
                // warm gradient instead of looking like a dark photo
                // pasted on top.
                const fill = isSelected
                  ? 'rgba(245,166,35,0.45)' // amber selection
                  : isRegionMate
                    ? REGION_TINT[region]
                    : 'rgba(13,31,78,0.06)'; // very faint navy tint
                const stroke = isSelected
                  ? '#0D1F4E' // navy outline on selected
                  : isRegionMate
                    ? REGION_HEX[region] + '80'
                    : 'rgba(13,31,78,0.25)';

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseMove={(e) => handleMouseMove(e, name, region)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => {
                      const isOnPlatform = activeIso2
                        ? activeIso2.has(entry.iso2)
                        : true;
                      onCountrySelect(name, entry.iso2, isOnPlatform);
                    }}
                    style={{
                      default: {
                        fill,
                        stroke,
                        strokeWidth: isSelected ? 1.4 : 0.6,
                        outline: 'none',
                        transition: 'fill 0.25s, stroke 0.25s',
                        filter: isSelected ? 'url(#countryGlow)' : undefined,
                      },
                      hover: {
                        fill: REGION_HEX[region] + '40',
                        stroke: REGION_HEX[region],
                        strokeWidth: 1.1,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: REGION_HEX[region] + '60',
                        stroke: REGION_HEX[region],
                        strokeWidth: 1.3,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
          }
        </Geographies>

        <Geographies geography="/maps/world-50m.json">
          {({ geographies }) =>
            geographies
              .filter((geo) => {
                const entry = AFRICA_ISO[padIso(geo.id)];
                return entry && LABELED_COUNTRIES.has(entry.name);
              })
              .map((geo) => {
                const entry = AFRICA_ISO[padIso(geo.id)];
                const display =
                  LABEL_ABBREV[entry.name] !== undefined
                    ? LABEL_ABBREV[entry.name]
                    : entry.name;
                if (!display) return null;
                const centroid = geoCentroidOf(geo);
                if (!centroid) return null;
                const screen = projection(centroid);
                if (!screen) return null;
                const isHovered = hoveredCountry === entry.name;
                return (
                  <text
                    key={`label-${entry.iso2}`}
                    x={screen[0]}
                    y={screen[1]}
                    textAnchor="middle"
                    style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: isHovered ? 11 : 9,
                      fontWeight: isHovered ? 700 : 500,
                      fill: isHovered ? '#0D1F4E' : 'rgba(13,31,78,0.55)',
                      letterSpacing: '0.02em',
                      pointerEvents: 'none',
                      paintOrder: 'stroke',
                      stroke: 'rgba(255,255,255,0.85)',
                      strokeWidth: 2,
                    }}
                  >
                    {display}
                  </text>
                );
              })
          }
        </Geographies>

        {ALL_AFRICA_ENTRIES.map((entry) => {
          const isSelected = entry.name === selectedCountry;
          const isHovered = entry.name === hoveredCountry;
          const haloRange = isSelected ? '7;14;7' : '3;6;3';
          const haloDur = isSelected ? '1.6s' : '2.4s';
          const innerR = isSelected ? 3 : isHovered ? 2.4 : 1.6;
          return (
            <Marker key={`dot-${entry.iso2}`} coordinates={entry.capital}>
              <circle
                r={3}
                fill={REGION_HEX[entry.region]}
                fillOpacity={0.15}
                style={{ pointerEvents: 'none' }}
              >
                <animate
                  attributeName="r"
                  values={haloRange}
                  dur={haloDur}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="fill-opacity"
                  values="0.45;0;0.45"
                  dur={haloDur}
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                r={innerR}
                fill={REGION_HEX[entry.region]}
                stroke="#FFFFFF"
                strokeWidth={0.6}
                style={{ pointerEvents: 'none' }}
              />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Minimal region legend — bottom center, no card chrome.
          Helps visitors decode the regional tinting they see when
          hovering a country. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2">
        {(['North', 'West', 'Central', 'East', 'Southern'] as Region[]).map((r) => (
          <div key={r} className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: REGION_HEX[r] }}
            />
            <span className="font-sans text-[10px] font-medium text-muted">{r}</span>
          </div>
        ))}
      </div>

      {/* Light-theme tooltip that follows the cursor. */}
      {hoveredCountry && hoveredRegion ? (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 14,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="rounded-card border border-border bg-white px-3 py-2 shadow-card whitespace-nowrap">
            <p className="font-raleway text-xs font-bold text-navy">{hoveredCountry}</p>
            <p
              className="font-sans text-[10px] uppercase tracking-wider"
              style={{ color: REGION_HEX[hoveredRegion] }}
            >
              {hoveredRegion} Africa
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Average the coordinates of a GeoJSON feature's first ring for a
 * rough centroid suitable for placing a label. Handles Polygon
 * ([ring]) and MultiPolygon ([[ring], [ring]…]); for the latter we
 * pick the largest polygon so labels stay on the mainland of countries
 * with offshore islands (Tanzania → mainland, not Zanzibar). */
function geoCentroidOf(geo: {
  geometry: { type: string; coordinates: unknown };
}): [number, number] | null {
  try {
    const { type, coordinates } = geo.geometry;
    let ring: number[][] | null = null;
    if (type === 'Polygon') {
      ring = (coordinates as number[][][])[0];
    } else if (type === 'MultiPolygon') {
      const polys = coordinates as number[][][][];
      let best = polys[0][0];
      let bestLen = best.length;
      for (const poly of polys) {
        if (poly[0].length > bestLen) {
          best = poly[0];
          bestLen = best.length;
        }
      }
      ring = best;
    }
    if (!ring || ring.length === 0) return null;
    let sx = 0;
    let sy = 0;
    for (const [x, y] of ring) {
      sx += x;
      sy += y;
    }
    return [sx / ring.length, sy / ring.length];
  } catch {
    return null;
  }
}
