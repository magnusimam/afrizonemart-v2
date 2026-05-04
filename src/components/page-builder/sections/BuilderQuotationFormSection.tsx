import { QuotationFormSection } from '@/components/sections/QuotationFormSection';

/// Delegates to the existing QuotationFormSection — the underlying
/// component owns its copy, form fields, and submit handler. The
/// wrapper exists so the page builder can place the section in the
/// rendered order. Heading overrides can be added later by refactoring
/// QuotationFormSection to accept props.
export function BuilderQuotationFormSection() {
  return <QuotationFormSection />;
}
