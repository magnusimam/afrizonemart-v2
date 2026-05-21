/**
 * Capability-based permission model — storefront side.
 *
 * **Source of truth lives in `afrizonemart-api/src/lib/permissions.ts`.**
 * That file defines every capability the platform recognises, with its
 * domain + human label. Admin UIs (the "Add staff" dialog + the
 * "Edit existing staff" permissions matrix on /admin/staff) fetch the
 * canonical list at runtime via `GET /api/admin/staff/permissions` —
 * adding a new capability there immediately makes it tickable in both
 * UIs with no storefront redeploy.
 *
 * What this file used to do (until 2026-05-21): mirror the API's
 * Capability union + CAPABILITY_LABELS dictionary. That manual sync
 * burnt us — the user added an admin section, forgot to update both
 * files, and the new permission never appeared in the staff dialog.
 *
 * What this file does NOW:
 *  - `Capability` is a loose `string` alias — no compile-time gate on
 *    capability literals (typos like `'orderss.refund'` won't be caught
 *    at compile time, but they're easy to spot at runtime — the gate
 *    just always denies). The trade-off is worth it: zero sync cost
 *    when adding a new capability.
 *  - `StaffRole`, `effectiveCapabilities`, `hasCapability`,
 *    `ROLE_DESCRIPTIONS` remain client-side because they're used by
 *    the sidebar filter + admin dashboard tile filter — they need to
 *    run synchronously on the client without an API hop.
 *  - `effectiveCapabilities()` no longer enumerates the full
 *    capability list. For ADMIN it returns a wildcard set whose
 *    `.has()` always returns true, so consumers like
 *    `caps.has('anything.new')` Just Work without us having to know
 *    every capability the API has defined.
 */

/// Plain string — the source of truth is the API. Loose typing here
/// is intentional; see file header.
export type Capability = string;

export type StaffRole = 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'STAFF';

/// SELLER capabilities are hardcoded here because they're a role-level
/// default, not a per-section grant — same logic as the API's
/// `ROLE_CAPABILITIES.SELLER`. If you change them, also update the API.
const SELLER_CAPABILITIES: readonly Capability[] = [
  'orders.read',
  'products.read',
  'products.write',
  'uploads.write',
] as const;

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  CUSTOMER: 'Standard buyer. Can browse, place orders, leave reviews.',
  SELLER:
    'Vendor on the marketplace. Can manage their own products and view their own orders. Cannot touch other sellers or platform settings.',
  ADMIN:
    'Full platform access. Can manage everything — products, orders, customers, refunds, other staff. Use sparingly.',
  STAFF:
    'Per-user-permissions account. Each staff member only sees the admin sections you grant them. Used for interns, contractors, and scoped employees.',
};

/**
 * Set-like interface returned by `effectiveCapabilities`. We don't
 * return a real `Set<Capability>` because for ADMIN we want a
 * wildcard "yes to everything" without having to know every
 * capability the API has defined. Consumers only ever call `.has()`
 * on this — never iterate, never check `.size` — so a narrow
 * interface is enough.
 */
export interface CapabilitySet {
  has(capability: Capability): boolean;
}

/// Always-true Set. Used for ADMIN where every gate must succeed.
const WILDCARD_SET: CapabilitySet = { has: () => true };
/// Always-false Set. Used for CUSTOMER (default role).
const EMPTY_SET: CapabilitySet = { has: () => false };

/**
 * Resolve a user's effective capability set.
 *
 *  - ADMIN  → wildcard (every `caps.has(...)` returns true).
 *  - STAFF  → exactly what `User.permissions[]` says. Implicit grant:
 *             `products.image-only` co-grants `uploads.write` so the
 *             intern queue can actually upload images. Mirrors the
 *             same implicit grant in the API resolver.
 *  - SELLER → hardcoded `SELLER_CAPABILITIES` (role default).
 *  - CUSTOMER → empty.
 */
export function effectiveCapabilities(
  role: StaffRole,
  userPermissions: string[] | null | undefined,
): CapabilitySet {
  if (role === 'ADMIN') return WILDCARD_SET;
  if (role === 'STAFF') {
    const grants = new Set<Capability>(userPermissions ?? []);
    if (grants.has('products.image-only')) grants.add('uploads.write');
    return grants;
  }
  if (role === 'SELLER') return new Set<Capability>(SELLER_CAPABILITIES);
  return EMPTY_SET;
}

export function hasCapability(
  role: StaffRole,
  userPermissions: string[] | null | undefined,
  capability: Capability,
): boolean {
  return effectiveCapabilities(role, userPermissions).has(capability);
}
