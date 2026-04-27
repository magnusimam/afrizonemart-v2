'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AddStaffDialog } from '@/components/admin/AddStaffDialog';
import { Column, DataTable } from '@/components/admin/DataTable';
import { PermissionsMatrix } from '@/components/admin/PermissionsMatrix';
import { toast } from '@/components/admin/Toast';
import {
  adminGetPermissions,
  adminListStaff,
  type PermissionsMatrix as Matrix,
  type StaffMember,
} from '@/lib/api/admin';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const loadStaff = () =>
    adminListStaff()
      .then((r) => setStaff(r.items))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load staff', 'error'));

  useEffect(() => {
    void loadStaff();
    void adminGetPermissions().then(setMatrix).catch(() => {});
  }, []);

  const columns: Column<StaffMember>[] = [
    {
      key: 'who',
      header: 'Member',
      render: (s) => (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10 font-raleway text-xs font-bold text-navy">
            {(s.name?.[0] ?? s.email[0]).toUpperCase()}
          </span>
          <div className="flex flex-col leading-tight">
            <Link
              href={`/admin/customers/${s.id}`}
              className="font-raleway font-semibold text-navy hover:text-amber"
            >
              {s.name ?? s.email}
            </Link>
            {s.name && (
              <span className="font-sans text-[11px] text-muted">{s.email}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (s) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
            s.role === 'ADMIN' ? 'bg-amber/30 text-navy' : 'bg-navy/15 text-navy'
          }`}
        >
          {s.role.toLowerCase()}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Added',
      render: (s) => (
        <span className="text-charcoal">{new Date(s.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'open',
      header: '',
      className: 'text-right',
      render: (s) => (
        <Link
          href={`/admin/customers/${s.id}`}
          className="font-raleway text-[11px] font-bold uppercase tracking-btn text-navy hover:text-amber"
        >
          Manage
        </Link>
      ),
    },
  ];

  return (
    <div className="px-8 py-10">
      <AdminPageHeader
        title="Staff & permissions"
        subtitle="Add staff members directly, change their roles, and see exactly what each role can do."
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
          >
            <UserPlus size={14} aria-hidden /> Add staff
          </button>
        }
      />

      <section className="mb-6 flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber" aria-hidden />
            <h2 className="font-raleway text-base font-bold text-navy">
              Staff members
            </h2>
          </div>
          <span className="font-sans text-xs text-muted">
            {staff ? `${staff.length} active` : 'Loading…'}
          </span>
        </header>
        <DataTable
          rows={staff ?? []}
          columns={columns}
          rowKey={(s) => s.id}
          loading={staff === null}
          emptyState={
            <span>
              No staff yet —{' '}
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="font-bold text-navy underline hover:text-amber"
              >
                add your first staff member
              </button>
              .
            </span>
          }
        />
      </section>

      <section className="flex flex-col gap-3 rounded-card border border-border bg-white p-5 shadow-card">
        <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-col">
            <h2 className="font-raleway text-base font-bold text-navy">
              Roles & permissions
            </h2>
            <p className="font-sans text-xs text-muted">
              What each role can do across the platform.
            </p>
          </div>
        </header>
        <PermissionsMatrix matrix={matrix} />
      </section>

      <AddStaffDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => void loadStaff()}
      />
    </div>
  );
}
