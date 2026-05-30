/**
 * Anonymous analytics session ID — opaque, non-PII identifier minted
 * on first visit and persisted in localStorage. Used by the
 * server-side view tracker to soft-dedup rapid reloads from the
 * same browser without requiring sign-in.
 *
 * Not PII. Not tied to a user account. A user logging in / out
 * keeps the same session id — trending should count interest, not
 * auth state.
 *
 * SSR-safe: every accessor checks for `window` before touching
 * `localStorage`. On the server we return `null` and the caller
 * skips logging — analytics is a browser concern.
 */

const STORAGE_KEY = 'afrizone.analytics.sessionId.v1';

let cached: string | null = null;

function generateId(): string {
  /// Uniqueness across a user's browsers over a few years is enough;
  /// crypto-grade is overkill for analytics dedup. Math.random +
  /// timestamp keeps collision odds vanishingly small.
  const rand = () =>
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10);
  return `s_${Date.now().toString(36)}_${rand()}`;
}

/// Returns the persisted session id, minting one if first visit.
/// Returns `null` on the server (no localStorage) — callers should
/// no-op rather than crash.
export function getOrCreateSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  if (cached) return cached;
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) {
      cached = existing;
      return existing;
    }
  } catch {
    /// localStorage disabled (Safari private mode, blocked) — fall
    /// through to a memory-only id. Re-mints on next page load but
    /// dedup still works within the same session.
  }
  const fresh = generateId();
  cached = fresh;
  try {
    window.localStorage.setItem(STORAGE_KEY, fresh);
  } catch {
    /// Same story — keep going with the in-memory value.
  }
  return fresh;
}
