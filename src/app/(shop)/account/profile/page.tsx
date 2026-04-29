import { AccountSidebar } from '@/components/account/AccountSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { COUNTRIES, COUNTRY_CODES } from '@/lib/countries';
import { MOCK_USER } from '@/lib/mock-data';

export default function ProfilePage() {
  return (
    <>
      <main className="bg-page pb-12">
        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="account:sidebar" fallback={null}>
                <AccountSidebar
                  active="/account/profile"
                  userFirstName={MOCK_USER.firstName}
                  userLastName={MOCK_USER.lastName}
                />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9">
              <header>
                <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                  Profile Settings
                </h1>
                <p className="font-sans text-sm text-muted md:text-base">
                  Manage your personal information, security, and preferences.
                </p>
              </header>

              <Section title="Personal Information">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="First Name">
                    <input
                      type="text"
                      defaultValue={MOCK_USER.firstName}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      type="text"
                      defaultValue={MOCK_USER.lastName}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      defaultValue={MOCK_USER.email}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      type="tel"
                      defaultValue={MOCK_USER.phone}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title="Region & Currency"
                caption="Personalises prices, delivery options, and language across the site."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Country">
                    <select defaultValue={MOCK_USER.country} className={inputClass}>
                      {COUNTRY_CODES.map((c) => (
                        <option key={c} value={c}>
                          {COUNTRIES[c].flag} {COUNTRIES[c].name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Currency">
                    <select className={inputClass} defaultValue="NGN">
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="KES">KES — Kenyan Shilling</option>
                      <option value="ZAR">ZAR — South African Rand</option>
                      <option value="EGP">EGP — Egyptian Pound</option>
                      <option value="GHS">GHS — Ghanaian Cedi</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </Field>
                  <Field label="Language">
                    <select className={inputClass} defaultValue="en">
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                      <option value="sw">Kiswahili</option>
                      <option value="pt">Português</option>
                    </select>
                  </Field>
                  <Field label="Time Zone">
                    <select className={inputClass} defaultValue="Africa/Lagos">
                      <option>Africa/Lagos</option>
                      <option>Africa/Nairobi</option>
                      <option>Africa/Cairo</option>
                      <option>Africa/Johannesburg</option>
                      <option>Africa/Accra</option>
                    </select>
                  </Field>
                </div>
              </Section>

              <Section title="Security">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Current Password">
                    <input type="password" placeholder="••••••••" className={inputClass} />
                  </Field>
                  <Field label="New Password">
                    <input type="password" placeholder="At least 8 characters" className={inputClass} />
                  </Field>
                </div>
                <button
                  type="button"
                  className="mt-3 self-start rounded-btn border-2 border-navy bg-white px-5 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                >
                  Update Password
                </button>
              </Section>

              <Section title="Notification Preferences">
                <div className="flex flex-col gap-3">
                  <Toggle label="Order updates (email)" defaultChecked />
                  <Toggle label="Order updates (SMS)" defaultChecked />
                  <Toggle label="Order updates (WhatsApp)" />
                  <Toggle label="Promotions and deals" defaultChecked />
                  <Toggle label="Pan-African newsletter" defaultChecked />
                </div>
              </Section>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/5 p-5">
                <div>
                  <p className="font-raleway text-sm font-bold text-danger">
                    Delete Account
                  </p>
                  <p className="font-sans text-xs text-charcoal">
                    Permanently remove your account and order history.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-btn border border-danger bg-white px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-danger hover:bg-danger hover:text-white"
                >
                  Delete Account
                </button>
              </div>

              <button
                type="button"
                className="self-start rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold uppercase tracking-btn text-white shadow-card hover:bg-amber hover:text-navy"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const inputClass =
  'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal placeholder:text-muted focus:border-navy focus:outline-none';

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-white p-5 shadow-card md:p-6">
      <header>
        <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">{title}</h2>
        {caption ? (
          <p className="mt-1 font-sans text-sm text-muted">{caption}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-card border border-border bg-white p-3">
      <span className="font-sans text-sm text-charcoal">{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 cursor-pointer accent-navy"
      />
    </label>
  );
}
