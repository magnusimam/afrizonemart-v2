'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Clapperboard,
  ImagePlus,
  Loader2,
  Rocket,
  Upload,
  X,
} from 'lucide-react';
import {
  getStageAnswers,
  getSupplierProductionBooking,
  saveStageAnswers,
  uploadListingPhoto,
} from '@/lib/api/supplier';

/**
 * Stage 8 — Activation & Listing. After "It's Made in Africa" production the
 * supplier re-uploads listing photos to AZM's spec and submits for listing.
 * Live: photos upload to the supplier upload endpoint and persist in the
 * stage-8 answers; submitting records the handoff to the Product Upload team.
 */
const SHOTS = [
  { id: 'front', label: 'Front pack', hint: 'Straight-on, label legible' },
  { id: 'back', label: 'Back / nutrition panel', hint: 'Ingredients & barcode sharp' },
  { id: 'lifestyle', label: 'In-use / lifestyle', hint: 'Product in context' },
  { id: 'scale', label: 'Scale reference', hint: 'Show real-world size' },
];
const SPEC = 'JPEG/PNG · ≥ 1500×1500px · clean white or neutral background';

interface Stage8Answers {
  photos?: Record<string, string>;
  submittedAt?: string;
  publishedAt?: string;
}

export function Stage8Activation() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'stage', 8],
    queryFn: () => getStageAnswers(8) as Promise<Stage8Answers>,
    retry: false,
  });

  // The Take50 shoot. Booked by the crew from the admin side, so this is
  // read-only here — but it has to be shown: the booking email used to be the
  // only record of the date, which left a supplier who lost it with nothing.
  const { data: booking } = useQuery({
    queryKey: ['supplier', 'production'],
    queryFn: getSupplierProductionBooking,
    retry: false,
  });

  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [busyShot, setBusyShot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!data) return;
    setPhotos(data.photos ?? {});
    setSubmittedAt(data.submittedAt ?? null);
    setPublishedAt(data.publishedAt ?? null);
  }, [data]);

  const published = !!publishedAt;

  const submitted = !!submittedAt;
  const uploadedCount = SHOTS.filter((s) => photos[s.id]).length;
  const allDone = uploadedCount === SHOTS.length;

  const persist = async (nextPhotos: Record<string, string>, nextSubmittedAt?: string | null) => {
    await saveStageAnswers(8, {
      photos: nextPhotos,
      ...(nextSubmittedAt !== undefined ? { submittedAt: nextSubmittedAt } : submittedAt ? { submittedAt } : {}),
    });
  };

  const onPick = async (shotId: string, file: File) => {
    setError(null);
    setBusyShot(shotId);
    try {
      const { url } = await uploadListingPhoto(file);
      const next = { ...photos, [shotId]: url };
      setPhotos(next);
      await persist(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusyShot(null);
    }
  };

  const remove = async (shotId: string) => {
    const next = { ...photos };
    delete next[shotId];
    setPhotos(next);
    await persist(next);
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const at = new Date().toISOString();
      await persist(photos, at);
      setSubmittedAt(at);
      queryClient.invalidateQueries({ queryKey: ['supplier', 'stage', 8] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-card bg-white shadow-card" />
        <div className="h-64 animate-pulse rounded-card bg-white shadow-card" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {published && (
        <section className="flex items-center gap-3 rounded-card border border-success/40 bg-[#EAFAF1] p-5 shadow-card">
          <Rocket size={22} aria-hidden className="shrink-0 text-success" />
          <p className="font-sans text-sm text-charcoal">
            <strong className="text-navy">You’re live on Afrizonemart!</strong> Your product
            has been published — you’re now an activated supplier and can receive purchase orders.
          </p>
        </section>
      )}

      {/* It's Made in Africa + sample */}
      <section className="rounded-card border border-pink/30 bg-pink-light/40 p-5 shadow-card">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink to-pink-dark text-white shadow-md">
            <Clapperboard size={20} aria-hidden />
          </span>
          <div>
            <h3 className="font-raleway text-base font-bold text-navy">
              It’s Made in Africa
              {booking?.status === 'COMPLETED'
                ? ' — shoot complete'
                : booking
                  ? ' — production booked'
                  : ' — production shoot'}
            </h3>
            <p className="mt-1 max-w-lg font-sans text-sm leading-relaxed text-charcoal">
              Our crew will film your “How it’s made” story and a Meet the Producer
              interview. These assets help your product sell once it’s live.
            </p>

            {/* The heading above used to read “production booked” for everyone,
                including suppliers with no booking at all. It now follows the
                record, and the details are shown here rather than living only
                in the booking email. */}
            {booking ? (
              <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                    {booking.status === 'COMPLETED' ? 'Filmed on' : 'Date & time'}
                  </dt>
                  <dd className="font-sans text-sm font-semibold text-navy">
                    {new Date(booking.scheduledAt).toLocaleString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Africa/Lagos',
                    })}{' '}
                    WAT
                  </dd>
                </div>
                {booking.location && (
                  <div>
                    <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                      Location
                    </dt>
                    <dd className="font-sans text-sm font-semibold text-navy">
                      {booking.location}
                    </dd>
                  </div>
                )}
                {booking.contactName && (
                  <div>
                    <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                      Crew contact
                    </dt>
                    <dd className="font-sans text-sm font-semibold text-navy">
                      {booking.contactName}
                      {booking.contactPhone ? ` · ${booking.contactPhone}` : ''}
                    </dd>
                  </div>
                )}
                {booking.productList && (
                  <div>
                    <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                      Products being shot
                    </dt>
                    <dd className="font-sans text-sm font-semibold text-navy">
                      {booking.productList}
                    </dd>
                  </div>
                )}
                {booking.notes && (
                  <div className="sm:col-span-2">
                    <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                      Notes from the crew
                    </dt>
                    <dd className="font-sans text-sm text-charcoal">{booking.notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-3 font-sans text-sm text-muted">
                No shoot is booked yet — our production team will be in touch to
                agree a date, and it will appear here once it’s set.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
            Watch a sample — what your “How it’s made” story can look like
          </p>
          <div className="relative aspect-video overflow-hidden rounded-card border border-border bg-black">
            <iframe
              src="https://www.youtube.com/embed/blOLOfuhS90"
              title="Sample — It’s Made in Africa"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </section>

      {/* Listing photos */}
      <section className="rounded-card border border-border bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
              <Camera size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-raleway text-lg font-bold text-navy">Listing photos</h2>
              <p className="mt-1 max-w-md font-sans text-sm leading-relaxed text-muted">
                Re-upload your product images to our spec so the listing looks its best.
              </p>
              <p className="mt-1.5 font-sans text-xs text-muted">{SPEC}</p>
            </div>
          </div>
          <span className="font-raleway text-xs font-bold text-navy">{uploadedCount}/{SHOTS.length} added</span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SHOTS.map((s) => {
            const url = photos[s.id];
            const busy = busyShot === s.id;
            return (
              <div
                key={s.id}
                className={`relative flex items-center gap-3 rounded-card border p-4 ${
                  url ? 'border-success/40 bg-[#EAFAF1]' : 'border-dashed border-border bg-white'
                }`}
              >
                {url ? (
                  <img src={url} alt={s.label} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-page text-muted">
                    {busy ? <Loader2 size={18} aria-hidden className="animate-spin" /> : <ImagePlus size={18} aria-hidden />}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-raleway text-sm font-bold text-navy">{s.label}</p>
                  <p className="truncate font-sans text-xs text-muted">{url ? 'Image added' : busy ? 'Uploading…' : s.hint}</p>
                </div>
                {!submitted && (
                  url ? (
                    <button type="button" onClick={() => remove(s.id)} aria-label="Remove" className="rounded-md p-1 text-muted hover:bg-white hover:text-danger">
                      <X size={16} aria-hidden />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => fileInputs.current[s.id]?.click()}
                      className="rounded-btn border border-navy px-3 py-1.5 font-raleway text-xs font-bold tracking-btn text-navy hover:bg-navy-light disabled:opacity-50"
                    >
                      Upload
                    </button>
                  )
                )}
                <input
                  ref={(el) => { fileInputs.current[s.id] = el; }}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPick(s.id, f);
                    e.target.value = '';
                  }}
                />
              </div>
            );
          })}
        </div>

        {error && <p className="mt-3 font-sans text-sm text-danger">{error}</p>}

        {submitted ? (
          <div className="mt-5 flex items-center gap-3 rounded-card border border-success/40 bg-[#EAFAF1] p-4">
            <Rocket size={20} aria-hidden className="shrink-0 text-success" />
            <p className="font-sans text-sm text-charcoal">
              <strong className="text-navy">Sent for listing.</strong> Our Product Upload
              team will publish your product and notify you when it’s live.
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={!allDone || submitting}
            onClick={submit}
            className="mt-5 inline-flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {submitting ? <Loader2 size={16} aria-hidden className="animate-spin" /> : <Upload size={16} aria-hidden />}
            Submit for listing
          </button>
        )}
      </section>
    </div>
  );
}
