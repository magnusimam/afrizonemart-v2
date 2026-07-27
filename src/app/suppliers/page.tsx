import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  Clapperboard,
  ClipboardList,
  FileSignature,
  FileSpreadsheet,
  Globe2,
  GraduationCap,
  Handshake,
  Headset,
  LayoutDashboard,
  ListChecks,
  Mail,
  PackageCheck,
  Phone,
  Receipt,
  Rocket,
  Route,
  Scale,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { SupplierFaq } from '@/components/supplier/marketing/SupplierFaq';
import { SupplierLandingNav } from '@/components/supplier/marketing/SupplierLandingNav';
import { Reveal } from '@/components/supplier/marketing/Reveal';
import { LandingJourney } from '@/components/supplier/marketing/LandingJourney';
import { LandingDashboardMock } from '@/components/supplier/marketing/LandingDashboardMock';
import {
  FAQS,
  HERO_CHIPS,
  HOW_IT_WORKS,
  VALUE_PROPS,
} from '@/components/supplier/marketing/content';
import { SUPPLIER_SUPPORT, VOLTRON_SERVICES } from '@/lib/supplier/support';

export const metadata: Metadata = {
  title: 'Become a Supplier — Supply Made-in-Africa Products to Afrizonemart',
  description:
    'Bring your African-made products to customers worldwide. Afrizonemart guides you through a clear 10-stage onboarding journey with dedicated support at every step.',
  alternates: { canonical: '/suppliers' },
};

/** Maps the icon-name strings stored in content.ts to Lucide components. */
const ICONS: Record<string, LucideIcon> = {
  Globe2,
  Route,
  LayoutDashboard,
  BadgeCheck,
  Handshake,
  ClipboardList,
  Building2,
  FileSpreadsheet,
  GraduationCap,
  ShieldCheck,
  FileSignature,
  Rocket,
  PackageCheck,
  TrendingUp,
};

/** Project Voltron service icons, keyed by the name stored in support.ts. */
const VOLTRON_ICONS: Record<string, LucideIcon> = {
  Scale,
  Receipt,
  ShieldCheck,
  Boxes,
  BadgeCheck,
  Clapperboard,
};

const DASHBOARD_FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Route,
    title: 'Stage tracker',
    body: 'A live progress bar shows exactly where you are across all 10 stages — and what to do next.',
  },
  {
    icon: ListChecks,
    title: 'Product questionnaires',
    body: 'Create and manage a PIQ for every product, auto-saved as you go, with a clear status on each.',
  },
  {
    icon: Headset,
    title: 'Built-in support',
    body: 'Stuck on a product? Open a support ticket about that specific PIQ and chat with our team.',
  },
  {
    icon: BarChart3,
    title: 'Performance insights',
    body: 'Once you are live, see how your products perform and where your next opportunities are.',
  },
];

