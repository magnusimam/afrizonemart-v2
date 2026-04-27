'use client';

import { useEffect, useState } from 'react';
import { evaluateFlags } from '@/lib/api/admin';

/**
 * Phase 10.4 — feature flag hook.
 *
 * Usage:
 *   const newCheckout = useFlag('new_checkout');
 *   if (newCheckout) ... else ...
 *
 * Flags are batched and cached in-memory for the page session — multiple
 * useFlag calls don't re-fetch.
 */

const cache = new Map<string, boolean>();
let pending: Map<string, Array<(v: boolean) => void>> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function request(key: string, defaultValue: boolean): Promise<boolean> {
  if (cache.has(key)) return Promise.resolve(cache.get(key) as boolean);

  return new Promise((resolve) => {
    if (!pending) pending = new Map();
    const arr = pending.get(key) ?? [];
    arr.push(resolve);
    pending.set(key, arr);

    if (flushTimer) return;
    flushTimer = setTimeout(async () => {
      const batch = pending;
      pending = null;
      flushTimer = null;
      if (!batch) return;
      const keys = Array.from(batch.keys());
      try {
        const result = await evaluateFlags(keys);
        for (const k of keys) {
          const v = result[k] ?? defaultValue;
          cache.set(k, v);
          batch.get(k)?.forEach((fn) => fn(v));
        }
      } catch {
        for (const k of keys) {
          batch.get(k)?.forEach((fn) => fn(defaultValue));
        }
      }
    }, 20);
  });
}

export function useFlag(key: string, defaultValue: boolean = false): boolean {
  const [value, setValue] = useState<boolean>(cache.get(key) ?? defaultValue);

  useEffect(() => {
    let cancelled = false;
    void request(key, defaultValue).then((v) => {
      if (!cancelled) setValue(v);
    });
    return () => {
      cancelled = true;
    };
  }, [key, defaultValue]);

  return value;
}
