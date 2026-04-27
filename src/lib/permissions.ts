/**
 * Capability-based permission model — frontend mirror of
 * `afrizonemart-api/src/lib/permissions.ts`. Kept manually in sync
 * until we extract a shared workspace package.
 */

export type Capability =
  | 'orders.read'
  | 'orders.write'
  | 'orders.refund'
  | 'products.read'
  | 'products.write'
  | 'categories.write'
  | 'reviews.moderate'
  | 'customers.read'
  | 'customers.write'
  | 'staff.manage'
  | 'uploads.write'
  | 'settings.write'
  | 'reports.read';

export type StaffRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export const CAPABILITY_LABELS: Record<Capability, { domain: string; label: string }> = {
  'orders.read': { domain: 'Orders', label: 'View orders' },
  'orders.write': { domain: 'Orders', label: 'Update orders & status' },
  'orders.refund': { domain: 'Orders', label: 'Issue refunds' },
  'products.read': { domain: 'Catalog', label: 'View products' },
  'products.write': { domain: 'Catalog', label: 'Create / edit / delete products' },
  'categories.write': { domain: 'Catalog', label: 'Manage categories' },
  'reviews.moderate': { domain: 'Catalog', label: 'Moderate reviews' },
  'customers.read': { domain: 'People', label: 'View customers' },
  'customers.write': { domain: 'People', label: 'Edit customer profiles' },
  'staff.manage': { domain: 'People', label: 'Add / remove staff & change roles' },
  'uploads.write': { domain: 'Media', label: 'Upload images & assets' },
  'settings.write': { domain: 'Settings', label: 'Edit store settings' },
  'reports.read': { domain: 'Reports', label: 'View sales & inventory reports' },
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  CUSTOMER: 'Standard buyer. Can browse, place orders, leave reviews.',
  SELLER:
    'Vendor on the marketplace. Can manage their own products and view their own orders. Cannot touch other sellers or platform settings.',
  ADMIN:
    'Full platform access. Can manage everything — products, orders, customers, refunds, other staff. Use sparingly.',
};
