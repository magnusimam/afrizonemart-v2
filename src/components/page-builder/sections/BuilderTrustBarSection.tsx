import { TrustBarSection } from '@/components/sections/TrustBarSection';

/// Delegates to the existing TrustBarSection. Admin can later
/// override the items list by adding an `items` prop to TrustBarSection
/// and threading it through; for now the visible copy stays code-owned
/// to preserve the original design 1:1.
export function BuilderTrustBarSection() {
  return <TrustBarSection />;
}
