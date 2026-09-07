import { useEffect, useRef, useState } from 'react';

/** Live clock that re-renders on an interval (used for countdowns / now-line). */
export function useNow(intervalMs = 20000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useMounted(): boolean {
  const ref = useRef(false);
  const [, force] = useState(0);
  useEffect(() => {
    ref.current = true;
    force((n) => n + 1);
  }, []);
  return ref.current;
}
