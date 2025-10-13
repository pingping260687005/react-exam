import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncOptions<TArgs extends unknown[], T> {
  immediate?: boolean;
  defaultValue?: T | null;
  mapError?: (e: unknown) => string;
  deps?: unknown[];
}

export function useAsync<TArgs extends unknown[], T>(
  asyncFn: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions<TArgs, T> = {}
) {
  const { immediate = false, defaultValue = null, mapError, deps = [] } = options;
  const mountedRef = useRef(true);
  const [state, setState] = useState<AsyncState<T>>({ data: defaultValue, loading: false, error: null });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...args: TArgs) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await asyncFn(...args);
      if (!mountedRef.current) return data;
      setState({ data, loading: false, error: null });
      return data;
    } catch (e) {
      const message = mapError ? mapError(e) : e instanceof Error ? e.message : 'Unknown error';
      if (!mountedRef.current) throw e;
      setState((s) => ({ ...s, loading: false, error: message }));
      throw e;
    }
  }, [asyncFn, mapError]);

  useEffect(() => {
    if (immediate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      run(...([] as any));
    }
    // deps allow auto-run
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, run } as const;
}

export default useAsync;


