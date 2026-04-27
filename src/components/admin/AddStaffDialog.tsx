'use client';

import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { adminCreateStaff, type StaffCreatableRole, type StaffMember } from '@/lib/api/admin';
import { HttpApiError } from '@/lib/api/client';
import { toast } from '@/components/admin/Toast';
import { ROLE_DESCRIPTIONS } from '@/lib/permissions';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (staff: StaffMember) => void;
}

export function AddStaffDialog({ open, onClose, onCreated }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffCreatableRole>('SELLER');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setName('');
    setRole('SELLER');
    setPassword('');
    setShowPwd(false);
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await adminCreateStaff({
        email: email.trim(),
        name: name.trim() || undefined,
        role,
        password,
      });
      toast(`Added ${created.email} as ${created.role}`);
      onCreated(created);
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof HttpApiError ? err.message : err instanceof Error ? err.message : 'Failed to add staff');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
      onClick={close}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col rounded-card bg-white shadow-card-hover"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">Add staff member</h2>
            <p className="mt-1 font-sans text-xs text-muted">
              Creates a user with elevated role + an initial password. Share the
              credentials securely; the user can change their own password later.
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

        <div className="flex flex-col gap-4 px-6 py-5">
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
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <option value="SELLER">Seller</option>
              <option value="ADMIN">Admin</option>
            </select>
            <p className="mt-1 font-sans text-[11px] leading-snug text-muted">
              {ROLE_DESCRIPTIONS[role]}
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
