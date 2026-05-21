'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import {
  adminCreateStaff,
  type PermissionsMatrix,
  type StaffCreatableRole,
  type StaffMember,
} from '@/lib/api/admin';
import { HttpApiError } from '@/lib/api/client';
import { toast } from '@/components/admin/Toast';
import { ROLE_DESCRIPTIONS, type Capability } from '@/lib/permissions';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (staff: StaffMember) => void;
  /// Capability matrix from the API. Parent (/admin/staff page)
  /// already fetches it via `adminGetPermissions()` to feed the
  /// edit-existing-staff matrix; we re-use that fetch instead of
  /// hitting the endpoint twice. While null, the permissions section
  /// shows a spinner — the Save button stays disabled in that state
  /// because we can't validate "at least one permission ticked".
  ///
  /// Single source of truth: this comes from the API's
  /// `CAPABILITY_LABELS` in afrizonemart-api/src/lib/permissions.ts.
  /// Adding a new capability there immediately makes it tickable in
  /// this dialog with no storefront change. That was the whole point
  /// of dropping the duplicate label dictionary from this repo.
  matrix: PermissionsMatrix | null;
}

export function AddStaffDialog({ open, onClose, onCreated, matrix }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<StaffCreatableRole>('STAFF');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [permissions, setPermissions] = useState<Set<Capability>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /// Group the API-provided capabilities by their `domain` for the
  /// checkbox UI. When matrix is null this is an empty object — the
  /// permissions section renders a spinner instead of the groups.
  const capsByDomain = useMemo(() => {
    if (!matrix) return {} as Record<string, { key: Capability; label: string }[]>;
    const groups: Record<string, { key: Capability; label: string }[]> = {};
    for (const cap of matrix.capabilities) {
      (groups[cap.domain] ??= []).push({ key: cap.key, label: cap.label });
    }
    return groups;
  }, [matrix]);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setName('');
    setJobTitle('');
    setRole('STAFF');
    setPassword('');
    setShowPwd(false);
    setPermissions(new Set());
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
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
    if (!caps) return;
    setPermissions((prev) => {
      const allOn = caps.every((c) => prev.has(c.key));
      const next = new Set(prev);
      if (allOn) {
        for (const c of caps) next.delete(c.key);
      } else {
        for (const c of caps) next.add(c.key);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role === 'STAFF' && permissions.size === 0) {
      setError('Pick at least one section this staff member can access.');
      return;
    }
    setBusy(true);
    try {
      const created = await adminCreateStaff({
        email: email.trim(),
        name: name.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        role,
        password,
        permissions: role === 'STAFF' ? Array.from(permissions) : undefined,
      });
      toast(`Added ${created.email} as ${created.role}`);
      onCreated(created);
      reset();
      onClose();
    } catch (err) {
      setError(
        err instanceof HttpApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add staff',
      );
    } finally {
      setBusy(false);
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
        onSubmit={handleSubmit}
        className="flex max-h-full w-full max-w-2xl flex-col rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">Add staff member</h2>
            <p className="mt-1 font-sans text-xs text-muted">
              Creates a user account with the role you pick + the initial password
              you set. Share the credentials securely — they can change the password
              after first sign-in.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            aria-label="Close"
            className="rounded p-1 text-muted hover:bg-page hover:text-charcoal disabled:opacity-50"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" required>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                placeholder="e.g. Aisha Bello"
                className={inputClass}
              />
            </Field>
            <Field label="Email" required>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
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
              <p className="mt-1 font-sans text-[11px] leading-snug text-muted">
                Cosmetic. Shown in the staff list and on their dashboard. Doesn&apos;t change permissions.
              </p>
            </Field>
            <Field label="Initial password" required>
              <div className="relative">
                <input
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  autoComplete="new-password"
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
              <p className="mb-4 font-sans text-[11px] text-muted">
                Tick which admin sections they should see. They&apos;ll only see those
                in their sidebar after signing in. Click a domain heading to toggle
                its whole group.
              </p>

              {matrix === null ? (
                <div className="flex items-center gap-2 rounded-card border border-border bg-white px-4 py-6 font-sans text-sm text-muted">
                  <Loader2 size={16} className="animate-spin text-navy" aria-hidden />
                  Loading permissions…
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(capsByDomain).map(([domain, caps]) => {
                    const allOn = caps.every((c) => permissions.has(c.key));
                    const someOn = !allOn && caps.some((c) => permissions.has(c.key));
                    return (
                      <fieldset key={domain} className="rounded-card border border-border bg-white p-3">
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
                              key={cap.key}
                              className="flex cursor-pointer items-start gap-2 rounded p-1 hover:bg-page"
                            >
                              <input
                                type="checkbox"
                                checked={permissions.has(cap.key)}
                                onChange={() => togglePermission(cap.key)}
                                className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-navy"
                              />
                              <span className="font-sans text-xs text-charcoal">
                                {cap.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
            disabled={busy}
            className="rounded-btn border border-border bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-charcoal hover:bg-page disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add staff'}
          </button>
        </footer>
      </form>
    </div>
  );
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
