'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { toast } from '@/components/admin/Toast';
import { HttpApiError } from '@/lib/api/client';
import {
  adminDeleteStaff,
  adminGetPermissions,
  adminGetStaff,
  adminUpdateStaff,
  type PermissionsMatrix,
  type StaffMember,
} from '@/lib/api/admin';
import { ROLE_DESCRIPTIONS, type Capability } from '@/lib/permissions';

/**
 * /admin/staff/[id] — edit a single staff member.
 *
 * Replaces the previous link to /admin/customers/[id], which only let
 * the admin change name + role and did NOT expose the per-staff
 * permissions matrix. This page surfaces:
 *
 *   - Identity: name, jobTitle (both editable, free-text)
 *   - Role: STAFF / ADMIN / SELLER (dropdown — flipping out of STAFF
 *     hides the permissions section because ADMIN + SELLER use role-
 *     default capabilities)
 *   - Permissions matrix: same list the "Add staff" dialog and the
 *     "Edit existing staff" table on /admin/staff use — fetched live
 *     from `GET /api/admin/staff/permissions` so newly-registered
 *     capabilities show up automatically (see
 *     project_permissions_single_source_2026_05_21).
 *   - Danger zone: remove staff (DELETE flips role back to CUSTOMER
 *     and clears the permissions array — same as
 *     `adminDeleteStaff()` semantics).
 *
 * Single Save button at the bottom commits identity + role + matrix
 * in one PATCH. Dirty tracking disables Save until something differs
 * from the loaded record — no accidental "save unchanged" toasts.
 */
