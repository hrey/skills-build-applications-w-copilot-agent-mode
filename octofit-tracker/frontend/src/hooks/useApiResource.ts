import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    getJson<T>(path).then((result) => {
      if (active) setData(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unexpected response error');
    });
    return () => {
      active = false;
    };
  }, [path]);

  return { data, error, loading: data === null && error === null };
}
