import { BadgeCheck, Clock, MapPin } from 'lucide-react';
import { GrowBar } from '@/components/supplier/marketing/Reveal';

/**
 * A miniature, screenshot-style preview of the real supplier dashboard —
 * window chrome, welcome strip, KPI tiles, and product statuses — so the
 * marketing page shows (not just tells) what suppliers get.
 */
const KPIS = [
  { label: 'Stage', value: '4/10', icon: MapPin, tone: 'bg-amber-light text-amber-dark' },
  { label: 'Approved', value: '1', icon: BadgeCheck, tone: 'bg-success/10 text-success' },
  { label: 'In review', value: '1', icon: Clock, tone: 'bg-navy-light text-navy' },
];

const PRODUCTS = [
  { name: 'Mango Chili Sauce', status: 'Approved', tone: 'bg-success/10 text-success' },
  { name: 'Hibiscus Tea 250g', status: 'Under review', tone: 'bg-amber-light text-amber-dark' },
  { name: 'Plantain Chips', status: 'Draft', tone: 'bg-white text-muted ring-1 ring-border' },
];

export function LandingDashboardMock() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card-hover ring-1 ring-black/5">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-page px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 truncate font-sans text-[11px] text-muted">
          supplier.afrizonemart.com / dashboard
        </span>
      </div>

      <div className="p-5">
        {/* welcome strip */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-navy to-[#0a1942] p-4 text-white">
          <span
            aria-hidden
            className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber/20 blur-2xl"
          />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber to-amber-dark font-raleway text-sm font-extrabold text-navy">
              AF
            </span>
            <div className="min-w-0">
              <p className="font-raleway text-sm font-bold text-white">Welcome back, Adia Foods</p>
              <p className="truncate font-sans text-[11px] text-white/70">
                Stage 4 — Product Questionnaire
              </p>
            </div>
          </div>
          <div className="relative mt-3">
            <GrowBar to={40} className="!h-1.5 bg-white/15" />
            <p className="mt-1.5 font-sans text-[11px] text-white/70">4 of 10 stages · 30% complete</p>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {KPIS.map((k) => (
            <div key={k.label} className="rounded-xl border border-border bg-white p-2.5 shadow-card">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${k.tone}`}>
                <k.icon size={14} aria-hidden />
              </span>
              <p className="mt-1.5 font-raleway text-base font-extrabold leading-none text-navy">
                {k.value}
              </p>
              <p className="mt-0.5 font-raleway text-[9px] font-bold uppercase tracking-btn text-muted">
                {k.label}
              </p>
            </div>
          ))}
        </div>

        {/* products */}
        <p className="mt-4 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
          My PIQs
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {PRODUCTS.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-lg border border-border bg-page px-3 py-2"
            >
              <span className="font-sans text-xs font-medium text-charcoal">{p.name}</span>
              <span className={`rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold ${p.tone}`}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