export default function AdminStaffEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [matrix, setMatrix] = useState<PermissionsMatrix | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /// Local edit state. Initialised from the loaded staff record. We
  /// keep `original` alongside so the Save button can compare and
  /// the Discard action can reset cleanly.
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<'STAFF' | 'ADMIN' | 'SELLER'>('STAFF');
  const [permissions, setPermissions] = useState<Set<Capability>>(new Set());

  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        const [s, m] = await Promise.all([
          adminGetStaff(id),
          adminGetPermissions(),
        ]);
        if (cancelled) return;
        setStaff(s);
        setMatrix(m);
        setName(s.name ?? '');
        setJobTitle(s.jobTitle ?? '');
        /// API may return CUSTOMER for a user who's no longer a
        /// staff member but was once. The page edits staff, so we
        /// coerce CUSTOMER to STAFF for the dropdown (admin can
        /// then flip them up or pick Remove).
        setRole(
          s.role === 'ADMIN' || s.role === 'STAFF' || s.role === 'SELLER'
            ? s.role
            : 'STAFF',
        );
        setPermissions(new Set(s.permissions));
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof HttpApiError
            ? e.message
            : 'Could not load this staff member.',
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /// Group capabilities by domain for the checkbox UI — same shape
  /// the AddStaffDialog uses post-2026-05-21 single-source-of-truth
  /// migration.
  const capsByDomain = useMemo(() => {
    if (!matrix) return {} as Record<string, { key: Capability; label: string }[]>;
    const groups: Record<string, { key: Capability; label: string }[]> = {};
    for (const cap of matrix.capabilities) {
      (groups[cap.domain] ??= []).push({ key: cap.key, label: cap.label });
    }
    return groups;
  }, [matrix]);

  /// Has anything changed vs the loaded record? Lets the Save button
  /// disable cleanly until there's actual work to do.
  const isDirty = useMemo(() => {
    if (!staff) return false;
    if ((name.trim() || null) !== (staff.name ?? null)) return true;
    if ((jobTitle.trim() || null) !== (staff.jobTitle ?? null)) return true;
    if (role !== staff.role) return true;
    if (role === 'STAFF') {
      const orig = new Set(staff.permissions);
      if (orig.size !== permissions.size) return true;
      if (Array.from(permissions).some((p) => !orig.has(p))) return true;
    }
    return false;
  }, [staff, name, jobTitle, role, permissions]);

  const handleTogglePermission = (cap: Capability) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(cap)) next.delete(cap);
      else next.add(cap);
      return next;
    });
  };

  const handleToggleDomain = (domain: string) => {
    const caps = capsByDomain[domain];
    if (!caps) return;
    setPermissions((prev) => {
      const allOn = caps.every((c) => prev.has(c.key));
      const next = new Set(prev);
      if (allOn) for (const c of caps) next.delete(c.key);
      else for (const c of caps) next.add(c.key);
      return next;
    });
  };

  const handleSave = async () => {
    if (!staff) return;
    if (role === 'STAFF' && permissions.size === 0) {
      toast(
        'STAFF role needs at least one permission. Tick the sections this person can access, or change their role.',
        'error',
      );
      return;
    }
    setSaving(true);
    try {
      /// Only send fields that differ — keeps the audit trail clean
      /// and avoids accidentally resetting jobTitle to its current
      /// value via the API's null-allowed semantics.
      const body: Parameters<typeof adminUpdateStaff>[1] = {};
      if ((name.trim() || null) !== (staff.name ?? null)) {
        body.name = name.trim() || undefined;
      }
      if ((jobTitle.trim() || null) !== (staff.jobTitle ?? null)) {
        body.jobTitle = jobTitle.trim() || null;
      }
      if (role !== staff.role) body.role = role;
      if (role === 'STAFF') {
        const orig = new Set(staff.permissions);
        const list = Array.from(permissions);
        const permsChanged =
          orig.size !== permissions.size || list.some((p) => !orig.has(p));
        if (permsChanged) body.permissions = list;
      }
      const updated = await adminUpdateStaff(staff.id, body);
      setStaff(updated);
      setName(updated.name ?? '');
      setJobTitle(updated.jobTitle ?? '');
      setRole(
        updated.role === 'ADMIN' || updated.role === 'STAFF' || updated.role === 'SELLER'
          ? updated.role
          : 'STAFF',
      );
      setPermissions(new Set(updated.permissions));
      toast('Saved.');
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Could not save changes.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!staff) return;
    setDeleting(true);
    try {
      await adminDeleteStaff(staff.id);
      toast(`Removed ${staff.name || staff.email} from staff.`);
      router.push('/admin/staff');
    } catch (e) {
      toast(
        e instanceof HttpApiError ? e.message : 'Could not remove staff.',
        'error',
      );
      setDeleting(false);
    }
  };

  if (loadError) {
    return (
      <div className="px-8 py-10">
        <Link
          href="/admin/staff"
          className="mb-4 inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-navy"
        >
          <ArrowLeft size={14} aria-hidden /> All staff
        </Link>
        <div className="rounded-card border border-danger/30 bg-danger/5 p-6 font-sans text-sm text-danger">
          {loadError}
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex items-center gap-2 px-8 py-12 text-muted">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        <span className="font-sans text-sm">Loading staff…</span>
      </div>
    );
  }

  return (
    <div className="px-8 py-10">
      <Link
        href="/admin/staff"
        className="mb-4 inline-flex items-center gap-1.5 font-sans text-sm text-muted hover:text-navy"
      >
        <ArrowLeft size={14} aria-hidden /> All staff
      </Link>

      <AdminPageHeader
        title={staff.name || staff.email}
        subtitle={`${staff.email} · Joined ${new Date(staff.createdAt).toLocaleDateString()}`}
      />

      {/* Identity */}
      <section className="mb-6 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
        <h2 className="mb-4 font-raleway text-base font-bold text-navy">
          Identity
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Display name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className={inputClass}
              placeholder="Full name"
            />
          </Field>
          <Field label="Job title (optional)">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              maxLength={80}
              className={inputClass}
              placeholder="Customer support · Finance · Intern…"
            />
          </Field>
        </div>
      </section>

      {/* Role + permissions */}
      <section className="mb-6 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
        <header className="mb-4 flex flex-col gap-1">
          <h2 className="font-raleway text-base font-bold text-navy">
            Role & access
          </h2>
          <p className="font-sans text-xs text-muted">
            {ROLE_DESCRIPTIONS[role]}
          </p>
        </header>

        <Field label="Role" className="mb-5 md:max-w-xs">
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'STAFF' | 'ADMIN' | 'SELLER')
            }
            className={`${inputClass} cursor-pointer`}
          >
            <option value="STAFF">Staff (custom permissions)</option>
            <option value="ADMIN">Admin (full access)</option>
            <option value="SELLER">Seller</option>
          </select>
        </Field>

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
              Click a domain heading to toggle its whole group.
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
                    <fieldset
                      key={domain}
                      className="rounded-card border border-border bg-white p-3"
                    >
                      <legend className="px-1">
                        <button
                          type="button"
                          onClick={() => handleToggleDomain(domain)}
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
                              onChange={() => handleTogglePermission(cap.key)}
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
      </section>

      {/* Save bar */}
      <div className="mb-10 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>

      {/* Danger zone */}
      <section className="rounded-card border border-danger/30 bg-danger/5 p-5 md:p-6">
        <h2 className="mb-2 font-raleway text-base font-bold text-danger">
          Danger zone
        </h2>
        <p className="mb-4 font-sans text-sm text-charcoal">
          Removing this staff member flips them back to a regular customer
          account and clears every granted permission. They can still sign
          in but won&apos;t see any admin sections. Their orders and other
          customer data are untouched.
        </p>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-btn border border-danger bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
        >
          <Trash2 size={14} aria-hidden />
          Remove staff member
        </button>
      </section>

      <ConfirmDialog
        open={showDelete}
        title={`Remove ${staff.name || staff.email} from staff?`}
        message="They'll keep their customer account but lose all admin access. Reversible — you can re-add them as staff later."
        confirmLabel="Remove from staff"
        destructive
        busy={deleting}
        onConfirm={handleRemove}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Field({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
    </label>
  );
}
