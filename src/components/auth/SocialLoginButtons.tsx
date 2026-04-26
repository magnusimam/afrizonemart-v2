const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.85 0-5.27-1.92-6.13-4.52H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.87 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.46.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.78.42 3.46 1.18 4.96l3.69-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.46 2.1 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.69 2.84C6.73 7.3 9.15 5.38 12 5.38z" />
  </svg>
);

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.13 8.44 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99C18.34 21.13 22 16.99 22 12z" />
  </svg>
);

const AppleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M16.365 1.43c0 1.14-.41 2.21-1.18 3.07-.93 1.04-2.07 1.65-3.31 1.55-.13-1.07.34-2.21 1.13-3.06.84-.93 2.27-1.59 3.36-1.56zM20.45 17.4c-.49 1.14-.72 1.65-1.36 2.65-.88 1.4-2.13 3.14-3.67 3.16-1.36.02-1.71-.88-3.56-.86-1.85.02-2.24.88-3.6.86-1.54-.02-2.72-1.6-3.6-2.99C2.34 16.4 2.05 11.43 4.11 8.84c1.45-1.83 3.74-2.91 5.92-2.91 2.21 0 3.6 1.21 5.43 1.21 1.78 0 2.86-1.21 5.42-1.21 1.95 0 4.01 1.06 5.49 2.9-4.83 2.65-4.04 9.55.07 8.57z" />
  </svg>
);

interface SocialLoginButtonsProps {
  mode: 'sign-in' | 'sign-up';
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const verb = mode === 'sign-in' ? 'Sign in' : 'Sign up';

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-btn border border-border bg-white py-2.5 font-raleway text-sm font-semibold text-charcoal transition-colors hover:border-navy hover:bg-page"
      >
        <GoogleIcon />
        {verb} with Google
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-btn border border-border bg-white py-2.5 font-raleway text-xs font-semibold text-charcoal transition-colors hover:border-navy hover:bg-page md:text-sm"
        >
          <FacebookIcon />
          Facebook
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-btn border border-border bg-white py-2.5 font-raleway text-xs font-semibold text-charcoal transition-colors hover:border-navy hover:bg-page md:text-sm"
        >
          <AppleIcon />
          Apple
        </button>
      </div>
    </div>
  );
}
