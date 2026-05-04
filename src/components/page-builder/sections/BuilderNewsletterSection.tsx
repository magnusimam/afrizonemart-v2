import { NewsletterSection } from '@/components/sections/NewsletterSection';

/// Delegates to the existing NewsletterSection — the admin currently
/// has no editable knobs here (the underlying section owns its copy
/// and form behaviour). The wrapper exists so the page builder can
/// place the section in the rendered order. If the user later wants
/// to override the headline, refactor NewsletterSection to accept a
/// prop (mirroring the HeroSlider pattern).
export function BuilderNewsletterSection() {
  return <NewsletterSection />;
}
