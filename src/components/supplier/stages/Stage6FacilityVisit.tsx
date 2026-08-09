'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { getSupplierVisit, requestSupplierVisit } from '@/lib/api/supplier';

/**
 * Stage 6 — Facility Visit (live). The supplier proposes a date; the
 * Facility Visit team confirms it from the admin. Reads/writes the API.
 */
const WHAT_TO_EXPECT = [
  'A 2–3 hour walkthrough of your production site',
  'Review of hygiene, equipment, storage, and process controls',
  'Photos and notes captured on our digital audit form',
];

function fmtDate(iso: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function Stage6FacilityVisit() {
  const queryClient = useQueryClient();
  const { data: visit, isLoading } = useQuery({
    queryKey: ['supplier', 'visit'],
    queryFn: getSupplierVisit,
    retry: false,
  });

  const [preferredDate, setPreferredDate] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!preferredDate) return;
    setBusy(true);
    try {
      await requestSupplierVisit({ preferredDate, address: address || undefined });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'visit'] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-card bg-white shadow-card" />
      ) : visit?.status === 'CONFIRMED' || visit?.status === 'COMPLETED' ? (
        <section className="rounded-card border border-success/40 bg-[#EAFAF1] p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success text-white">
              <CheckCircle2 size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-raleway text-lg font-bold text-navy">
                {visit.status === 'COMPLETED' ? 'Visit completed' : 'Visit confirmed'}
              </h2>
              <p className="mt-1 font-sans text-sm leading-relaxed text-charcoal">
                {visit.status === 'COMPLETED'
                  ? 'Thanks for hosting us. Our team is preparing your report — you’ll hear from us with next steps.'
                  : 'Our Facility Visit team will see you then. Please have your production site ready for the walkthrough.'}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Detail label="Date" value={`${fmtDate(visit.confirmedDate)}${visit.confirmedWindow ? ` · ${visit.confirmedWindow}` : ''}`} />
                {visit.address && <Detail label="Address" value={visit.address} />}
                {visit.leadName && <Detail label="Team lead" value={`${visit.leadName}${visit.leadPhone ? ` · ${visit.leadPhone}` : ''}`} />}
                {visit.notes && <Detail label="Notes" value={visit.notes} />}
              </dl>
            </div>
          </div>
        </section>
      ) : visit?.status === 'REQUESTED' ? (
        <section className="rounded-card border border-amber/40 bg-amber-light/50 p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber text-navy">
              <Clock size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-raleway text-lg font-bold text-navy">Visit requested</h2>
              <p className="mt-1 font-sans text-sm leading-relaxed text-charcoal">
                You proposed <strong>{visit.preferredDate}</strong>. Our Facility Visit
                team will confirm the exact date and send you the details.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPreferredDate('');
                  // allow re-proposing by clearing local + letting the form show
                  queryClient.setQueryData(['supplier', 'visit'], { ...visit, status: 'CANCELLED' });
                }}
                className="mt-3 font-raleway text-sm font-semibold text-navy underline-offset-2 hover:underline"
              >
                Propose a different date
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-card border border-border bg-white p-6 shadow-card">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
              <CalendarDays size={20} aria-hidden />
            </span>
            <div className="w-full">
              <h2 className="font-raleway text-lg font-bold text-navy">Book your facility visit</h2>
              <p className="mt-1 max-w-lg font-sans text-sm leading-relaxed text-muted">
                Propose a date that works for you. Our team will confirm the exact
                time and send you the details.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Preferred date</span>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm focus:border-amber focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Site address (optional)</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Where we’ll visit"
                    className="rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm focus:border-amber focus:outline-none"
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={!preferredDate || busy}
                onClick={submit}
                className="mt-4 inline-flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <Clock size={16} aria-hidden /> Request this date
              </button>
            </div>
          </div>
        </section>
      )}

      {/* What to expect */}
      <section className="rounded-card border border-border bg-white p-6 shadow-card">
        <h3 className="flex items-center gap-2 font-raleway text-sm font-bold uppercase tracking-btn text-navy">
          <ClipboardList size={16} aria-hidden /> What to expect
        </h3>
        <ul className="mt-3 flex flex-col gap-2">
          {WHAT_TO_EXPECT.map((t, i) => (
            <li key={i} className="flex gap-2 font-sans text-sm leading-relaxed text-charcoal">
              <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* After the visit */}
      <section className="rounded-card border border-amber/40 bg-gradient-to-br from-amber-light to-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber to-amber-dark text-white shadow-md">
            <FileText size={20} aria-hidden />
          </span>
          <div>
            <h3 className="font-raleway text-base font-bold text-navy">After your visit</h3>
            <p className="mt-1 max-w-lg font-sans text-sm leading-relaxed text-charcoal">
              Our team turns the audit into a detailed report. If you’re ready, you
              move straight to <strong>Partnership</strong>. If there are gaps, we’ll
              recommend a <strong>Cally Valley</strong> programme to close them.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-raleway text-xs font-semibold text-navy ring-1 ring-amber/30">
                <ShieldCheck size={13} aria-hidden className="text-amber-dark" /> Certification readiness
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-raleway text-xs font-semibold text-navy ring-1 ring-amber/30">
                <MapPin size={13} aria-hidden className="text-amber-dark" /> Tiered support plans
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input bg-white/70 p-3">
      <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</dt>
      <dd className="mt-0.5 font-sans text-sm font-semibold text-charcoal">{value}</dd>
    </div>
  );
}
