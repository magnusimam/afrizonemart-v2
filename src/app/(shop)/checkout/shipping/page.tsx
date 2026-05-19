'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Home as HomeIcon } from 'lucide-react';
import { AddressForm } from '@/components/checkout/AddressForm';
import { CheckoutOrderSummary } from '@/components/checkout/CheckoutOrderSummary';
import { LiveShippingQuoteSelector } from '@/components/checkout/LiveShippingQuoteSelector';
import { NotificationPrefs } from '@/components/checkout/NotificationPrefs';
import { SavedAddressPicker, type SelectedAddress } from '@/components/checkout/SavedAddressPicker';
import { CheckoutProgress, type CheckoutStep } from '@/components/cart/CheckoutProgress';
import { useCheckoutStore, type ShippingAddress } from '@/stores/checkoutStore';
import { useAuthStore } from '@/stores/authStore';
import {
  selectCartTotalAmount,
  selectCartTotalQuantity,
  useCartStore,
} from '@/stores/cartStore';
import { SafeBoundary } from '@/components/common/SafeBoundary';
import {
  listAddresses,
  updateAddress,
  type SavedAddress,
} from '@/lib/api/addresses';
import type { ShippingQuote } from '@/lib/api/shipping';

const steps: CheckoutStep[] = [
  { num: 1, label: 'Cart', status: 'done' },
  { num: 2, label: 'Shipping', status: 'active' },
  { num: 3, label: 'Payment', status: 'pending' },
];