export default function SupplierLandingPage() {
  return (
    <>
      <SupplierLandingNav />

      <main className="bg-page">
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-[#0a1942] text-white">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-amber/20 blur-3xl motion-safe:animate-pulse [animation-duration:7s]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-pink/20 blur-3xl motion-safe:animate-pulse [animation-duration:9s]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
          />

          <div className="relative mx-auto max-w-4xl px-4 py-24 text-center md:py-32">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 font-raleway text-xs font-semibold uppercase tracking-[0.16em] text-amber">
                Afrizonemart for Suppliers
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 font-raleway text-4xl font-extrabold leading-tight text-balance text-white md:text-6xl">
                Supply everything{' '}
                <span className="bg-gradient-to-r from-amber to-amber-dark bg-clip-text text-transparent">
                  made in Africa
                </span>{' '}
                — we take it to the world
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-2xl font-sans text-lg leading-relaxed text-white/75">
                We buy what you make in bulk and take it to customers across the
                continent and beyond. We guide you through every step — from first
                contact to your first order and far beyond.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/supplier/register"
                  className="group inline-flex items-center gap-2 rounded-btn bg-amber px-7 py-3.5 font-raleway text-base font-bold tracking-btn text-navy shadow-lg shadow-amber/20 transition-all duration-200 hover:scale-[1.03] hover:bg-white"
                >
                  Apply to supply
                  <ArrowRight
                    size={18}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-btn border border-white/25 px-7 py-3.5 font-raleway text-base font-semibold text-white transition-colors hover:border-amber hover:text-amber"
                >
                  See how it works
                </a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {HERO_CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-2 font-sans text-sm text-white/70"
                  >
                    <CheckCircle2 size={16} aria-hidden className="text-amber" />
                    {chip}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ──────────────────── Why supply to us ──────────────────── */}
        <section id="why" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-raleway text-3xl font-extrabold text-navy md:text-4xl">
                Built to carry African makers further
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-muted">
                One partner with the buying power, reach, and support to take your
                products to a global audience.
              </p>
            </Reveal>
            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUE_PROPS.map((vp, i) => {
                const Icon = ICONS[vp.icon] ?? Globe2;
                return (
                  <Reveal
                    key={vp.title}
                    delay={i * 80}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-amber/30 hover:shadow-xl"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-light to-amber-light/40 text-amber-dark ring-1 ring-amber/20 transition-all duration-300 group-hover:from-amber group-hover:to-amber-dark group-hover:text-white">
                      <Icon size={24} aria-hidden />
                    </span>
                    <h3 className="mt-5 font-raleway text-lg font-bold text-navy">
                      {vp.title}
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                      {vp.body}
                    </p>
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-amber to-amber-dark transition-transform duration-300 group-hover:scale-x-100"
                    />
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────── How it works ─────────────────────── */}
        <section id="how" className="scroll-mt-20 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-raleway text-3xl font-extrabold text-navy md:text-4xl">
                From hello to your first order
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-muted">
                The full pipeline below breaks each of these into the exact stages
                you’ll move through.
              </p>
            </Reveal>
            <div className="relative mt-14">
              {/* connecting line on desktop */}
              <span
                aria-hidden
                className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
              />
              <ol className="grid grid-cols-1 gap-8 md:grid-cols-5">
                {HOW_IT_WORKS.map((step, i) => (
                  <Reveal key={step.title} delay={i * 90}>
                    <li className="relative flex flex-col">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-navy to-navy-dark font-raleway text-base font-bold text-white shadow-md ring-4 ring-white">
                        {i + 1}
                      </span>
                      <h3 className="mt-4 font-raleway text-base font-bold text-navy">
                        {step.title}
                      </h3>
                      <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                        {step.body}
                      </p>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ─────────────────── The 10-stage journey ─────────────────── */}
        <section id="journey" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-raleway text-3xl font-extrabold text-navy md:text-4xl">
                Your journey to global markets
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-muted">
                From first contact to a thriving partnership — follow the road
                through all ten stages. You’ll always know where you are and what
                comes next.
              </p>
            </Reveal>

            <Reveal delay={80} className="mt-12">
              <LandingJourney />
            </Reveal>
          </div>
        </section>

        {/* ─────────────────────── Your dashboard ─────────────────────── */}
        <section
          id="tools"
          className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-navy via-navy to-[#0a1942] py-20 text-white md:py-28"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full bg-amber/15 blur-3xl motion-safe:animate-pulse [animation-duration:8s]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-pink/15 blur-3xl motion-safe:animate-pulse [animation-duration:10s]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
          />
          <div className="relative mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <Reveal>
                  <h2 className="font-raleway text-3xl font-extrabold text-white md:text-4xl">
                    Your whole journey, on one screen
                  </h2>
                  <p className="mt-4 font-sans text-base leading-relaxed text-white/75">
                    From the moment you apply, your dashboard is mission control —
                    it keeps everything organised so you can focus on your
                    products, not paperwork.
                  </p>
                </Reveal>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {DASHBOARD_FEATURES.map((f, i) => (
                    <Reveal
                      key={f.title}
                      delay={i * 80}
                      className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:border-amber/40 hover:bg-white/[0.08]"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-amber transition-transform duration-300 group-hover:scale-110">
                        <f.icon size={22} aria-hidden />
                      </span>
                      <h3 className="mt-4 font-raleway text-base font-bold text-white">
                        {f.title}
                      </h3>
                      <p className="mt-1.5 font-sans text-sm leading-relaxed text-white/70">
                        {f.body}
                      </p>
                    </Reveal>
                  ))}
                </div>
              </div>

              <Reveal delay={120}>
                <LandingDashboardMock />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ──────────────────── Help & services ──────────────────── */}
        <section id="help" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-raleway text-3xl font-extrabold text-navy md:text-4xl">
                Help &amp; services at every step
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-muted">
                From your first call to global-market-ready, our team and{' '}
                <span className="font-semibold text-navy">Project Voltron</span>{' '}
                on-demand support walk the whole journey with you — Bronze
                (domestic), Silver (AfCFTA), and Gold (global) ready.
              </p>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {VOLTRON_SERVICES.map((svc, i) => {
                const Icon = VOLTRON_ICONS[svc.icon] ?? ShieldCheck;
                return (
                  <Reveal
                    key={svc.title}
                    delay={i * 70}
                    className="group flex flex-col rounded-2xl border border-border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-amber/30 hover:shadow-xl"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-light to-amber-light/40 text-amber-dark ring-1 ring-amber/20 transition-all duration-300 group-hover:from-amber group-hover:to-amber-dark group-hover:text-white">
                      <Icon size={24} aria-hidden />
                    </span>
                    <h3 className="mt-5 font-raleway text-lg font-bold text-navy">
                      {svc.title}
                    </h3>
                    <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
                      {svc.blurb}
                    </p>
                  </Reveal>
                );
              })}
            </div>

            {/* Always-on hotline band */}
            <Reveal className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-navy via-navy to-[#0a1942] p-8 shadow-card">
              <div className="flex flex-col items-center gap-5 text-center text-white md:flex-row md:justify-between md:text-left">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber text-navy shadow-md">
                    <Headset size={24} aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-raleway text-lg font-bold text-white">
                      Talk to a real person, any time
                    </h3>
                    <p className="font-sans text-sm text-white/70">
                      Our {SUPPLIER_SUPPORT.desk} is ready — {SUPPLIER_SUPPORT.hours}.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 sm:flex-row">
                  <a
                    href={SUPPLIER_SUPPORT.hotlineHref}
                    className="inline-flex items-center gap-2 rounded-btn bg-amber px-5 py-3 font-raleway text-sm font-bold tracking-btn text-navy transition-all duration-200 hover:scale-[1.03] hover:bg-white"
                  >
                    <Phone size={16} aria-hidden /> {SUPPLIER_SUPPORT.hotline}
                  </a>
                  <a
                    href={SUPPLIER_SUPPORT.emailHref}
                    className="inline-flex items-center gap-2 rounded-btn border border-white/25 px-5 py-3 font-raleway text-sm font-semibold text-white transition-colors hover:border-amber hover:text-amber"
                  >
                    <Mail size={16} aria-hidden /> Email us
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─────────────────────────── FAQ ─────────────────────────── */}
        <section id="faq" className="scroll-mt-20 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-raleway text-3xl font-extrabold text-navy md:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 font-sans text-base leading-relaxed text-muted">
                Everything you need to know before you apply.
              </p>
            </Reveal>
            <Reveal delay={80} className="mt-12">
              <SupplierFaq items={FAQS} />
            </Reveal>
          </div>
        </section>

        {/* ──────────────────────── Final CTA ──────────────────────── */}
        <section id="apply" className="relative overflow-hidden bg-amber py-20 md:py-24">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-navy/10 blur-3xl"
          />
          <Reveal className="relative mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-raleway text-3xl font-extrabold text-navy md:text-4xl">
              Ready to bring your products to the world?
            </h2>
            <p className="mt-4 font-sans text-base leading-relaxed text-navy/80">
              Start your application today. It takes minutes, and our team guides
              you through every stage from here.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/supplier/register"
                className="group inline-flex items-center gap-2 rounded-btn bg-navy px-7 py-3.5 font-raleway text-base font-bold tracking-btn text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark"
              >
                Apply to supply
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/supplier/login"
                className="inline-flex items-center gap-2 rounded-btn border border-navy/30 px-7 py-3.5 font-raleway text-base font-semibold text-navy transition-colors hover:border-navy hover:bg-white/40"
              >
                Already a supplier? Log in
              </Link>
            </div>
          </Reveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
