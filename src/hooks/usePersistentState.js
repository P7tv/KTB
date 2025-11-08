import { useEffect, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

export function usePersistentState(storageKey, defaultValue) {
  const [value, setValue] = useState(() => {
    if (!isBrowser) return defaultValue;
    try {
      const stored = window.localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [storageKey, value]);

  return [value, setValue];
}
