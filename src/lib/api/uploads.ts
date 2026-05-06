import { useAuthStore } from '@/stores/authStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type UploadFolder =
  | 'products'
  | 'categories'
  | 'about'
  | 'reviews'
  | 'sellers'
  | 'hero-slides'
  | 'banners'
  | 'blog'
  | 'misc';

export interface UploadedAsset {
  url: string;
  key: string;
  contentType: string;
  size: number;
  originalName?: string;
}

export interface UploadErrorEnvelope {
  error?: { code?: string; message?: string };
}

export class UploadApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'UploadApiError';
  }
}

/**
 * Generic image upload — POST /api/uploads with multipart/form-data.
 * Server picks a key, persists to whichever storage backend is
 * configured (local disk in dev, R2 in prod), and returns the public
 * URL. Reusable from any client (web admin, mobile, partner apps).
 *
 * Mirrors apiFetchAuthed's refresh-on-401 dance: when a 401 comes
 * back we hit /api/auth/refresh once (via the httpOnly refresh cookie
 * sent by `credentials: include`) and retry. Without this, an intern
 * who's been clicking around for 15+ minutes hits "invalid or expired
 * token" the first time they upload — even though their session is
 * still valid via the refresh cookie.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder = 'misc',
  retryOn401 = true,
): Promise<UploadedAsset> {
  const accessToken = useAuthStore.getState().accessToken;
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`${API_BASE}/api/uploads?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    body: fd,
  });

  if (res.status === 401 && retryOn401) {
    const newToken = await useAuthStore.getState().refresh();
    if (newToken) {
      // Pass false so a real second 401 (e.g. role revoked) doesn't
      // ping-pong us forever.
      return uploadImage(file, folder, false);
    }
  }

  if (!res.ok) {
    let envelope: UploadErrorEnvelope | undefined;
    try {
      envelope = (await res.json()) as UploadErrorEnvelope;
    } catch {
      /* not JSON */
    }
    throw new UploadApiError(
      res.status,
      envelope?.error?.message ?? `Upload failed with status ${res.status}`,
    );
  }

  return (await res.json()) as UploadedAsset;
}
