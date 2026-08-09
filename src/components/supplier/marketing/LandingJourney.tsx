import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  FileSpreadsheet,
  GraduationCap,
  Handshake,
  PackageCheck,
  Rocket,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { JOURNEY } from '@/components/supplier/marketing/content';

/**
 * The 10-stage journey as a winding "road" — the same gamified visual
 * language as the in-portal dashboard map, but read-only and built for the
 * marketing page. Stops snake left↔right and rise/fall so the path feels
 * like a journey. Each stop carries its stage name + one-line summary.
 */

const ICONS: Record<string, LucideIcon> = {
  Handshake,
  ClipboardList,
  Building2,
  FileSpreadsheet,
  GraduationCap,
  ShieldCheck,
  FileSignature,
  Rocket,
  PackageCheck,
  TrendingUp,
};

// ── geometry ───────────────────────────────────────────────────────
const W = 1000;
const PER_ROW = 3;
const COL_X = [165, 500, 835];
const ROW_Y0 = 130;
const ROW_GAP = 300;
const STAGGER = 42; // up/down wave so the road never runs flat
const TENSION = 1.15;
const ROW_COUNT = Math.ceil(JOURNEY.length / PER_ROW);
const H = ROW_Y0 + (ROW_COUNT - 1) * ROW_GAP + STAGGER + 170;

type Point = { x: number; y: number };

function posFor(stage: number): Point {
  const index = stage - 1;
  const row = Math.floor(index / PER_ROW);
  const colIndex = index % PER_ROW;
  const cols = row % 2 === 0 ? COL_X : [...COL_X].reverse();
  const wave = (index % 2 === 0 ? -1 : 1) * STAGGER;
  return { x: cols[colIndex], y: ROW_Y0 + row * ROW_GAP + wave };
}

/** Smooth Catmull-Rom spline through `pts`, emitted as cubic béziers. */
function smoothPath(pts: Point[], tension: number): string {
  if (pts.length < 2) return '';
  const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`);
  }
  return d.join(' ');
}

export function LandingJourney() {
  const points = JOURNEY.map((s) => posFor(s.stage));
  const road = smoothPath(points, TENSION);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="relative mx-auto min-w-[680px] max-w-[900px]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="presentation" aria-hidden>
          <defs>
            <linearGradient id="azm-landing-road" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#000066" />
              <stop offset="100%" stopColor="#FBAC34" />
            </linearGradient>
            <filter id="azm-landing-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000066" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* the road */}
          <path
            d={road}
            fill="none"
            stroke="url(#azm-landing-road)"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#azm-landing-shadow)"
          />
          {/* dashed centre line — reads as a road */}
          <path
            d={road}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeDasharray="2 20"
            strokeLinecap="round"
            opacity={0.75}
          />
        </svg>

        {/* stops */}
        {JOURNEY.map((s) => {
          const p = posFor(s.stage);
          const Icon = ICONS[s.icon] ?? CheckCircle2;
          return (
            <div
              key={s.stage}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber to-amber-dark text-navy shadow-card ring-4 ring-white transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                  <Icon size={26} aria-hidden strokeWidth={2} />
                  <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy font-raleway text-[11px] font-bold text-white ring-2 ring-white">
                    {s.stage}
                  </span>
                </span>
                <div className="mt-3 w-44 text-center">
                  <p className="font-raleway text-sm font-bold text-navy">{s.name}</p>
                  <p className="mt-0.5 font-sans text-xs leading-snug text-muted">
                    {s.tagline}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
