/**
 * Phase 11.3 (audit M6) — single source for password-strength rules.
 *
 * Mirrors `afrizonemart-api/src/modules/auth/auth.schema.ts`. The
 * server is the authoritative gate; this client-side helper only
 * exists so users see a useful inline error before round-tripping
 * a 400. Keep the two implementations in sync.
 */

export const PASSWORD_RULE_HINT =
  'At least 8 characters, plus a number, symbol, or uppercase letter.';

const STRONG_PASSWORD_MESSAGE =
  'Password must include a number, a symbol, or an uppercase letter.';

/**
 * Returns null if the password passes, otherwise a customer-facing
 * error string. Match the shape of the server's zod refinement so
 * the rule can be moved cleanly into a shared workspace package.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (password.length > 128) return 'Password is too long (max 128 characters).';
  if (!/[0-9]/.test(password) && !/[A-Z]/.test(password) && !/[^A-Za-z0-9]/.test(password)) {
    return STRONG_PASSWORD_MESSAGE;
  }
  return null;
}
