import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service · Afrizonemart',
  description: 'Terms governing your use of Afrizonemart.',
  alternates: { canonical: '/terms' },
};

/**
 * Terms of Service. Linked from the footer of both the website
 * and the Play Store listing. Substantive review by legal counsel
 * recommended before official launch.
 */
export default function TermsPage() {
  const lastUpdated = '5 June 2026';

  return (
    <main className="bg-page pb-16">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Afrizonemart
          </p>
          <h1 className="mt-2 font-raleway text-3xl font-bold text-navy md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 font-sans text-sm text-muted">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 font-sans text-charcoal">
        <Section title="1. Agreement">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your
            use of Afrizonemart — including the website at{' '}
            <Link href="/" className="text-navy underline">
              afrizonemart.com
            </Link>{' '}
            and our mobile applications. By creating an account or
            placing an order you agree to these Terms.
          </p>
        </Section>

        <Section title="2. Accounts">
          <p>
            You must be at least 18 years old (or have a guardian
            place orders on your behalf). You are responsible for
            keeping your sign-in credentials secure. Notify us
            immediately if you suspect unauthorised access.
          </p>
          <p>
            You may delete your account at any time from inside the
            mobile app or at{' '}
            <Link href="/account/delete" className="text-navy underline">
              afrizonemart.com/account/delete
            </Link>
            . See our{' '}
            <Link href="/privacy" className="text-navy underline">
              Privacy Policy
            </Link>{' '}
            for what happens to your data.
          </p>
        </Section>

        <Section title="3. Orders + payments">
          <p>
            When you place an order, you make an offer to buy the
            listed item at the listed price. The order isn&apos;t
            confirmed until payment succeeds and you receive an
            order-confirmation message.
          </p>
          <p>
            Prices are quoted in Nigerian Naira (NGN) unless otherwise
            indicated. We may display approximate equivalents in your
            local currency for convenience; the charge is always in
            NGN.
          </p>
          <p>
            Payments are processed by third-party providers (Squad,
            Paystack). By placing an order you agree to their terms.
          </p>
        </Section>

        <Section title="4. Delivery">
          <p>
            Estimated delivery times are estimates. We work with
            third-party couriers and cannot guarantee a specific
            arrival window unless explicitly offered at checkout.
          </p>
          <p>
            Risk of loss passes to you when the parcel is delivered
            to the address you provided. You can confirm delivery
            inside the app once the parcel arrives — see the
            Show &amp; Scan flow on your order detail page.
          </p>
        </Section>

        <Section title="5. Returns and refunds">
          <p>
            We accept returns of unused, undamaged items within a
            window stated on each product page (typically 7 days from
            delivery). Hygiene-sensitive items, opened consumables,
            and made-to-order items are non-returnable except where
            faulty. Contact{' '}
            <a
              href="mailto:support@afrizonemart.com"
              className="text-navy underline"
            >
              support@afrizonemart.com
            </a>{' '}
            to start a return.
          </p>
          <p>
            Refunds are issued to the original payment method within
            10 business days of receiving the returned item.
          </p>
        </Section>

        <Section title="6. Continental Rewards (loyalty)">
          <p>
            Continental Coins are a loyalty programme — they have no
            monetary value, cannot be sold or transferred, and may be
            adjusted, expired, or revoked according to the programme
            rules. Refunds claw back the coins that were earned or
            redeemed on the refunded order. We may change the
            programme rules; we&apos;ll give you reasonable notice
            for material changes.
          </p>
        </Section>

        <Section title="7. Reviews and user content">
          <p>
            You retain ownership of reviews and content you post. By
            posting on Afrizonemart you grant us a worldwide,
            non-exclusive, royalty-free licence to display, store,
            and distribute that content as part of the Platform.
            Reviews must be honest and based on a real purchase. We
            may remove reviews that violate these rules.
          </p>
        </Section>

        <Section title="8. Prohibited use">
          <p>
            You may not use Afrizonemart to commit fraud, infringe
            intellectual property, scrape product data at scale,
            impersonate others, or interfere with the Platform&apos;s
            operation.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            To the maximum extent permitted by law, Afrizonemart and
            its officers, employees, and affiliates are not liable
            for indirect or consequential losses arising from your
            use of the Platform. Our total liability for any claim
            arising out of an order is limited to the amount you
            paid for that order.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These Terms are governed by the laws of the Federal
            Republic of Nigeria. Disputes will be subject to the
            non-exclusive jurisdiction of the Lagos courts.
          </p>
        </Section>

        <Section title="11. Changes">
          <p>
            We may update these Terms from time to time. The
            &ldquo;Last updated&rdquo; date at the top reflects when.
            Material changes will be notified in advance by email or
            in-app notice.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions:{' '}
            <a
              href="mailto:support@afrizonemart.com"
              className="text-navy underline"
            >
              support@afrizonemart.com
            </a>
            .
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 leading-relaxed">
      <h2 className="font-raleway text-xl font-bold text-navy">{title}</h2>
      <div className="space-y-3 text-[15px]">{children}</div>
    </section>
  );
}
