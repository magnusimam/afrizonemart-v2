import Link from 'next/link';
import {
  ArrowRight,
  ClipboardCheck,
  HandshakeIcon,
  PackageCheck,
  Receipt,
  Store,
  TrendingUp,
} from 'lucide-react';
import { SUPPLIER_STAGES } from '@/components/supplier/stages';

/// Public landing page at /supplier — the front door for vendors
/// thinking about supplying Afrizonemart. Frames the relationship
/// correctly: AZM is the buyer (B2B procurement), supplier is the
/// seller-to-AZM at wholesale, AZM handles the retail side.
///
/// Server-rendered (no 'use client') so it's fast and indexable.
export const metadata = {
  title: 'Supply Afrizonemart',
  description:
    'Afrizonemart buys quality goods at wholesale from African manufacturers, farms, and brands and resells across Africa and worldwide. Apply to become a supplier.',
};

export default function SupplierLandingPage() {
  return (
    <main className="min-h-screen bg-page">
      {/* Top bar — minimal, just the brand + sign-in for existing suppliers */}
      <header className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 md:px-8">
        <Link href="/" className="flex flex-col gap-0.5">
          <span className="font-raleway text-[10px] font-semibold uppercase tracking-btn text-amber">
            Afrizonemart
          </span>
          <span className="font-raleway text-base font-bold text-navy md:text-lg">
            Supplier Portal
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/supplier/login"
            className="rounded-btn border border-border bg-white px-3 py-1.5 font-raleway text-[11px] font-bold uppercase tracking-btn text-charcoal hover:border-navy hover:text-navy md:px-4 md:py-2 md:text-xs"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-[#0a1942] px-4 py-16 text-white md:px-8 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-block rounded-full bg-amber/20 px-3 py-1 font-raleway text-[10px] font-bold uppercase tracking-btn text-amber">
            Supplier Procurement · Open for Applications
          </span>
          <h1 className="mt-4 font-raleway text-3xl font-bold leading-tight md:text-5xl">
            We buy. You make.{' '}
            <span className="text-amber">Africa wins.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-base leading-relaxed text-white/80 md:text-lg">
            Afrizonemart purchases quality African-made goods at wholesale and
            resells across Nigeria, Ghana, Kenya, South Africa and beyond. You
            focus on producing consistent, quality product. We handle the
            retail end-to-end — marketing, customers, payments, delivery.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/supplier/register"
              className="flex items-center gap-2 rounded-btn bg-amber px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white"
            >
              Apply to supply <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/supplier/login"
              className="rounded-btn border border-white/30 px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* The deal — clarifies the buyer/seller relationship up front */}
      <section className="bg-amber/10 px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-amber">
            How the relationship works
          </p>
          <h2 className="mt-2 font-raleway text-xl font-bold text-navy md:text-2xl">
            We&apos;re a buyer, not a marketplace
          </h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-charcoal md:text-base">
            You don&apos;t list products and chase customers here. Afrizonemart&apos;s
            Merchandise Sourcing Unit places <strong>purchase orders</strong>{' '}
            with you, takes delivery of the goods, pays you on the agreed terms,
            and resells to retail consumers across our marketplace. You stay
            focused on what you make best.
          </p>
        </div>
      </section>

      {/* Why supply us */}
      <section className="px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-raleway text-2xl font-bold text-navy md:text-3xl">
            Why supply Afrizonemart
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center font-sans text-sm text-muted md:text-base">
            Predictable wholesale demand from a buyer that understands African
            manufacturing — and grows with you.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Benefit
              Icon={ClipboardCheck}
              title="Confirmed purchase orders"
              body="Our team places regular POs against agreed pricing. You produce against confirmed demand — not the volatility of retail customers."
            />
            <Benefit
              Icon={Store}
              title="We handle the retail end-to-end"
              body="Marketing, customer support, payments, returns, last-mile delivery — all on us. You focus on making consistent, quality product."
            />
            <Benefit
              Icon={Receipt}
              title="Clear payment terms in NGN"
              body="Each PO comes with payment terms (on delivery or net 15/30) — clearly written, fully tracked. No chasing invoices, no payment surprises."
            />
            <Benefit
              Icon={TrendingUp}
              title="Volume that grows with you"
              body="We start with a manageable first order. As performance proves out we scale up. Annual procurement plans give you the demand visibility to invest in capacity."
            />
            <Benefit
              Icon={HandshakeIcon}
              title="A sourcing team that knows you"
              body="Each supplier gets a Merchandise Sourcing Unit contact who visits, understands your operation, and represents your interests internally."
            />
            <Benefit
              Icon={PackageCheck}
              title="No retail overhead"
              body="No e-commerce fees, no retail returns, no marketing spend, no last-mile cost. The retail risk and cost stays with us — your margin doesn't get eaten by it."
            />
          </div>
        </div>
      </section>

      {/* How onboarding works — the 10-stage pipeline */}
      <section className="bg-white px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-raleway text-2xl font-bold text-navy md:text-3xl">
            How onboarding works
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center font-sans text-sm text-muted md:text-base">
            From first interest to your first purchase order — a clear 9-stage
            journey our team walks you through.
          </p>
          <ol className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {SUPPLIER_STAGES.map((s) => (
              <li
                key={s.number}
                className="flex flex-col gap-2 rounded-card border border-border bg-page p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber font-raleway text-xs font-bold text-navy">
                    {s.number}
                  </span>
                  <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
                    Stage {s.number}
                  </span>
                </div>
                <p className="font-raleway text-sm font-bold text-navy">{s.long}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What we look for */}
      <section className="px-4 py-14 md:px-8 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-raleway text-2xl font-bold text-navy md:text-3xl">
            What we look for
          </h2>
          <p className="mt-2 text-center font-sans text-sm text-muted md:text-base">
            We work with manufacturers, farms, co-ops, and brand owners across
            Africa. The bar:
          </p>
          <ul className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 font-sans text-sm leading-relaxed text-charcoal md:text-base">
            <Bullet>
              <strong>Quality + consistency.</strong> Your product holds up
              across batches and meets the regulatory standards for its
              category (e.g. NAFDAC for food, regulatory cert for cosmetics).
            </Bullet>
            <Bullet>
              <strong>Production capacity.</strong> You can fulfil at a
              wholesale scale — even if the first PO is modest, we want to grow
              with suppliers who can scale.
            </Bullet>
            <Bullet>
              <strong>Honest pricing.</strong> Clear unit cost, clear minimum
              order quantity, clear lead time. We negotiate fairly, but we
              expect transparency from day one.
            </Bullet>
            <Bullet>
              <strong>African-made.</strong> Manufactured, grown, or assembled
              within Africa — that&apos;s our story and yours.
            </Bullet>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy px-4 py-14 text-center text-white md:px-8 md:py-20">
        <h2 className="mx-auto max-w-3xl font-raleway text-2xl font-bold leading-tight md:text-4xl">
          Ready to supply Afrizonemart?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl font-sans text-base text-white/80">
          Apply in about two minutes. Our Merchandise Sourcing Unit reviews
          every application and reaches out to start the conversation.
        </p>
        <Link
          href="/supplier/register"
          className="mt-7 inline-flex items-center gap-2 rounded-btn bg-amber px-7 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-navy shadow-card transition-colors hover:bg-white"
        >
          Apply to supply <ArrowRight size={16} aria-hidden />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white px-4 py-8 text-center text-xs text-muted md:px-8">
        <p>
          Questions? Email{' '}
          <a href="mailto:suppliers@afrizonemart.com" className="font-bold text-navy hover:text-amber">
            suppliers@afrizonemart.com
          </a>
          {' '}— we read every message.
        </p>
        <p className="mt-2">
          <Link href="/" className="hover:text-navy">
            ← Back to Afrizonemart storefront
          </Link>
        </p>
      </footer>
    </main>
  );
}

function Benefit({
  Icon,
  title,
  body,
}: {
  Icon: typeof ClipboardCheck;
  title: string;
  body: string;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-card border border-border bg-white p-5 shadow-card">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber/15 text-amber">
        <Icon size={18} aria-hidden />
      </span>
      <h3 className="font-raleway text-base font-bold text-navy">{title}</h3>
      <p className="font-sans text-sm leading-relaxed text-charcoal">{body}</p>
    </article>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-amber" />
      <span>{children}</span>
    </li>
  );
}
