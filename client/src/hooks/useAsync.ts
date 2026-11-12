import { DependencyList, useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../services/api";

export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const run = useCallback(fn, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await run());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [run]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    run()
      .then((result) => active && setData(result))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [run]);

  return { data, error, loading, reload, setData };
}
