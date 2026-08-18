import { redirect } from 'next/navigation';

/// Merged into /admin/submissions (2026-08-01) — one entry point for
/// every intern-sourced content type instead of a separate page per
/// type. Kept as a redirect so old bookmarks/links still land
/// somewhere useful.
export default function DocumentSubmissionsRedirect() {
  redirect('/admin/submissions?tab=document');
}
