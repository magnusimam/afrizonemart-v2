import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type AuthResult,
  type AuthUser,
  refreshSession,
} from '@/lib/api/auth';

/**
 * Auth state. The refresh token lives in an httpOnly cookie set by the
 * API and is never exposed to JS. Only the access token + user are
 * persisted in localStorage so we can stay logged in across page reloads
 * while keeping the refresh token out of XSS reach.
 */
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (result: AuthResult) => void;
  clear: () => void;
  /**
   * Try to mint a new access token using the httpOnly refresh cookie.
   * Returns the new access token on success, null if refresh failed
   * (in which case the local session has been cleared).
   */
  refresh: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      setSession: (result) =>
        set({ user: result.user, accessToken: result.accessToken }),

      clear: () => set({ user: null, accessToken: null }),

      refresh: async () => {
        try {
          const result = await refreshSession();
          set({ user: result.user, accessToken: result.accessToken });
          return result.accessToken;
        } catch {
          set({ user: null, accessToken: null });
          return null;
        }
      },
    }),
    {
      name: 'azm-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist the user + accessToken. If a previous version
      // stored a refreshToken in localStorage, it gets dropped on the
      // next write.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => Boolean(s.user && s.accessToken));
}
