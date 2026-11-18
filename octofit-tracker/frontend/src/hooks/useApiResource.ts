import { useEffect, useState } from 'react';

export function useApiResource<T>(path: string, load: (path: string) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);
    setError(null);
    load(path).then((result) => {
      if (active) setData(result);
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unexpected response error');
    });
    return () => {
      active = false;
    };
  }, [path, load]);

  return { data, error, loading: data === null && error === null };
}
