import Image from 'next/image';
import Link from 'next/link';
import { SafeBoundary } from '@/components/common/SafeBoundary';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="min-h-screen bg-page py-8 md:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4">
        <Link href="/" className="self-center">
          <Image
            src="/images/logo.png"
            alt="AfriZoneMart"
            width={260}
            height={80}
            priority
            className="h-14 w-auto md:h-16"
          />
        </Link>

        <div className="rounded-card border border-border bg-white p-6 shadow-card md:p-8">
          <header className="mb-6 flex flex-col gap-1.5 text-center">
            <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
              {title}
            </h1>
            <p className="font-sans text-sm text-muted md:text-base">{subtitle}</p>
          </header>
          <SafeBoundary
            name="auth:form"
            fallback={
              <p className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
                Couldn&apos;t render the form. Please refresh the page.
              </p>
            }
          >
            {children}
          </SafeBoundary>
        </div>

        {footer ? (
          <div className="text-center font-sans text-sm text-charcoal">
            {footer}
          </div>
        ) : null}

        <p className="text-center font-sans text-xs text-muted">
          By continuing, you agree to AfriZoneMart&apos;s{' '}
          <Link href="/legal/terms" className="font-semibold text-navy hover:underline">
            Terms
          </Link>{' '}
          &{' '}
          <Link href="/legal/privacy" className="font-semibold text-navy hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
