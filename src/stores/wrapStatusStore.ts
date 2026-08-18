import { useEffect } from 'react';
import { create } from 'zustand';
import { getWrapMe } from '@/lib/api/wrap';
import { useAuthStore } from '@/stores/authStore';

/**
 * Shared "is the viewer's wrap live?" signal.
 *
 * The wrap is hidden until the Dec 1 publish cron sets it live. All
 * four reveal surfaces (header pill, home banner, login popup,
 * dashboard card) key off this single store so we hit
 * GET /api/wrap/me once per session, not four times. `ready` is only
 * ever true for a `status: 'ready'` response — i.e. published +
 * visible. Everything else (pending / locked / opted-out / guest)
 * stays invisible.
 */

interface WrapStatusState {
  year: number | null;
  ready: boolean;
  loaded: boolean;
  loading: boolean;
  ensureLoaded: () => Promise<void>;
}

const useWrapStatusStore = create<WrapStatusState>((set, get) => ({
  year: null,
  ready: false,
  loaded: false,
  loading: false,
  ensureLoaded: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try {
      const r = await getWrapMe();
      set({
        year: r.year,
        ready: r.status === 'ready',
        loaded: true,
        loading: false,
      });
    } catch {
      // 401 (guest / expired) or any error → stay hidden.
      set({ ready: false, loaded: true, loading: false });
    }
  },
}));

/**
 * Hook for the reveal surfaces. Loads the status once a user is
 * present (guests never trigger the call) and returns whether to
 * show the reveal + which year to link to.
 */
export function useWrapReveal(): { ready: boolean; year: number | null } {
  const user = useAuthStore((s) => s.user);
  const ready = useWrapStatusStore((s) => s.ready);
  const year = useWrapStatusStore((s) => s.year);
  const ensureLoaded = useWrapStatusStore((s) => s.ensureLoaded);

  useEffect(() => {
    if (user) void ensureLoaded();
  }, [user, ensureLoaded]);

  return { ready: Boolean(user) && ready, year };
}
