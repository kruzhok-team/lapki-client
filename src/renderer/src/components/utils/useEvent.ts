import { useCallback, useInsertionEffect, useRef } from 'react';

export default function useEvent(fn: Function) {
  const ref = useRef<Function | null>(null);
  useInsertionEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args) => {
    const f = ref.current;
    if (!f) return;
    return f(...args);
  }, []);
}
