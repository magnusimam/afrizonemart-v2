'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  Phone,
  Radio,
  Send,
} from 'lucide-react';
import {
  completeStage,
  getOrientation,
  getReviewCall,
  getStageAnswers,
  postOrientationComment,
  rescheduleReviewCall,
  type OrientationOwnComment,
  type ReviewCall,
} from '@/lib/api/supplier';
import { supplierKeys } from '@/lib/api/supplier-hooks';
import { ORIENTATION_CHAT } from '@/lib/supplier/orientation-chat';

/**
 * Stage 5 — Review call → Orientation.
 *  Step 1: PIQ review call (AZM schedules; supplier can reschedule ≥24h out).
 *  Step 2: Orientation as an evergreen "live" webinar — goes live daily at a
 *          fixed time (9pm WAT), with a real countdown, a time-synced recording,
 *          and the real chat transcript replayed on the session timeline. The
 *          supplier's own comments are saved for the Supplier Relations Desk.
 *  Step 3: Mark complete → advance to Stage 6.
 *
 * Orientation is a one-time live, not a library: once a supplier marks it
 * complete the room closes for good (`useStage5Complete`), so nobody
 * re-enters a session they've already attended.
 */

/** Stage-5 completion flag. Shared query key → one fetch for both steps. */
function useStage5Complete() {
  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'stage', 5],
    queryFn: () => getStageAnswers(5) as Promise<{ completedAt?: string }>,
    retry: false,
  });
  return { done: !!data?.completedAt, completedAt: data?.completedAt, isLoading };
}

export function Stage5Orientation() {
  return (
    <div className="flex flex-col gap-6">
      <ReviewCallCard />
      <OrientationWebinar />
      <OrientationComplete />
    </div>
  );
}

