import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Clapperboard,
  Clock,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { SupplierFAQList } from '@/components/supplier/SupplierFAQ';
import {
  SUPPLIER_FAQS,
  SUPPLIER_SUPPORT,
  VOLTRON_SERVICES,
} from '@/lib/supplier/support';

/**
 * Supplier support hub. Contact channels (call / WhatsApp / email), hours,
 * the Project Voltron service layer, and an FAQ accordion. Build 1: the
 * per-PIQ ticket inbox (PIQSupportThread) arrives with the support API.
 */

const VOLTRON_ICONS: Record<string, LucideIcon> = {
  Scale,
  Receipt,
  ShieldCheck,
  Boxes,
  BadgeCheck,
  Clapperboard,
};

export default function SupplierSupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-navy via-navy to-[#0a1942] p-7 text-white shadow-card md:p-10">
        {/* ambient glows + subtle dot grid */}
        <span
          aria-hidden
          className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-amber/20 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-pink/20 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]"
        />

        <div className="relative">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-amber-dark text-navy shadow-lg ring-4 ring-white/10">
              <Headphones size={26} aria-hidden />
            </span>
            <div>
              <p className="font-raleway text-[11px] font-bold uppercase tracking-[0.2em] text-amber">
                Supplier Support
              </p>
              <h1 className="mt-0.5 font-raleway text-3xl font-extrabold leading-tight text-white md:text-4xl">
                We’re with you
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed text-white/75 md:text-base">
            Our {SUPPLIER_SUPPORT.desk} supports you at every stage of your
            journey — call or WhatsApp us, send an email, or browse the answers
            below.
          </p>

          {/* info bar */}
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-card border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
            <span className="inline-flex items-center gap-2 font-raleway text-xs font-semibold text-white">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              Online now
            </span>
            <span aria-hidden className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="inline-flex items-center gap-1.5 font-sans text-xs text-white/80">
              <Clock size={14} aria-hidden className="text-amber" /> {SUPPLIER_SUPPORT.hours}
            </span>
            <span aria-hidden className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="inline-flex items-center gap-1.5 font-sans text-xs text-white/80">
              <MapPin size={14} aria-hidden className="text-amber" /> {SUPPLIER_SUPPORT.desk}
            </span>
          </div>
        </div>
      </section>

      {/* Contact — one primary "talk to a human" panel (the number shown
          once, two ways to reach it) + a secondary async email card.
          Pulled up to overlap the hero for a layered feel. */}
      <section className="relative z-10 -mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Primary: phone line — call or WhatsApp */}
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-2xl md:col-span-2 md:p-7">
          <span
            aria-hidden
            className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#1A6B2E]/10 blur-3xl"
          />
          <div className="relative flex h-full flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Talk to a human · online now
              </p>
              <a
                href={SUPPLIER_SUPPORT.hotlineHref}
                className="mt-2.5 block font-raleway text-2xl font-extrabold tracking-tight text-navy transition-colors hover:text-amber-dark md:text-[28px]"
              >
                {SUPPLIER_SUPPORT.hotline}
              </a>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-muted">
                Call us or message the same line on WhatsApp — replies in minutes
                during business hours.
              </p>
            </div>
            <div className="flex shrink-0 gap-3 sm:flex-col">
              <a
                href={SUPPLIER_SUPPORT.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-[#1A6B2E] px-5 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-success sm:flex-none"
              >
                <MessageCircle size={17} aria-hidden /> WhatsApp
              </a>
              <a
                href={SUPPLIER_SUPPORT.hotlineHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-navy px-5 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-navy-dark sm:flex-none"
              >
                <Phone size={17} aria-hidden /> Call
              </a>
            </div>
          </div>
        </div>

        {/* Secondary: email (async) */}
        <a
          href={SUPPLIER_SUPPORT.emailHref}
          className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
        >
          <span
            aria-hidden
            className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber to-amber-dark text-white shadow-md transition-transform duration-300 group-hover:scale-110">
            <Mail size={22} aria-hidden />
          </span>
          <div className="relative">
            <p className="font-raleway text-[11px] font-bold uppercase tracking-btn text-muted">
              Email us
            </p>
            <p className="mt-1 break-all font-raleway text-sm font-bold text-navy">
              {SUPPLIER_SUPPORT.email}
            </p>
          </div>
          <span className="relative mt-auto inline-flex items-center gap-1 font-raleway text-xs font-bold text-amber-dark transition-colors group-hover:text-navy">
            Send a message
            <ArrowRight
              size={14}
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
          <p className="relative font-sans text-[11px] text-muted">
            Replies within 1 business day.
          </p>
        </a>
      </section>

      {/* FAQs */}
      <section className="mt-12">
        <SectionHeading
          icon={HelpCircle}
          eyebrow="Answers"
          title="Frequently asked questions"
          subtitle="Quick answers to the things suppliers ask us most."
        />
        <div className="mt-5">
          <SupplierFAQList faqs={SUPPLIER_FAQS} />
        </div>
      </section>

      {/* Project Voltron */}
      <section className="mt-12">
        <SectionHeading
          icon={Sparkles}
          eyebrow="Beyond onboarding"
          title="Project Voltron — business support"
          subtitle="On-demand services so you’re supported across the whole journey, not just at sign-up."
        />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VOLTRON_SERVICES.map((svc) => {
            const Icon = VOLTRON_ICONS[svc.icon] ?? ShieldCheck;
            return (
              <div
                key={svc.title}
                className="group relative flex flex-col gap-2.5 overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-amber/40 hover:shadow-xl"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-light to-amber-light/40 text-amber-dark ring-1 ring-amber/20 transition-all duration-300 group-hover:from-amber group-hover:to-amber-dark group-hover:text-white">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="font-raleway text-sm font-bold text-navy">
                  {svc.title}
                </h3>
                <p className="font-sans text-xs leading-relaxed text-muted">
                  {svc.blurb}
                </p>
                {/* hover accent bar */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-amber to-amber-dark transition-transform duration-300 group-hover:scale-x-100"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Closing CTA — horizontal band, deliberately a different shape from
          the top panel so it reads as a send-off, not a repeat. */}
      <section className="relative mt-12 overflow-hidden rounded-card bg-gradient-to-r from-navy via-navy to-[#0a1942] p-7 text-white shadow-card md:p-9">
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]"
        />
        <span
          aria-hidden
          className="absolute -right-12 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-amber/20 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <div className="flex items-center gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber ring-4 ring-white/5 sm:flex">
              <Headphones size={26} aria-hidden />
            </span>
            <div>
              <h2 className="font-raleway text-xl font-extrabold text-white md:text-2xl">
                Still need a hand?
              </h2>
              <p className="mt-1 max-w-md font-sans text-sm leading-relaxed text-white/75">
                A real person from our {SUPPLIER_SUPPORT.desk} is one tap away
                during business hours.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <a
              href={SUPPLIER_SUPPORT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-btn bg-[#1A6B2E] px-5 py-3 font-raleway text-sm font-bold tracking-btn text-white shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-success"
            >
              <MessageCircle size={16} aria-hidden /> WhatsApp us
            </a>
            <a
              href={SUPPLIER_SUPPORT.hotlineHref}
              className="inline-flex items-center gap-2 rounded-btn bg-amber px-5 py-3 font-raleway text-sm font-bold tracking-btn text-navy shadow-lg transition-all duration-200 hover:scale-[1.03] hover:bg-white"
            >
              <Phone size={16} aria-hidden /> Call the desk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Consistent section header — icon chip + eyebrow + title + subtitle. */
function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-light text-navy">
        <Icon size={20} aria-hidden />
      </span>
      <div>
        <p className="font-raleway text-[11px] font-bold uppercase tracking-[0.16em] text-amber-dark">
          {eyebrow}
        </p>
        <h2 className="font-raleway text-xl font-bold text-navy">{title}</h2>
        <p className="mt-1 font-sans text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}
