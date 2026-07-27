import Link from 'next/link';
import {
  Check,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  GraduationCap,
  Handshake,
  Lock,
  Rocket,
  Send,
  ShieldCheck,
  TrendingUp,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { SUPPLIER_STAGES, stageHref } from '@/lib/supplier/stages';

/**
 * The supplier "journey map" — the 10 onboarding stages laid out as
 * circular stops on a winding, animated road (Discovery → Continuous
 * Engagement), modelled on the gamified learning-path reference.
 *
 * The road is one smooth Catmull-Rom spline; the travelled portion is a
 * green gradient with flowing dashes (SVG SMIL — no JS). Stage circles are
 * HTML overlaid on top, positioned by the same coordinate grid, so they
 * stay crisp, hoverable, and clickable. Each stop links to its stage page.
 */

// ── brand tokens (tailwind.config.ts) ──────────────────────────────
const TRACK = '#E8E8E8'; // border — the un-travelled road

// ── geometry ───────────────────────────────────────────────────────
const W = 1000;
const PER_ROW = 3;
const COL_X = [155, 500, 845];
const ROW_Y0 = 150;
const ROW_GAP = 290; // vertical room between rows (avoids label/circle overlap)
const STAGGER = 44; // up/down wave so the road snakes, never runs flat
const TENSION = 1.15; // >1 = swoopier curves
/** Per-stage vertical nudges (px) for fine-tuning specific stops. */
const Y_NUDGE: Record<number, number> = { 9: 48, 10: 84 };
const MAX_NUDGE = Math.max(0, ...Object.values(Y_NUDGE));
const ROW_COUNT = Math.ceil(SUPPLIER_STAGES.length / PER_ROW);
const H = ROW_Y0 + (ROW_COUNT - 1) * ROW_GAP + STAGGER + MAX_NUDGE + 140;

const STAGE_ICONS: Record<number, LucideIcon> = {
  1: Compass,
  2: Send,
  3: ClipboardList,
  4: FileSpreadsheet,
  5: GraduationCap,
  6: ShieldCheck,
  7: Handshake,
  8: Rocket,
  9: Truck,
  10: TrendingUp,
};

type Point = { x: number; y: number };
type Status = 'done' | 'current' | 'locked';

const STATUS_LABEL: Record<Status, string> = {
  done: 'Completed',
  current: 'In progress',
  locked: 'Locked',
};

/** Position of a stage's circle — snakes row by row with an up/down wave. */
function posFor(stage: number): Point {
  const index = stage - 1;
  const row = Math.floor(index / PER_ROW);
  const colIndex = index % PER_ROW;
  const cols = row % 2 === 0 ? COL_X : [...COL_X].reverse();
  const wave = (index % 2 === 0 ? -1 : 1) * STAGGER;
  const nudge = Y_NUDGE[stage] ?? 0;
  return { x: cols[colIndex], y: ROW_Y0 + row * ROW_GAP + wave + nudge };
}

/**
 * A smooth Catmull-Rom spline through `pts` (curve passes through every
 * point), emitted as cubic béziers. `tension` >1 makes the road swoopier.
 */
function smoothPath(pts: Point[], tension: number): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
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

export function SupplierJourneyMap({ currentStage }: { currentStage: number }) {
  const points = SUPPLIER_STAGES.map((s) => posFor(s.stage));
  const road = smoothPath(points, TENSION);
  // Green up to and including the current stop.
  const travelled = smoothPath(points.slice(0, currentStage), TENSION);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="relative mx-auto min-w-[540px] max-w-[720px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="presentation"
          aria-hidden
        >
          <defs>
            <linearGradient id="azm-road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A6B2E" />
              <stop offset="100%" stopColor="#2FA152" />
            </linearGradient>
            <filter id="azm-road-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000066" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* un-travelled road */}
          <path
            d={road}
            fill="none"
            stroke={TRACK}
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#azm-road-shadow)"
          />
          {/* travelled portion */}
          {travelled && (
            <>
              <path
                d={travelled}
                fill="none"
                stroke="url(#azm-road)"
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* flowing dashes — movement toward the destination */}
              <path
                d={travelled}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="1 26"
                opacity={0.9}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="27"
                  to="0"
                  dur="1.1s"
                  repeatCount="indefinite"
                />
              </path>
            </>
          )}
          {/* dashed centre line on the rest — reads as a road */}
          <path
            d={road}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeDasharray="2 22"
            strokeLinecap="round"
            opacity={0.7}
          />
        </svg>

        {/* stops */}
        {SUPPLIER_STAGES.map((s) => {
          const p = posFor(s.stage);
          const status: Status =
            s.stage < currentStage
              ? 'done'
              : s.stage === currentStage
                ? 'current'
                : 'locked';
          return (
            <JourneyStop
              key={s.stage}
              stage={s.stage}
              name={s.name}
              status={status}
              leftPct={(p.x / W) * 100}
              topPct={(p.y / H) * 100}
            />
          );
        })}
      </div>
    </div>
  );
}

