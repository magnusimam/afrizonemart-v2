const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/**
 * Fire-and-forget product view tracker for the storefront. Mirrors
 * the mobile helper — never throws, never blocks the PDP. Server
 * returns 204 regardless of dedup.
 *
 * `keepalive: true` so the request survives a navigation away from
 * the PDP before the response lands (e.g. user clicks Add to Cart
 * immediately after the 2s timer fires).
 */
export async function recordProductView(
  productSlug: string,
  sessionId: string,
  signal?: AbortSignal,
): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/views`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productSlug, sessionId }),
      keepalive: true,
      signal,
    });
  } catch {
    /// Network failure / abort. Swallow — trending is best-effort and
    /// the PDP can't do anything useful about a failed analytics ping.
  }
}