// ── Step 1 — PIQ review call ─────────────────────────────────────────
function ReviewCallCard() {
  const queryClient = useQueryClient();
  const { data: call, isLoading } = useQuery({
    queryKey: ['supplier', 'review-call'],
    queryFn: getReviewCall,
    retry: false,
  });
  const [proposed, setProposed] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);

  const reschedule = useMutation({
    mutationFn: () => rescheduleReviewCall({ proposedAt: new Date(proposed).toISOString() }),
    onSuccess: () => {
      setShowReschedule(false);
      setProposed('');
      queryClient.invalidateQueries({ queryKey: ['supplier', 'review-call'] });
    },
  });

  if (isLoading) return <div className="h-28 animate-pulse rounded-card bg-white shadow-card" />;

  const scheduled = call?.status === 'SCHEDULED' || call?.status === 'RESCHEDULE_REQUESTED';
  const when = call?.scheduledAt ? new Date(call.scheduledAt) : null;
  const whenLabel = when
    ? when.toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
      }) + ' WAT'
    : null;

  return (
    <section className="rounded-card border border-border bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
            <Phone size={20} aria-hidden />
          </span>
          <div>
            <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber-dark">Step 1</p>
            <h2 className="font-raleway text-lg font-bold text-navy">PIQ review call</h2>
            <p className="mt-1 max-w-md font-sans text-sm leading-relaxed text-muted">
              A quick call to go through your product questionnaire and answer any
              questions before orientation.
            </p>
          </div>
        </div>
        <StatusPill call={call ?? null} />
      </div>

      {scheduled && when ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-input bg-page px-4 py-3">
            <span className="font-raleway text-sm font-bold text-navy">{whenLabel}</span>
            {call?.meetingMode && <span className="font-sans text-sm text-muted">{call.meetingMode}</span>}
            {call?.meetingLink && (
              <a href={call.meetingLink} target="_blank" rel="noopener noreferrer" className="font-raleway text-sm font-semibold text-navy underline hover:text-amber-dark">
                Join link
              </a>
            )}
          </div>
          {call?.notes && <p className="mt-2 font-sans text-sm text-charcoal">{call.notes}</p>}
          {call?.status === 'RESCHEDULE_REQUESTED' && call.proposedAt && (
            <p className="mt-2 font-sans text-xs text-amber-dark">
              Reschedule requested for {new Date(call.proposedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} WAT — awaiting AZM confirmation.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {call?.calendar && (
              <>
                <a
                  href={call.calendar.googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-btn border border-navy px-4 py-2 font-raleway text-xs font-bold tracking-btn text-navy hover:bg-navy-light"
                >
                  <CalendarPlus size={14} aria-hidden /> Add to Google Calendar
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcs(call!.calendar!.ics)}
                  className="inline-flex items-center gap-2 rounded-btn border border-border px-4 py-2 font-raleway text-xs font-bold tracking-btn text-muted hover:border-navy hover:text-navy"
                >
                  <CalendarPlus size={14} aria-hidden /> Download .ics
                </button>
              </>
            )}
            {call?.canReschedule && !showReschedule && (
              <button
                type="button"
                onClick={() => setShowReschedule(true)}
                className="font-raleway text-xs font-semibold text-muted underline hover:text-navy"
              >
                Need a different time?
              </button>
            )}
            {!call?.canReschedule && call?.status === 'SCHEDULED' && (
              <span className="inline-flex items-center gap-1 font-sans text-xs text-muted">
                <Clock size={12} aria-hidden /> Reschedules close {call.rescheduleCutoffHours}h before the call
              </span>
            )}
          </div>

          {showReschedule && (
            <div className="mt-4 rounded-input border border-border bg-page p-4">
              <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">Propose a new time</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="datetime-local"
                  value={proposed}
                  onChange={(e) => setProposed(e.target.value)}
                  className="rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-amber focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!proposed || reschedule.isPending}
                  onClick={() => reschedule.mutate()}
                  className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-50"
                >
                  {reschedule.isPending ? 'Sending…' : 'Request reschedule'}
                </button>
                <button type="button" onClick={() => setShowReschedule(false)} className="font-raleway text-xs font-semibold text-muted hover:text-navy">
                  Cancel
                </button>
              </div>
              {reschedule.isError && <p className="mt-2 font-sans text-xs text-danger">Couldn’t request a reschedule. The cutoff may have passed.</p>}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-input bg-page px-4 py-3 font-sans text-sm text-muted">
          <CalendarClock size={15} aria-hidden className="text-amber-dark" />
          Our Merchandise Sourcing team will schedule your review call shortly — you’ll get an email with the details.
        </div>
      )}
    </section>
  );
}

function StatusPill({ call }: { call: ReviewCall | null }) {
  const status = call?.status ?? 'PENDING';
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Awaiting schedule', cls: 'bg-amber-light text-amber-dark' },
    SCHEDULED: { label: 'Scheduled', cls: 'bg-success/10 text-success' },
    RESCHEDULE_REQUESTED: { label: 'Reschedule requested', cls: 'bg-amber-light text-amber-dark' },
    COMPLETED: { label: 'Completed', cls: 'bg-navy-light text-navy' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-page text-muted' },
  };
  const s = map[status] ?? map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-raleway text-xs font-bold ${s.cls}`}>
      <CalendarClock size={14} aria-hidden /> {s.label}
    </span>
  );
}

function downloadIcs(ics: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'afrizonemart-review-call.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Step 2 — evergreen "live" orientation webinar ────────────────────
function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

interface LiveInfo {
  state: 'before' | 'open' | 'after';
  target: number;
  elapsedSec: number;
}

function computeLive(now: number, liveHourUtc: number, windowMins: number): LiveInfo {
  const d = new Date(now);
  const todayLive = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), liveHourUtc, 0, 0);
  const windowEnd = todayLive + windowMins * 60_000;
  if (now < todayLive) return { state: 'before', target: todayLive, elapsedSec: 0 };
  if (now <= windowEnd) return { state: 'open', target: todayLive, elapsedSec: Math.floor((now - todayLive) / 1000) };
  return { state: 'after', target: todayLive + 86_400_000, elapsedSec: Math.floor((now - todayLive) / 1000) };
}

function OrientationWebinar() {
  const { data: config, isLoading } = useQuery({
    queryKey: ['supplier', 'orientation'],
    queryFn: getOrientation,
    retry: false,
  });
  const { done: attended, completedAt, isLoading: loadingDone } = useStage5Complete();

  const [now, setNow] = useState(() => Date.now());
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (isLoading || loadingDone || !config) {
    return <div className="h-72 animate-pulse rounded-card bg-white shadow-card" />;
  }

  // Attended already — the live is over for this supplier, permanently.
  if (attended) {
    return (
      <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
        <header className="flex items-start gap-3 border-b border-border p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 size={20} aria-hidden />
          </span>
          <div>
            <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-success">Step 2 · Attended</p>
            <h2 className="font-raleway text-lg font-bold text-navy">Afrizonemart Supplier Orientation</h2>
            <p className="mt-1 font-sans text-sm text-muted">Hosted by AZM Supplier Success</p>
          </div>
        </header>
        <div className="p-8 text-center">
          <p className="mx-auto max-w-md font-sans text-sm leading-relaxed text-charcoal">
            You’ve completed your orientation session
            {completedAt
              ? ` on ${new Date(completedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}`
              : ''}
            . This was a one-time live session, so the room is now closed.
          </p>
          <p className="mt-2 font-sans text-sm text-muted">
            Questions since then? Your Supplier Relations Desk is on the support page.
          </p>
        </div>
      </section>
    );
  }

  const live = computeLive(now, config.liveHourUtc, config.joinWindowMins);
  const liveLabel = new Date(live.target).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos',
  }) + ' WAT';
  // Joining requires a click (satisfies the 30-min join window AND counts as the
  // user gesture browsers need to autoplay with sound). Once in, they stay in.
  const canJoin = live.state === 'open';

  return (
    <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
      <header className="flex items-start gap-3 border-b border-border p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-light text-amber-dark">
          <Radio size={20} aria-hidden />
        </span>
        <div>
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber-dark">Step 2</p>
          <h2 className="font-raleway text-lg font-bold text-navy">Afrizonemart Supplier Orientation</h2>
          <p className="mt-1 font-sans text-sm text-muted">Hosted by AZM Supplier Success</p>
        </div>
      </header>

      {joined ? (
        <WebinarLive videoUrl={config.videoUrl} elapsedSec={live.elapsedSec} />
      ) : canJoin ? (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" /> Live now
          </span>
          <p className="max-w-sm font-sans text-sm text-muted">
            The orientation is live right now. Join to take part.
          </p>
          <button
            type="button"
            onClick={() => setJoined(true)}
            className="inline-flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark"
          >
            <Radio size={16} aria-hidden /> Join the live session
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
            {live.state === 'after' ? 'Today’s session has ended · next one in' : 'Goes live in'}
          </p>
          <p className="font-raleway text-4xl font-extrabold tabular-nums text-navy md:text-5xl">
            {fmtCountdown(live.target - now)}
          </p>
          <p className="max-w-sm font-sans text-sm text-muted">
            The next live orientation begins at {liveLabel}. Come back then to join.
          </p>
        </div>
      )}
    </section>
  );
}

/** Smooth, "live"-feeling viewer count in the 180–250 band that drifts over
 *  the session (deterministic from elapsed so it doesn't jump on re-render). */
function viewerCount(elapsedSec: number): number {
  const base = 215;
  const slow = Math.sin(elapsedSec / 240) * 28; // gentle multi-minute swell
  const fast = Math.sin(elapsedSec / 17) * 6; // small churn
  return Math.max(180, Math.min(250, Math.round(base + slow + fast)));
}

function WebinarLive({
  videoUrl,
  elapsedSec,
}: {
  videoUrl: string;
  elapsedSec: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState('');
  const [posted, setPosted] = useState<OrientationOwnComment[]>([]);
  // How many transcript messages have been revealed so far. Drips one at a time
  // so the chat reads like it's happening live, never dumping the backlog.
  const [shown, setShown] = useState(0);
  const elapsedRef = useRef(elapsedSec);
  elapsedRef.current = elapsedSec;

  // Treat the recording as an actual live stream: keep it pinned to the live
  // position, and never let the viewer pause or seek.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const pin = () => {
      if (Math.abs(v.currentTime - elapsedRef.current) > 3) v.currentTime = elapsedRef.current;
    };
    const onLoaded = () => {
      pin();
      v.play().catch(() => {});
    };
    const onPause = () => {
      // Live — can't pause. Resume immediately.
      v.play().catch(() => {});
    };
    const onSeeking = () => pin();
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeking', onSeeking);
    const id = setInterval(pin, 10_000);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeking', onSeeking);
      clearInterval(id);
    };
  }, []);

  // Reveal one queued transcript comment per tick until caught up to the live
  // position, then keep pace as the session continues.
  useEffect(() => {
    const available = ORIENTATION_CHAT.filter((m) => m.at <= elapsedSec).length;
    setShown((s) => (s < available ? s + 1 : s));
  }, [elapsedSec]);

  const post = useMutation({
    mutationFn: (body: string) => postOrientationComment({ body, atSeconds: elapsedRef.current }),
    onSuccess: (c) => {
      setPosted((p) => [...p, c]);
      setDraft('');
    },
  });

  const messages = useMemo(() => {
    const seed = ORIENTATION_CHAT.slice(0, shown).map((m, i) => ({
      key: `seed-${i}`,
      name: m.name,
      body: m.body,
      host: m.host,
      mine: false,
    }));
    const mine = posted.map((c) => ({
      key: `me-${c.id}`,
      name: 'You',
      body: c.body,
      host: false,
      mine: true,
    }));
    return [...seed, ...mine];
  }, [shown, posted]);

  // Auto-stick to the newest message (like Meet) as comments arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const watching = viewerCount(elapsedSec);

  const send = () => {
    const text = draft.trim();
    if (text) post.mutate(text);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3">
      {/* Player — fixed live stream: no controls, no seek, no pause. */}
      <div className="lg:col-span-2">
        <div className="relative aspect-video bg-black lg:aspect-auto lg:h-[480px]">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            playsInline
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            className="h-full w-full object-contain"
          />
          {/* Block clicks on the video so it can't be paused/scrubbed. */}
          <div className="absolute inset-0" aria-hidden />
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-danger px-2.5 py-1 font-raleway text-[11px] font-bold uppercase tracking-btn text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" /> Live
          </span>
          <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 font-sans text-[11px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> {watching} watching
          </span>
        </div>
      </div>

      {/* Chat — contained scroll panel beside the player, Google-Meet style. */}
      <div className="flex h-[360px] flex-col border-t border-border lg:h-[480px] lg:border-l lg:border-t-0">
        <p className="flex shrink-0 items-center gap-1.5 border-b border-border px-4 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-navy">
          <MessageCircle size={14} aria-hidden /> Live chat
        </p>
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <p className="font-sans text-xs text-muted">The conversation will pick up as the session gets going…</p>
          )}
          {messages.map((m) => (
            <div key={m.key} className="text-sm">
              <span className={`font-raleway text-xs font-bold ${m.mine ? 'text-amber-dark' : m.host ? 'text-navy' : 'text-charcoal'}`}>
                {m.name}{m.host ? ' · AZM' : ''}
              </span>
              <p className="font-sans text-sm leading-snug text-muted">{m.body}</p>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 border-t border-border p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            maxLength={1000}
            placeholder="Ask a question…"
            className="w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal focus:border-amber focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={post.isPending || !draft.trim()}
            aria-label="Send message"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-navy text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
          >
            {post.isPending ? <Loader2 size={15} aria-hidden className="animate-spin" /> : <Send size={15} aria-hidden />}
          </button>
        </div>
      </div>

      <div className="lg:col-span-3 flex items-center gap-2 border-t border-border bg-page px-4 py-3">
        <CheckCircle2 size={15} aria-hidden className="text-success" />
        <p className="font-sans text-xs text-muted">
          Your questions are sent to our Supplier Success team — we’ll follow up
          on anything we don’t cover live. After orientation you’ll move on to
          your facility visit.
        </p>
      </div>
    </div>
  );
}

// ── Step 3 — mark complete (advances to Stage 6) ─────────────────────
function OrientationComplete() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { done, isLoading } = useStage5Complete();

  const complete = useMutation({
    mutationFn: () => completeStage(5, { completedAt: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.me });
      queryClient.invalidateQueries({ queryKey: ['supplier', 'stage', 5] });
    },
  });

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-card bg-white shadow-card" />;
  }

  if (done) {
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-card border border-success/40 bg-[#EAFAF1] p-5 shadow-card">
        <CheckCircle2 size={20} aria-hidden className="shrink-0 text-success" />
        <p className="font-sans text-sm text-charcoal">
          <strong className="text-navy">Orientation complete.</strong> Next up: your facility visit.
        </p>
        <button
          type="button"
          onClick={() => router.push('/supplier/dashboard')}
          className="ml-auto font-raleway text-sm font-semibold text-navy hover:text-amber-dark"
        >
          Back to dashboard
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-white p-6 shadow-card">
      <div>
        <h2 className="font-raleway text-lg font-bold text-navy">Finished orientation?</h2>
        <p className="mt-1 max-w-md font-sans text-sm text-muted">
          Once you’ve been through the review call and orientation session, mark
          this stage complete to move on to your facility visit.
        </p>
        {complete.isError && <p className="mt-2 font-sans text-sm text-danger">Couldn’t save. Please try again.</p>}
      </div>
      <button
        type="button"
        disabled={complete.isPending}
        onClick={() => complete.mutate()}
        className="inline-flex shrink-0 items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
      >
        {complete.isPending ? <><Loader2 size={16} aria-hidden className="animate-spin" /> Saving…</> : <><CheckCircle2 size={16} aria-hidden /> Mark orientation complete</>}
      </button>
    </section>
  );
}
