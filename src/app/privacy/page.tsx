import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy · Afrizonemart',
  description:
    'How Afrizonemart collects, uses, and protects your personal data.',
  alternates: { canonical: '/privacy' },
};

/**
 * Public Privacy Policy. Lives at /privacy — the URL submitted on
 * the Google Play Console listing's "Privacy Policy" field, and
 * the URL the Data Safety form references for "data collection
 * details."
 *
 * Drafted with NDPR (Nigeria) + GDPR (EU customers) in mind.
 * Substantive owner: legal counsel — Magnus has been asked to
 * have this reviewed before official launch. The content here is
 * a faithful description of what the platform actually does
 * today; the legal phrasing may need tightening.
 */
export default function PrivacyPolicyPage() {
  const lastUpdated = '5 June 2026';

  return (
    <main className="bg-page pb-16">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            Afrizonemart
          </p>
          <h1 className="mt-2 font-raleway text-3xl font-bold text-navy md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 font-sans text-sm text-muted">
            Last updated: {lastUpdated}
          </p>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 font-sans text-charcoal">
        <Section title="1. Who we are">
          <p>
            Afrizonemart (the &ldquo;Platform,&rdquo; &ldquo;we,&rdquo;
            &ldquo;us&rdquo;) is an online marketplace operated by
            Afrizonemart Limited. We connect African producers,
            suppliers, and brands with shoppers across Nigeria, the
            African continent, and the diaspora. This Privacy Policy
            explains how we collect, use, store, and share your
            personal data when you interact with our website at{' '}
            <Link href="/" className="text-navy underline">
              afrizonemart.com
            </Link>
            , our mobile applications (Android and iOS), and any
            related services.
          </p>
          <p>
            For the purposes of the Nigeria Data Protection Act 2023
            (NDPA) and the EU General Data Protection Regulation
            (GDPR), we are the &ldquo;data controller&rdquo; of the
            personal information you provide to us.
          </p>
        </Section>

        <Section title="2. The data we collect">
          <p>We collect personal data in three ways:</p>

          <SubSection title="2.1 Data you give us directly">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Account data</strong> — name, email address,
                phone number, password (stored hashed; never visible
                to us in plain text), date of birth (optional), profile
                picture (optional).
              </li>
              <li>
                <strong>Delivery + payment data</strong> — shipping
                addresses, recipient names and phone numbers, payment
                method (we never store full card numbers; our payment
                processor handles those directly).
              </li>
              <li>
                <strong>Order data</strong> — products purchased,
                quantities, prices, order history.
              </li>
              <li>
                <strong>Reviews and content</strong> — reviews you
                leave on products, your display name shown alongside
                them.
              </li>
              <li>
                <strong>Communications</strong> — messages you send
                us through support channels (email, in-app chat,
                WhatsApp).
              </li>
            </ul>
          </SubSection>

          <SubSection title="2.2 Data we collect automatically">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Device data</strong> — mobile device model,
                operating system, app version, language, time zone,
                approximate location derived from IP address.
              </li>
              <li>
                <strong>Usage data</strong> — products you view, items
                you add to your cart, search queries, time spent on
                product pages. Used to power product recommendations
                and the &ldquo;trending&rdquo; sort.
              </li>
              <li>
                <strong>Cookies and similar technologies</strong> —
                small data files stored on your device that keep you
                signed in and remember your preferences. You can
                disable non-essential cookies via your browser
                settings.
              </li>
              <li>
                <strong>Push notification tokens</strong> — when you
                grant permission, an Expo / FCM / APNs token unique
                to your device so we can send order updates.
              </li>
            </ul>
          </SubSection>

          <SubSection title="2.3 Data from third parties">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Payment processors</strong> (Squad / Paystack)
                — confirmation that a payment succeeded or failed,
                including a gateway reference.
              </li>
              <li>
                <strong>Identity providers</strong> (Google sign-in,
                where used) — your name, email, and profile picture
                from your Google account.
              </li>
              <li>
                <strong>Couriers and logistics partners</strong> —
                delivery confirmations.
              </li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. How we use your data">
          <p>We use your personal data only for the purposes below:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>To process and deliver your orders</strong> —
              including sharing your shipping address with the courier
              that delivers your parcel.
            </li>
            <li>
              <strong>To run your account</strong> — sign-in,
              authentication, password reset, profile changes.
            </li>
            <li>
              <strong>To communicate with you</strong> — order
              confirmations, shipping updates, delivery
              notifications, account security alerts, and customer
              support replies.
            </li>
            <li>
              <strong>To send you marketing</strong> — only when you
              have opted in. You can opt out at any time from your
              account settings or by clicking the unsubscribe link
              in any marketing email.
            </li>
            <li>
              <strong>To improve the Platform</strong> — analysing
              usage patterns to fix bugs, improve product
              recommendations, and design new features. Where
              possible, we use aggregated or anonymised data for
              this purpose.
            </li>
            <li>
              <strong>To prevent fraud and abuse</strong> — rate
              limiting, account lockouts after repeated failed
              sign-ins, monitoring for suspicious activity.
            </li>
            <li>
              <strong>To comply with the law</strong> — tax,
              accounting, anti-money-laundering, and law-enforcement
              requests.
            </li>
          </ul>
        </Section>

        <Section title="4. Legal bases for processing">
          <p>
            Under the NDPA and GDPR, we process your personal data on
            the following legal bases:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Contract</strong> — to perform the contract of
              sale when you place an order.
            </li>
            <li>
              <strong>Consent</strong> — for marketing emails, SMS,
              push notifications, and non-essential cookies. You can
              withdraw consent at any time.
            </li>
            <li>
              <strong>Legitimate interests</strong> — fraud
              prevention, platform improvement, security monitoring,
              short-form usage analytics.
            </li>
            <li>
              <strong>Legal obligation</strong> — tax records,
              accounting, and required regulatory disclosures.
            </li>
          </ul>
        </Section>

        <Section title="5. Who we share your data with">
          <p>
            We do not sell your personal data. We share it only with:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Payment processors</strong> — Squad, Paystack,
              and others as required to process a transaction.
            </li>
            <li>
              <strong>Couriers and logistics partners</strong> —
              shipping name, phone, and address needed to deliver
              your parcel.
            </li>
            <li>
              <strong>Infrastructure providers</strong> — Railway
              (api hosting), Vercel (web hosting), Cloudflare R2
              (image storage), Cloudflare (CDN). These providers
              process data only on our behalf under data processing
              agreements.
            </li>
            <li>
              <strong>Communications providers</strong> — Resend
              (transactional email), Twilio (SMS / WhatsApp), Expo
              (push notifications).
            </li>
            <li>
              <strong>Analytics</strong> — where used, only with your
              consent for non-essential analytics.
            </li>
            <li>
              <strong>Law enforcement</strong> — when required by a
              valid legal request.
            </li>
            <li>
              <strong>Acquirers</strong> — if Afrizonemart is acquired
              or merged with another company, your data may transfer.
              We&apos;ll notify you before this happens.
            </li>
          </ul>
        </Section>

        <Section title="6. International data transfers">
          <p>
            Some of our service providers are located outside Nigeria
            (notably in the United States and the European Union).
            When your data is transferred across borders, we rely on
            standard contractual clauses or equivalent safeguards as
            required by the NDPA and GDPR.
          </p>
        </Section>

        <Section title="7. How long we keep your data">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Active account data</strong> — for as long as
              your account exists.
            </li>
            <li>
              <strong>Order, payment, and tax records</strong> — at
              least 7 years after the order, to meet Nigerian
              accounting and tax requirements. Personally identifying
              fields (name, address, phone) on these records are
              anonymised if you delete your account.
            </li>
            <li>
              <strong>Marketing consent records</strong> — kept while
              your account exists; deleted on account deletion.
            </li>
            <li>
              <strong>Server logs</strong> — typically 90 days.
            </li>
          </ul>
        </Section>

        <Section title="8. Your rights">
          <p>
            Subject to the NDPA, GDPR, and other applicable laws, you
            have the right to:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Access</strong> the personal data we hold about
              you.
            </li>
            <li>
              <strong>Correct</strong> data that is inaccurate or
              incomplete — through your profile settings or by
              contacting us.
            </li>
            <li>
              <strong>Delete your account</strong> — at any time, from
              inside the mobile app (Account → Profile → Danger Zone →
              Delete my account) or via{' '}
              <Link
                href="/account/delete"
                className="text-navy underline"
              >
                afrizonemart.com/account/delete
              </Link>
              . See Section 9 for details on what is removed and what
              we keep.
            </li>
            <li>
              <strong>Restrict or object to</strong> certain types of
              processing — particularly direct marketing.
            </li>
            <li>
              <strong>Export your data</strong> in a portable format —
              contact us to request a copy.
            </li>
            <li>
              <strong>Withdraw consent</strong> for marketing or
              non-essential cookies at any time.
            </li>
            <li>
              <strong>Lodge a complaint</strong> with the Nigeria Data
              Protection Commission (NDPC) at{' '}
              <a
                href="https://ndpc.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy underline"
              >
                ndpc.gov.ng
              </a>
              {' '}or, for EU residents, with your local data
              protection authority.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a
              href="mailto:privacy@afrizonemart.com"
              className="text-navy underline"
            >
              privacy@afrizonemart.com
            </a>
            . We&apos;ll respond within 30 days.
          </p>
        </Section>

        <Section title="9. Account deletion — what gets removed">
          <p>
            When you delete your account from inside the mobile app
            or via{' '}
            <Link href="/account/delete" className="text-navy underline">
              the web account-deletion page
            </Link>
            , the following happens immediately:
          </p>
          <p className="font-bold text-navy">Removed entirely:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Your name, email, phone number, profile picture.</li>
            <li>Your saved delivery addresses.</li>
            <li>Your wishlist and shopping cart.</li>
            <li>Your Continental Coins balance (reset to zero).</li>
            <li>Push notifications to your device(s).</li>
            <li>Marketing email and SMS subscriptions.</li>
          </ul>
          <p className="font-bold text-navy">
            Kept for legal / accounting reasons but anonymised:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Past orders — including amounts, items, dates. The
              shipping name, phone, and address on each record are
              replaced with placeholders.
            </li>
            <li>
              Past loyalty transactions — needed for refund clawback
              and audit. Account is zeroed.
            </li>
            <li>
              Published product reviews — the text remains so other
              shoppers continue to benefit. (A future update will let
              you anonymise these too.)
            </li>
          </ul>
        </Section>

        <Section title="10. Children">
          <p>
            Afrizonemart is not directed at children under 13. We do
            not knowingly collect data from anyone under 13. If you
            believe a child has provided us with personal data, please
            contact us and we will delete it.
          </p>
        </Section>

        <Section title="11. Security">
          <p>
            We use industry-standard measures to protect your data
            including HTTPS in transit, encryption at rest for
            sensitive fields, hashed passwords (bcrypt), rate limiting
            on authentication endpoints, and access controls on
            internal systems. No system is perfectly secure;
            we&apos;ll notify you and the relevant regulator if a
            breach affects you.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. When
            we do, we&apos;ll update the &ldquo;Last updated&rdquo;
            date at the top. For material changes, we&apos;ll also
            notify you by email or an in-app notice.
          </p>
        </Section>

        <Section title="13. Contact us">
          <p>
            Privacy questions or data subject requests:{' '}
            <a
              href="mailto:privacy@afrizonemart.com"
              className="text-navy underline"
            >
              privacy@afrizonemart.com
            </a>
            <br />
            General support:{' '}
            <a
              href="mailto:support@afrizonemart.com"
              className="text-navy underline"
            >
              support@afrizonemart.com
            </a>
            <br />
            Postal address: Afrizonemart Limited, Lagos, Nigeria.
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

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 pt-2">
      <h3 className="font-raleway text-base font-semibold text-navy">
        {title}
      </h3>
      {children}
    </div>
  );
}