function JourneyStop({
  stage,
  name,
  status,
  leftPct,
  topPct,
}: {
  stage: number;
  name: string;
  status: Status;
  leftPct: number;
  topPct: number;
}) {
  const Icon = STAGE_ICONS[stage] ?? Compass;
  const locked = status === 'locked';

  const size = status === 'current' ? 'h-[86px] w-[86px]' : 'h-[66px] w-[66px]';
  const circle =
    status === 'done'
      ? 'bg-gradient-to-br from-[#2FA152] to-success text-white ring-4 ring-success/25'
      : status === 'current'
        ? 'bg-gradient-to-br from-amber to-amber-dark text-navy ring-4 ring-amber/30 shadow-[0_0_0_8px_rgba(251,172,52,0.18)]'
        : 'bg-white text-muted ring-2 ring-border group-hover:ring-navy group-hover:text-navy';

  // Locked stops are not navigable — the journey is strictly sequential.
  const Wrapper = locked ? 'div' : Link;
  const wrapperProps = locked
    ? { 'aria-disabled': true as const }
    : { href: stageHref(stage) };

  return (
    <Wrapper
      {...(wrapperProps as { href: string })}
      title={name}
      aria-label={`Stage ${stage}: ${name} — ${STATUS_LABEL[status]}`}
      className={`group absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none ${
        locked ? 'cursor-not-allowed' : ''
      }`}
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      <span className="relative block">
        {/* hover tooltip */}
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1 font-sans text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          {STATUS_LABEL[status]}
          <span
            aria-hidden
            className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-navy"
          />
        </span>

        <span
          className={`flex ${size} items-center justify-center rounded-full shadow-card ring-offset-2 ring-offset-white transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:shadow-xl group-focus-visible:ring-2 group-focus-visible:ring-navy ${circle}`}
        >
          <Icon
            size={status === 'current' ? 34 : 26}
            aria-hidden
            strokeWidth={2}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </span>

        {/* current: pulsing halo */}
        {status === 'current' && (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full ring-2 ring-amber/60 motion-reduce:hidden"
          />
        )}

        {/* done: green check badge */}
        {status === 'done' && (
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white ring-2 ring-white"
          >
            <Check size={13} strokeWidth={3} aria-hidden />
          </span>
        )}

        {/* locked: lock badge */}
        {status === 'locked' && (
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-muted ring-1 ring-border transition-colors group-hover:text-navy"
          >
            <Lock size={12} aria-hidden />
          </span>
        )}

        {/* stage number */}
        <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy font-raleway text-[11px] font-bold text-white ring-2 ring-white">
          {stage}
        </span>
      </span>

      {/* stop name */}
      <span
        className={`absolute left-1/2 top-full mt-2.5 w-28 -translate-x-1/2 text-center font-raleway text-[12px] leading-tight transition-colors ${
          status === 'current'
            ? 'font-bold text-navy'
            : status === 'done'
              ? 'font-semibold text-charcoal group-hover:text-navy'
              : 'text-muted group-hover:text-navy'
        }`}
      >
        {name}
      </span>
    </Wrapper>
  );
}
