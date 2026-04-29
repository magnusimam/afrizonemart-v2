import { Edit2, MapPin, Plus, Trash2 } from 'lucide-react';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import { getCountry } from '@/lib/countries';
import { MOCK_ADDRESSES, MOCK_USER } from '@/lib/mock-data';

export default function AddressesPage() {
  return (
    <>
      <main className="bg-page pb-12">
        <div className="mx-auto max-w-site px-4 py-6 md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-3">
              <SafeBoundary name="account:sidebar" fallback={null}>
                <AccountSidebar
                  active="/account/addresses"
                  userFirstName={MOCK_USER.firstName}
                  userLastName={MOCK_USER.lastName}
                />
              </SafeBoundary>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-9">
              <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="font-raleway text-2xl font-bold text-navy md:text-3xl">
                    Saved Addresses
                  </h1>
                  <p className="font-sans text-sm text-muted md:text-base">
                    {MOCK_ADDRESSES.length} address{MOCK_ADDRESSES.length === 1 ? '' : 'es'} on file
                  </p>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-btn bg-navy px-4 py-2 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  <Plus size={14} aria-hidden />
                  Add New Address
                </button>
              </header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                {MOCK_ADDRESSES.map((a) => {
                  const c = getCountry(a.country);
                  return (
                    <article
                      key={a.id}
                      className={`flex flex-col gap-3 rounded-card border-2 bg-white p-5 shadow-card md:p-6 ${
                        a.isDefault ? 'border-navy' : 'border-border'
                      }`}
                    >
                      <header className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-navy" aria-hidden />
                          <span className="font-raleway text-base font-bold text-navy">
                            {a.label}
                          </span>
                          {a.isDefault ? (
                            <span className="rounded-input bg-amber px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Edit ${a.label}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/10"
                          >
                            <Edit2 size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${a.label}`}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-danger transition-colors hover:bg-danger/10"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </header>

                      <div className="flex flex-col gap-1 font-sans text-sm leading-relaxed text-charcoal">
                        <span className="font-bold text-navy">{a.fullName}</span>
                        <span>{a.phone}</span>
                        <span>
                          {a.street}
                          {a.apartment ? `, ${a.apartment}` : ''}
                        </span>
                        <span>
                          {a.city}, {a.region}
                          {a.postalCode ? ` ${a.postalCode}` : ''}
                        </span>
                        <span>
                          {c?.flag} {c?.name ?? a.country}
                        </span>
                      </div>

                      {!a.isDefault ? (
                        <button
                          type="button"
                          className="self-start rounded-btn border border-navy bg-white px-4 py-1.5 font-raleway text-xs font-bold uppercase tracking-btn text-navy hover:bg-navy hover:text-white"
                        >
                          Set as Default
                        </button>
                      ) : null}
                    </article>
                  );
                })}

                <button
                  type="button"
                  className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-border bg-white p-6 text-navy transition-colors hover:border-navy hover:bg-page"
                >
                  <Plus size={28} aria-hidden />
                  <span className="font-raleway text-sm font-bold uppercase tracking-btn">
                    Add New Address
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
