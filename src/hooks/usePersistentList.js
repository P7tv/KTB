import { useEffect, useState } from 'react';

const isBrowser = typeof window !== 'undefined';

export function usePersistentList(storageKey, defaultValue = []) {
  const [items, setItems] = useState(() => {
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
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [storageKey, items]);

  return [items, setItems];
}
