'use client';

import { Check, Minus } from 'lucide-react';
import type { PermissionsMatrix as Matrix } from '@/lib/api/admin';

interface Props {
  matrix: Matrix | null;
}

const ROLE_STYLES: Record<string, string> = {
  CUSTOMER: 'bg-border/60 text-charcoal',
  SELLER: 'bg-navy/15 text-navy',
  ADMIN: 'bg-amber/30 text-navy',
};

export function PermissionsMatrix({ matrix }: Props) {
  if (!matrix) {
    return (
      <p className="font-sans text-sm text-muted">Loading capability matrix…</p>
    );
  }

  // Group capabilities by domain.
  const byDomain = matrix.capabilities.reduce<Record<string, Matrix['capabilities']>>(
    (acc, cap) => {
      (acc[cap.domain] ??= []).push(cap);
      return acc;
    },
    {},
  );
  const domains = Object.keys(byDomain);

  return (
    <div className="flex flex-col gap-4">
      {/* Role summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {matrix.roles.map((r) => (
          <div
            key={r.role}
            className="flex flex-col gap-2 rounded-card border border-border bg-page p-4"
          >
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${ROLE_STYLES[r.role] ?? ''}`}
              >
                {r.role.toLowerCase()}
              </span>
              <span className="font-raleway text-xs font-bold text-navy">
                {r.capabilities.length} cap{r.capabilities.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-charcoal">
              {r.description}
            </p>
          </div>
        ))}
      </div>

      {/* Capability matrix */}
      <div className="overflow-hidden rounded-card border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-sans text-sm">
            <thead>
              <tr className="border-b border-border bg-page">
                <th className="px-4 py-2 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                  Capability
                </th>
                {matrix.roles.map((r) => (
                  <th
                    key={r.role}
                    className="px-4 py-2 text-center font-raleway text-[10px] font-bold uppercase tracking-btn text-muted"
                  >
                    {r.role.toLowerCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <DomainGroup
                  key={domain}
                  domain={domain}
                  caps={byDomain[domain]}
                  roles={matrix.roles}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="font-sans text-[11px] text-muted">
        Capabilities are derived from role for v1. Per-user overrides land
        with Phase 5 (audit + advanced staff).
      </p>
    </div>
  );
}

function DomainGroup({
  domain,
  caps,
  roles,
}: {
  domain: string;
  caps: Matrix['capabilities'];
  roles: Matrix['roles'];
}) {
  return (
    <>
      <tr>
        <td
          colSpan={1 + roles.length}
          className="bg-page px-4 py-1.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-muted"
        >
          {domain}
        </td>
      </tr>
      {caps.map((cap) => (
        <tr key={cap.key} className="border-b border-border last:border-b-0">
          <td className="px-4 py-2">
            <div className="flex flex-col leading-tight">
              <span className="font-raleway text-xs font-semibold text-navy">{cap.label}</span>
              <span className="font-mono text-[10px] text-muted">{cap.key}</span>
            </div>
          </td>
          {roles.map((r) => {
            const has = r.capabilities.includes(cap.key);
            return (
              <td key={r.role} className="px-4 py-2 text-center">
                {has ? (
                  <Check size={14} className="mx-auto text-success" aria-label="allowed" />
                ) : (
                  <Minus size={14} className="mx-auto text-border" aria-label="not allowed" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
