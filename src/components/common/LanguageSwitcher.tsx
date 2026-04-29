'use client';

import { Globe } from 'lucide-react';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ha', label: 'Hausa' },
  { code: 'yo', label: 'Yorùbá' },
  { code: 'ig', label: 'Igbo' },
  { code: 'zu', label: 'isiZulu' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh-CN', label: '中文' },
];

function setGoogTrans(lang: string) {
  // Google's widget reads /en/<lang> from the `googtrans` cookie.
  const value = lang === 'en' ? '/en/en' : `/en/${lang}`;
  // Set on apex + current host so it survives refresh.
  document.cookie = `googtrans=${value}; path=/`;
  if (typeof window !== 'undefined') {
    document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
    window.location.reload();
  }
}

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-input px-2 py-1 font-sans text-xs text-charcoal hover:bg-page"
        aria-label="Change language"
      >
        <Globe size={14} aria-hidden />
        <span>Language</span>
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 max-h-72 w-44 overflow-y-auto rounded-card border border-border bg-white shadow-card"
          role="menu"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setGoogTrans(l.code)}
              className="block w-full px-3 py-2 text-left font-sans text-xs text-charcoal hover:bg-page"
              role="menuitem"
            >
              {l.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
