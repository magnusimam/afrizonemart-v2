'use client';

import { useEffect } from 'react';

/**
 * Pragmatic v1 i18n: load Google Translate's web widget so visitors can
 * read the storefront in their browser's preferred language without us
 * shipping per-locale strings.
 *
 * The widget injects a `#google_translate_element` host where Google
 * mounts its dropdown. We hide the default UI via CSS in globals.css
 * and expose translation through our own `<LanguageSwitcher>`, which
 * sets the `googtrans` cookie that the widget reads.
 *
 * This is a stopgap — proper i18n (Next.js app/[locale] + ICU bundles)
 * lands as a Phase 11 follow-up. See ARCHITECTURE_TRACKER.md.
 */
export function GoogleTranslate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-translate-script')) return;

    // Google's loader expects a global init function.
    (window as unknown as { googleTranslateElementInit: () => void }).googleTranslateElementInit =
      function googleTranslateElementInit() {
        const w = window as unknown as {
          google?: {
            translate?: {
              TranslateElement: new (opts: object, host: string) => void;
            };
          };
        };
        if (!w.google?.translate?.TranslateElement) return;
        new w.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,fr,ar,sw,pt,es,de,zh-CN,ha,yo,ig,zu,am',
            autoDisplay: false,
            layout: 0, // SIMPLE
          },
          'google_translate_element',
        );
      };

    const s = document.createElement('script');
    s.id = 'google-translate-script';
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      id="google_translate_element"
      aria-hidden
      style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}
    />
  );
}
