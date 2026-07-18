import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for API calls with loading/error state.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(listBuildings);
 *   const { execute, loading } = useApiAction(createBuilding);
 */
export function useApi(apiFn, params, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(params);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * Hook for API mutations (create, update, delete).
 * Returns an execute function and loading/error state.
 */
export function useApiAction(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { execute, loading, error };
}
