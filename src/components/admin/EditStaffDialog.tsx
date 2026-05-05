'use client';

import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Mail, Trash2, X } from 'lucide-react';
import {
  adminDeleteStaff,
  adminResendStaffInvite,
  adminUpdateStaff,
  type StaffCreatableRole,
  type StaffMember,
} from '@/lib/api/admin';
import { HttpApiError } from '@/lib/api/client';
import { toast } from '@/components/admin/Toast';
import {
  ALL_CAPABILITIES,
  CAPABILITY_LABELS,
  ROLE_DESCRIPTIONS,
  type Capability,
} from '@/lib/permissions';

interface Props {
  open: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onChanged: (member: StaffMember | null) => void;
}

export function EditStaffDialog({ open, member, onClose, onChanged }: Props) {
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<StaffCreatableRole>('STAFF');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [permissions, setPermissions] = useState<Set<Capability>>(new Set());
  const [busy, setBusy] = useState<null | 'save' | 'resend' | 'delete'>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmResend, setConfirmResend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Hydrate the form whenever a different member is selected. The
  // dialog is reused across rows so we have to react to the prop.
  useEffect(() => {
    if (!member) return;
    setName(member.name ?? '');
    setJobTitle(member.jobTitle ?? '');
    setRole(member.role as StaffCreatableRole);
    setPassword('');
    setShowPwd(false);
    setPermissions(new Set(member.permissions as Capability[]));
    setError(null);
    setConfirmResend(false);
    setConfirmDelete(false);
  }, [member]);

  const capsByDomain = useMemo(() => {
    const groups: Record<string, Capability[]> = {};
    for (const cap of ALL_CAPABILITIES) {
      const domain = CAPABILITY_LABELS[cap].domain;
      (groups[domain] ??= []).push(cap);
    }
    return groups;
  }, []);

  if (!open || !member) return null;

  const close = () => {
    if (busy) return;
    onClose();
  };

  const togglePermission = (cap: Capability) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return next;
    });
  };

  const toggleDomain = (domain: string) => {
    const caps = capsByDomain[domain];
    setPermissions((prev) => {
      const allOn = caps.every((c) => prev.has(c));
      const next = new Set(prev);
      if (allOn) for (const c of caps) next.delete(c);
      else for (const c of caps) next.add(c);
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role === 'STAFF' && permissions.size === 0) {
      setError('Pick at least one section this staff member can access.');
      return;
    }
    setBusy('save');
    try {
      const updated = await adminUpdateStaff(member.id, {
        name: name.trim() || undefined,
        jobTitle: jobTitle.trim() ? jobTitle.trim() : null,
        role,
        password: password ? password : undefined,
        permissions: role === 'STAFF' ? Array.from(permissions) : undefined,
      });
      toast(`Saved ${updated.email}`);
      onChanged(updated);
      onClose();
    } catch (err) {
      setError(asMessage(err, 'Failed to save staff'));
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    setError(null);
    setBusy('resend');
    try {
      await adminResendStaffInvite(member.id);
      toast(`Invite re-sent to ${member.email}`);
      setConfirmResend(false);
    } catch (err) {
      setError(asMessage(err, 'Failed to resend invite'));
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setBusy('delete');
    try {
      await adminDeleteStaff(member.id);
      toast(`Removed ${member.email} from staff`);
      onChanged(null);
      onClose();
    } catch (err) {
      setError(asMessage(err, 'Failed to remove staff'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4 py-6"
      onClick={close}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        className="flex max-h-full w-full max-w-2xl flex-col rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">
              Edit staff member
            </h2>
            <p className="mt-1 font-sans text-xs text-muted">
              {member.email}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy !== null}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                placeholder="e.g. Aisha Bello"
                className={inputClass}
              />
            </Field>
            <Field label="Role" required>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value as StaffCreatableRole)}
                className={inputClass}
              >
                <option value="STAFF">Staff (custom permissions)</option>
                <option value="ADMIN">Admin (full access)</option>
                <option value="SELLER">Seller (marketplace vendor)</option>
              </select>
              <p className="mt-1 font-sans text-[11px] leading-snug text-muted">
                {ROLE_DESCRIPTIONS[role]}
              </p>
            </Field>
            <Field label="Job title">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                autoComplete="off"
                placeholder="e.g. Intern, Customer Support Lead"
                maxLength={80}
                className={inputClass}
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {JOB_TITLE_SUGGESTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setJobTitle(t)}
                    className={`rounded-full border px-2 py-0.5 font-sans text-[10px] transition ${
                      jobTitle === t
                        ? 'border-navy bg-navy text-white'
                        : 'border-border bg-white text-charcoal hover:border-navy hover:text-navy'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="New password (optional)">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={password ? 8 : undefined}
                  autoComplete="new-password"
                  placeholder="Leave blank to keep existing"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
                >
                  {showPwd ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                </button>
              </div>
              <p className="mt-1 font-sans text-[11px] leading-snug text-muted">
                Setting a password here doesn&apos;t notify them. Use{' '}
                <strong>Reset &amp; resend invite</strong> below if you also
                want them to receive an email.
              </p>
            </Field>
          </div>

          {role === 'STAFF' && (
            <div className="rounded-card border border-amber/40 bg-amber/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
                  Sections this person can access
                </p>
                <span className="font-sans text-[11px] text-muted">
                  {permissions.size} selected
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {Object.entries(capsByDomain).map(([domain, caps]) => {
                  const allOn = caps.every((c) => permissions.has(c));
                  const someOn = !allOn && caps.some((c) => permissions.has(c));
                  return (
                    <fieldset
                      key={domain}
                      className="rounded-card border border-border bg-white p-3"
                    >
                      <legend className="px-1">
                        <button
                          type="button"
                          onClick={() => toggleDomain(domain)}
                          className="flex items-center gap-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:text-amber"
                        >
                          <input
                            type="checkbox"
                            checked={allOn}
                            ref={(el) => {
                              if (el) el.indeterminate = someOn;
                            }}
                            readOnly
                            className="h-3.5 w-3.5 cursor-pointer accent-navy"
                          />
                          {domain}
                        </button>
                      </legend>
                      <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {caps.map((cap) => (
                          <label
                            key={cap}
                            className="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-page"
                          >
                            <input
                              type="checkbox"
                              checked={permissions.has(cap)}
                              onChange={() => togglePermission(cap)}
                              className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-navy"
                            />
                            <span className="font-sans text-xs text-charcoal">
                              {CAPABILITY_LABELS[cap].label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            </div>
          )}

          {/* Danger / re-invite zone */}
          <div className="rounded-card border border-border bg-page p-4">
            <p className="mb-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
              Account actions
            </p>

            {!confirmResend && !confirmDelete && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResend(true)}
                  disabled={busy !== null}
                  className="flex items-center gap-2 rounded-btn border border-amber bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:bg-amber hover:text-navy disabled:opacity-50"
                >
                  <Mail size={12} aria-hidden /> Reset &amp; resend invite
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy !== null}
                  className="flex items-center gap-2 rounded-btn border border-danger bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-danger hover:bg-danger hover:text-white disabled:opacity-50"
                >
                  <Trash2 size={12} aria-hidden /> Remove from staff
                </button>
              </div>
            )}

            {confirmResend && (
              <div className="rounded-input border border-amber bg-amber/10 p-3">
                <p className="font-sans text-xs text-charcoal">
                  This will <strong>reset their password</strong> to a fresh
                  random value and email it to{' '}
                  <code className="rounded bg-white px-1">{member.email}</code>.
                  Their old password stops working immediately.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={busy !== null}
                    className="rounded-btn bg-navy px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
                  >
                    {busy === 'resend' ? 'Sending…' : 'Yes, reset & resend'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResend(false)}
                    disabled={busy !== null}
                    className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {confirmDelete && (
              <div className="rounded-input border border-danger bg-danger/10 p-3">
                <p className="font-sans text-xs text-charcoal">
                  This will <strong>remove staff access</strong> for{' '}
                  <code className="rounded bg-white px-1">{member.email}</code>.
                  Their account stays (so order history remains) but they
                  become a regular customer with no admin access.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy !== null}
                    className="rounded-btn bg-danger px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === 'delete' ? 'Removing…' : 'Yes, remove'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy !== null}
                    className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-input border border-danger/30 bg-danger/5 px-3 py-2 font-sans text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-page px-6 py-3">
          <button
            type="button"
            onClick={close}
            disabled={busy !== null}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy !== null}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            {busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function asMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

const JOB_TITLE_SUGGESTIONS = [
  'Intern',
  'Catalog Operations',
  'Customer Support',
  'Content Editor',
  'Operations Manager',
  'Marketing',
];

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
