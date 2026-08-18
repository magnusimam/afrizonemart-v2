'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, HelpCircle, X } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  getOrientationComments,
  getReviewCallsAdmin,
  scheduleReviewCallAdmin,
  updateOrientationComment,
  type AdminOrientationComment,
  type AdminReviewCallRow,
} from '@/lib/api/admin-suppliers';

type Tab = 'calls' | 'comments';

const CALL_TONE: Record<string, string> = {
  PENDING: 'bg-amber-light text-amber-dark',
  SCHEDULED: 'bg-success/10 text-success',
  RESCHEDULE_REQUESTED: 'bg-amber-light text-amber-dark',
  COMPLETED: 'bg-navy-light text-navy',
  CANCELLED: 'bg-page text-muted',
};

export default function AdminOrientationPage() {
  const [tab, setTab] = useState<Tab>('calls');

  return (
    <div className="px-4 py-6 md:px-8 md:py-10">
      <AdminPageHeader
        title="Orientation & calls"
        subtitle="Schedule PIQ review calls and follow up on questions from the live orientation."
      />
      <div className="mb-5 flex gap-2">
        <TabBtn active={tab === 'calls'} onClick={() => setTab('calls')}>Review calls</TabBtn>
        <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')}>Live comments</TabBtn>
      </div>
      {tab === 'calls' ? <ReviewCallsTab /> : <CommentsTab />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-btn px-4 py-2 font-raleway text-sm font-bold tracking-btn transition-colors ${
        active ? 'bg-navy text-white' : 'border border-border text-muted hover:border-navy hover:text-navy'
      }`}
    >
      {children}
    </button>
  );
}

// ── Review calls ─────────────────────────────────────────────────────
function ReviewCallsTab() {
  const [rows, setRows] = useState<AdminReviewCallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [scheduling, setScheduling] = useState<AdminReviewCallRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getReviewCallsAdmin()
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (loading) return <p className="font-sans text-sm text-muted">Loading…</p>;
  if (rows.length === 0) return <p className="font-sans text-sm text-muted">No suppliers have reached this stage yet.</p>;

  return (
    <>
      <div className="overflow-x-auto rounded-card border border-border bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border bg-page">
            <tr className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Call</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const status = r.call?.status ?? 'PENDING';
              const when = r.call?.scheduledAt
                ? new Date(r.call.scheduledAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) + ' WAT'
                : '—';
              return (
                <tr key={r.supplierId} className="align-top font-sans text-sm hover:bg-page">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{r.company}</div>
                    <div className="text-xs text-muted">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-charcoal">{r.currentStage}/10</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 font-raleway text-xs font-bold ${CALL_TONE[status]}`}>{status}</span>
                    {r.call?.status === 'RESCHEDULE_REQUESTED' && r.call.proposedAt && (
                      <div className="mt-1 text-xs text-amber-dark">
                        wants {new Date(r.call.proposedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-charcoal">{when}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setScheduling(r)}
                      className="rounded-btn bg-navy px-4 py-1.5 font-raleway text-xs font-bold tracking-btn text-white hover:bg-navy-dark"
                    >
                      {status === 'PENDING' ? 'Schedule' : 'Reschedule'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {scheduling && (
        <ScheduleModal
          row={scheduling}
          onClose={() => setScheduling(null)}
          onDone={() => {
            setScheduling(null);
            setReload((n) => n + 1);
          }}
        />
      )}
    </>
  );
}

function ScheduleModal({ row, onClose, onDone }: { row: AdminReviewCallRow; onClose: () => void; onDone: () => void }) {
  const [when, setWhen] = useState('');
  const [mode, setMode] = useState('Google Meet');
  const [link, setLink] = useState(row.call?.meetingLink ?? '');
  const [notes, setNotes] = useState(row.call?.notes ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!when) return toast('Pick a date & time.', 'error');
    setBusy(true);
    try {
      await scheduleReviewCallAdmin(row.supplierId, {
        scheduledAt: new Date(when).toISOString(),
        meetingMode: mode || undefined,
        meetingLink: link || undefined,
        notes: notes || undefined,
      });
      toast(`Review call scheduled — ${row.company} notified`);
      onDone();
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 py-10">
      <div className="w-full max-w-lg rounded-card bg-white shadow-card-hover">
        <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">Schedule review call</h2>
            <p className="font-sans text-sm text-muted">{row.company}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-muted hover:bg-page">
            <X size={18} aria-hidden />
          </button>
        </header>
        {row.call?.status === 'RESCHEDULE_REQUESTED' && row.call.proposedAt && (
          <p className="mx-6 mt-4 rounded-input bg-amber-light px-3 py-2 font-sans text-sm text-amber-dark">
            Supplier proposed {new Date(row.call.proposedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} WAT.
          </p>
        )}
        <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2">
          <Field label="Date & time (your local) *"><input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputCls} /></Field>
          <Field label="Mode"><input type="text" value={mode} onChange={(e) => setMode(e.target.value)} placeholder="Google Meet / Phone" className={inputCls} /></Field>
          <div className="sm:col-span-2"><Field label="Meeting link"><input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.google.com/…" className={inputCls} /></Field></div>
          <div className="sm:col-span-2"><Field label="Notes (sent to supplier)"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} /></Field></div>
        </div>
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-btn border border-border px-4 py-2 font-raleway text-sm font-bold text-muted hover:border-navy hover:text-navy">Cancel</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2 font-raleway text-sm font-bold tracking-btn text-white hover:bg-navy-dark disabled:opacity-60">
            <CalendarClock size={15} aria-hidden /> {busy ? 'Saving…' : 'Schedule & notify'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live comments ────────────────────────────────────────────────────
function CommentsTab() {
  const [rows, setRows] = useState<AdminOrientationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyQ, setOnlyQ] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOrientationComments(onlyQ)
      .then((r) => !cancelled && setRows(r))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [onlyQ, reload]);

  const mark = async (c: AdminOrientationComment, patch: { answered?: boolean; isQuestion?: boolean }) => {
    try {
      await updateOrientationComment(c.id, patch);
      setReload((n) => n + 1);
    } catch (e) {
      toast(e instanceof HttpApiError ? e.message : 'Failed', 'error');
    }
  };

  return (
    <>
      <label className="mb-4 flex w-fit cursor-pointer items-center gap-2 font-sans text-sm text-charcoal">
        <input type="checkbox" checked={onlyQ} onChange={(e) => setOnlyQ(e.target.checked)} className="h-4 w-4 accent-navy" />
        Questions only
      </label>
      {loading ? (
        <p className="font-sans text-sm text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="font-sans text-sm text-muted">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c.id} className="rounded-card border border-border bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-raleway text-sm font-bold text-navy">{c.company}</span>
                    {c.isQuestion && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-light px-2 py-0.5 font-raleway text-[10px] font-bold text-amber-dark">
                        <HelpCircle size={11} aria-hidden /> Question
                      </span>
                    )}
                    {c.answeredAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold text-success">
                        <CheckCircle2 size={11} aria-hidden /> Answered
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-sans text-sm text-charcoal">{c.body}</p>
                  <p className="mt-1 font-sans text-xs text-muted">
                    {c.email} · {new Date(c.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => mark(c, { isQuestion: !c.isQuestion })}
                    className="rounded-btn border border-border px-3 py-1.5 font-raleway text-xs font-bold text-muted hover:border-navy hover:text-navy"
                  >
                    {c.isQuestion ? 'Not a question' : 'Mark question'}
                  </button>
                  <button
                    type="button"
                    onClick={() => mark(c, { answered: !c.answeredAt })}
                    className="rounded-btn bg-navy px-3 py-1.5 font-raleway text-xs font-bold tracking-btn text-white hover:bg-navy-dark"
                  >
                    {c.answeredAt ? 'Reopen' : 'Mark answered'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls = 'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-amber focus:outline-none';