export default function ShippingPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const totalQuantity = useCartStore(selectCartTotalQuantity);
  const totalAmount = useCartStore(selectCartTotalAmount);

  const storeShipping = useCheckoutStore((s) => s.shipping);
  const selectedQuote = useCheckoutStore((s) => s.selectedQuote);
  const notify = useCheckoutStore((s) => s.notify);
  const setShipping = useCheckoutStore((s) => s.setShipping);
  const setSelectedQuote = useCheckoutStore((s) => s.setSelectedQuote);
  const setShippingRateId = useCheckoutStore((s) => s.setShippingRateId);
  const setNotify = useCheckoutStore((s) => s.setNotify);

  const [draft, setDraft] = useState<ShippingAddress | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /// Tracker #52 — saved-address picker. Logged-in customers see
  /// their previously-used addresses as tickable cards above the
  /// AddressForm. Default address is pre-selected on mount. Anonymous
  /// users skip this block entirely and go straight to the form.
  const accessToken = useAuthStore((s) => s.accessToken);
  const authedUser = useAuthStore((s) => s.user);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<SelectedAddress | null>(null);
  /// Bumps every time the user picks a different saved address. Used
  /// as React `key` on AddressForm so it remounts with fresh initial
  /// values — AddressForm's internal state only seeds from `initial`
  /// once on mount, so a key change is the cleanest way to re-seed it.
  const [formKey, setFormKey] = useState(0);
  const [busyDefaultId, setBusyDefaultId] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setSavedAddresses([]);
      setSelectedAddressId('new');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { items: addrs } = await listAddresses(accessToken);
        if (cancelled) return;
        setSavedAddresses(addrs);
        if (addrs.length === 0) {
          setSelectedAddressId('new');
          return;
        }
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        setSelectedAddressId(def.id);
        /// Pre-populate draft so the Continue button + the shipping
        /// quote both have something to work with as soon as the
        /// page settles. Customer can still edit; AddressForm's
        /// onChange will overwrite.
        setDraft(savedToShipping(def));
        setFormKey((k) => k + 1);
      } catch {
        if (cancelled) return;
        /// Fail soft — if the addresses endpoint is down, fall back to
        /// the empty form. Checkout must never block on this.
        setSavedAddresses([]);
        setSelectedAddressId('new');
      }
    })();
    return () => {
      cancelled = true;
    };
    // savedToShipping reads authedUser?.email — declaring it as a dep
    // would re-fetch when the email object reference changes; we don't
    // want that. The closure captures the current user, which is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  /// Maps a SavedAddress (compact: fullName + single addressLine) to
  /// the ShippingAddress shape AddressForm expects (firstName /
  /// lastName / street / region / etc). region + postalCode are left
  /// blank — the form is editable so the customer fills them if the
  /// carrier needs them.
  function savedToShipping(a: SavedAddress): ShippingAddress {
    const parts = (a.fullName ?? '').trim().split(/\s+/);
    return {
      firstName: parts[0] ?? '',
      lastName: parts.slice(1).join(' '),
      email: authedUser?.email ?? '',
      phone: a.phone ?? '',
      country: a.country ?? 'NG',
      region: '',
      city: a.city ?? '',
      street: a.addressLine ?? '',
      apartment: '',
      postalCode: '',
      instructions: '',
    };
  }

  const selectedSaved =
    typeof selectedAddressId === 'string' && selectedAddressId !== 'new'
      ? savedAddresses.find((a) => a.id === selectedAddressId) ?? null
      : null;

  /// Initial values for the AddressForm. Order of precedence:
  /// 1. The saved address the customer picked (mapped to ShippingAddress shape).
  /// 2. Whatever's persisted in the checkoutStore from a previous visit.
  /// 3. Undefined (empty form).
  const formInitial: Partial<ShippingAddress> | undefined = selectedSaved
    ? savedToShipping(selectedSaved)
    : storeShipping ?? undefined;

  const handlePickAddress = (id: SelectedAddress) => {
    setSelectedAddressId(id);
    setFormKey((k) => k + 1);
    if (id === 'new') {
      /// Empty form. Customer types from scratch, AddressForm's
      /// onChange will populate `draft` as they go.
      setDraft(null);
      return;
    }
    /// Saved address picked. Pre-populate `draft` so the Continue
    /// button enables immediately and the quote selector sees a
    /// destination right away — without waiting for the customer to
    /// touch the form. They can still edit anything; AddressForm's
    /// onChange will overwrite `draft` on any change.
    const picked = savedAddresses.find((a) => a.id === id);
    if (picked) setDraft(savedToShipping(picked));
  };

  const handleMakeDefault = async (id: string) => {
    if (!accessToken) return;
    setBusyDefaultId(id);
    try {
      await updateAddress(accessToken, id, { isDefault: true });
      /// Optimistic local update so the chip + radio flip instantly.
      setSavedAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id })),
      );
    } catch {
      /// Silent fail — the next page load will fetch fresh state.
    } finally {
      setBusyDefaultId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!selectedQuote) return;
    setShipping(draft);
    router.push('/checkout/payment');
  };

  const handleQuoteChange = (q: ShippingQuote | null) => {
    setSelectedQuote(q ?? undefined);
    setShippingRateId(q?.rateId ?? undefined);
  };

  // Destination passed to the quote selector — comes from the form
  // draft if the user is editing, otherwise the saved store value.
  const destForQuotes = (() => {
    const src = draft ?? storeShipping ?? null;
    if (!src?.country) return null;
    return {
      country: src.country.toUpperCase(),
      city: src.city || undefined,
      state: src.region || undefined,
      postcode: src.postalCode || undefined,
      addressLine: [src.street, src.apartment].filter(Boolean).join(', ') || undefined,
    };
  })();
  const cartItemsForQuote = items.map((i) => ({ productId: i.productId, qty: i.quantity }));

  const isEmpty = hydrated && items.length === 0;

  return (
    <>
      <main className="bg-page pb-12">
        <nav aria-label="Breadcrumb" className="border-b border-border bg-page">
          <ol className="mx-auto flex max-w-site items-center gap-1.5 px-4 py-3 font-sans text-xs text-muted md:text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-navy">
                <HomeIcon size={14} aria-hidden /> Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <Link href="/cart" className="hover:text-navy">
                Cart
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight size={12} className="text-border" />
            </li>
            <li>
              <span className="font-medium text-charcoal">Shipping</span>
            </li>
          </ol>
        </nav>

        <div className="bg-white">
          <div className="mx-auto max-w-site px-4 py-8 md:py-10">
            <div className="mb-6 flex flex-col items-center gap-2 text-center md:mb-8">
              <h1 className="font-raleway text-3xl font-bold text-navy md:text-4xl">
                Shipping Details
              </h1>
              <p className="font-sans text-sm text-muted md:text-base">
                Where should we deliver your order?
              </p>
            </div>

            <div className="mb-8 md:mb-10">
              <SafeBoundary name="checkout:progress" fallback={null}>
                <CheckoutProgress steps={steps} />
              </SafeBoundary>
            </div>

            {isEmpty ? (
              <div className="rounded-card border border-border bg-white p-10 text-center">
                <p className="mb-4 font-sans text-base text-muted">
                  Your cart is empty. Add some products before checking out.
                </p>
                <Link
                  href="/"
                  className="inline-block rounded-btn bg-navy px-6 py-3 font-raleway text-xs font-bold uppercase tracking-btn text-white hover:bg-amber hover:text-navy"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <div className="flex flex-col gap-6 lg:col-span-8 lg:gap-8">
                  {savedAddresses.length > 0 && (
                    <Section
                      title="Use a saved address"
                      caption="Pick one to pre-fill, or add a new one below."
                    >
                      <SafeBoundary name="checkout:saved-addresses" fallback={null}>
                        <SavedAddressPicker
                          addresses={savedAddresses}
                          selectedId={selectedAddressId}
                          onSelect={handlePickAddress}
                          onMakeDefault={handleMakeDefault}
                          busyDefaultId={busyDefaultId}
                        />
                      </SafeBoundary>
                    </Section>
                  )}

                  <Section
                    title={
                      selectedSaved
                        ? 'Confirm or tweak the address'
                        : 'Delivery Address'
                    }
                    caption={
                      selectedSaved
                        ? "We'll ship to these details — change anything you need."
                        : 'Where should this go?'
                    }
                  >
                    <SafeBoundary name="checkout:address-form">
                      <AddressForm
                        key={formKey}
                        initial={formInitial}
                        onChange={setDraft}
                      />
                    </SafeBoundary>
                  </Section>

                  <Section
                    title="Delivery Method"
                    caption="Live rates based on your address and cart weight."
                  >
                    <SafeBoundary
                      name="checkout:delivery-method"
                      fallback={
                        <p className="font-sans text-sm text-muted">
                          Delivery options couldn&apos;t load. Refresh to try again.
                        </p>
                      }
                    >
                      <LiveShippingQuoteSelector
                        destination={destForQuotes}
                        items={cartItemsForQuote}
                        selectedRateId={selectedQuote?.rateId ?? null}
                        selectedProvider={selectedQuote?.provider ?? null}
                        onChange={handleQuoteChange}
                      />
                    </SafeBoundary>
                  </Section>

                  <Section
                    title="Notifications"
                    caption="Order updates from dispatch to delivery."
                  >
                    <SafeBoundary name="checkout:notification-prefs" fallback={null}>
                      <NotificationPrefs value={notify} onChange={setNotify} />
                    </SafeBoundary>
                  </Section>

                  <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href="/cart"
                      className="rounded-btn border-2 border-navy bg-white px-5 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-navy transition-colors hover:bg-navy hover:text-white sm:text-sm"
                    >
                      ← Back to Cart
                    </Link>
                    <button
                      type="submit"
                      disabled={!draft || !selectedQuote}
                      className="rounded-btn bg-navy px-6 py-3 text-center font-raleway text-xs font-bold uppercase tracking-btn text-white shadow-card transition-colors hover:bg-amber hover:text-navy disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                      title={
                        !draft
                          ? 'Fill in the address first'
                          : !selectedQuote
                            ? 'Pick a delivery method'
                            : ''
                      }
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-4">
                  <SafeBoundary
                    name="checkout:order-summary"
                    fallback={
                      <div className="rounded-card border border-amber bg-amber/10 p-4 font-sans text-sm text-charcoal">
                        Order summary couldn&apos;t render. Refresh the page.
                      </div>
                    }
                  >
                    <CheckoutOrderSummary
                      items={hydrated ? items : []}
                      subtotal={hydrated ? totalAmount : 0}
                      itemCount={hydrated ? totalQuantity : 0}
                    />
                  </SafeBoundary>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

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
    <section className="rounded-card border border-border bg-white p-5 shadow-card md:p-6">
      <header className="mb-4 md:mb-5">
        <h2 className="font-raleway text-lg font-bold text-navy md:text-xl">
          {title}
        </h2>
        {caption ? (
          <p className="mt-1 font-sans text-sm text-muted">{caption}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
