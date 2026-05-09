'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import {
  createGoogleChallenge,
  friendlyAuthError,
  signInWithGoogle,
  type AuthResult,
} from '@/lib/api/auth';

/**
 * Google Identity Services (GIS) "One Tap" + branded button.
 * Lazy-loaded — when NEXT_PUBLIC_GOOGLE_CLIENT_ID is empty the button
 * is hidden, so the storefront stays functional without setup.
 *
 * On a successful Google flow we hand the ID token to our API and let
 * `signInWithGoogle` issue our own JWT + refresh cookie.
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: 'popup' | 'redirect';
            nonce?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
            },
          ) => void;
        };
      };
    };
  }
}

interface Props {
  onSuccess: (result: AuthResult) => void;
  onError?: (message: string) => void;
  /** Defaults to "signin_with" — pass "signup_with" on the register page. */
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export function GoogleSignInButton({ onSuccess, onError, text = 'continue_with' }: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current) return;
    if (!window.google?.accounts?.id) return;
    let cancelled = false;

    // Phase 11.3 (audit H7): fetch a single-use nonce from the API
    // before initializing GIS. We bind the popup credential to this
    // nonce so a captured ID token is unreplayable — the server
    // consumes the row atomically and rejects mismatches/replays.
    (async () => {
      let nonce: string;
      try {
        const challenge = await createGoogleChallenge();
        nonce = challenge.nonce;
      } catch {
        onError?.('Could not start Google sign-in. Please try again.');
        return;
      }
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce,
        callback: async (response) => {
          try {
            setBusy(true);
            const result = await signInWithGoogle(response.credential, nonce);
            onSuccess(result);
          } catch (err) {
            onError?.(friendlyAuthError(err, 'Could not sign in with Google.'));
          } finally {
            setBusy(false);
          }
        },
        ux_mode: 'popup',
      });

      // Render the styled button GIS owns (we don't draw it ourselves
      // because the Google brand guide requires their pixel-perfect chip).
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text,
        logo_alignment: 'left',
        width: 320,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [scriptReady, clientId, text, onSuccess, onError]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <div className="relative flex justify-center">
        <div ref={buttonRef} aria-busy={busy} />
        {busy && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70 font-sans text-xs text-charcoal">
            Signing in…
          </span>
        )}
      </div>
    </>
  );
}
