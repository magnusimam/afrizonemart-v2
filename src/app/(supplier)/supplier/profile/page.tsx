'use client';

import Link from 'next/link';
import {
  Building2,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User,
  type LucideIcon,
} from 'lucide-react';
import { useSupplierMe } from '@/lib/api/supplier-hooks';
import { useAuthStore } from '@/stores/authStore';
import { SUPPLIER_SUPPORT } from '@/lib/supplier/support';

/**
 * Supplier profile — live read of the company record (GET /api/suppliers/me).
 * Email comes from the auth account; the rest from the supplier profile.
 * Editing is "request a change" until the self-edit flow lands.
 */
type Field = { label: string; value: string; icon: LucideIcon; href?: string };

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function SupplierProfilePage() {
  const { data: profile, isLoading } = useSupplierMe();
  const email = useAuthStore((s) => s.user?.email ?? '');

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-8">
        <div className="h-40 animate-pulse rounded-card bg-white shadow-card" />
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded-card bg-white shadow-card" />
          <div className="h-56 animate-pulse rounded-card bg-white shadow-card" />
        </div>
      </div>
    );
  }

  const business: Field[] = [
    { label: 'Company name', value: profile.companyName, icon: Building2 },
    { label: 'Main category', value: profile.category, icon: Layers },
    {
      label: 'Country',
      value: [profile.region, profile.country].filter(Boolean).join(', ') || profile.country,
      icon: MapPin,
    },
  ];
  const contact: Field[] = [
    { label: 'Contact name', value: profile.contactName, icon: User },
    ...(email ? [{ label: 'Email', value: email, icon: Mail, href: `mailto:${email}` } as Field] : []),
    ...(profile.phone
      ? [{ label: 'Phone', value: profile.phone, icon: Phone, href: `tel:${profile.phone.replace(/\s/g, '')}` } as Field]
      : []),
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10">
      {/* Cover header */}
      <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy to-[#0a1942] p-7 text-white shadow-card md:p-9">
        <span aria-hidden className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber/20 blur-3xl" />
        <span aria-hidden className="absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-pink/20 blur-3xl" />
        <span aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark font-raleway text-2xl font-extrabold text-navy shadow-lg ring-4 ring-white/10">
            {initials(profile.companyName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-raleway text-[11px] font-bold uppercase tracking-[0.2em] text-amber">
              Company profile
            </p>
            <h1 className="mt-0.5 font-raleway text-2xl font-extrabold leading-tight text-white md:text-3xl">
              {profile.companyName}
            </h1>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-raleway text-xs font-semibold text-white/90">
                <Layers size={13} aria-hidden className="text-amber" /> {profile.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-raleway text-xs font-semibold text-white/90">
                <MapPin size={13} aria-hidden className="text-amber" /> {profile.country}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1.5 font-raleway text-xs font-semibold text-white">
                <ShieldCheck size={13} aria-hidden className="text-success" /> Active supplier
              </span>
            </div>
          </div>

          <Link
            href="/supplier/support"
            className="inline-flex shrink-0 items-center gap-2 rounded-btn bg-amber px-4 py-2.5 font-raleway text-sm font-bold tracking-btn text-navy shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-white"
          >
            <Pencil size={15} aria-hidden /> Request a change
          </Link>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProfileCard title="Business details" icon={Building2} fields={business} />
        <ProfileCard title="Primary contact" icon={User} fields={contact} />
      </div>

      <p className="mt-6 rounded-card border border-border bg-white px-5 py-4 font-sans text-xs leading-relaxed text-muted shadow-card">
        These details were captured during your registration and profiling. Need
        to update something? Contact our {SUPPLIER_SUPPORT.desk} on{' '}
        <a href={SUPPLIER_SUPPORT.hotlineHref} className="font-semibold text-navy hover:text-amber-dark">
          {SUPPLIER_SUPPORT.hotline}
        </a>{' '}
        and we’ll take care of it.
      </p>
    </div>
  );
}

function ProfileCard({ title, icon: Icon, fields }: { title: string; icon: LucideIcon; fields: Field[] }) {
  return (
    <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-light text-navy">
          <Icon size={18} aria-hidden />
        </span>
        <h2 className="font-raleway text-sm font-bold uppercase tracking-btn text-navy">{title}</h2>
      </header>
      <dl className="divide-y divide-border">
        {fields.map((f) => {
          const FieldIcon = f.icon;
          return (
            <div key={f.label} className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-page">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-page text-muted transition-colors group-hover:bg-amber-light group-hover:text-amber-dark">
                <FieldIcon size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <dt className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">{f.label}</dt>
                <dd className="mt-0.5 truncate font-sans text-sm font-semibold text-charcoal">
                  {f.href ? <a href={f.href} className="hover:text-amber-dark">{f.value}</a> : f.value}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
