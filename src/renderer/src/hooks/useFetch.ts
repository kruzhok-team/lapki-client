import { useCallback, useEffect, useState } from 'react';

export const useFetch = <T>(url: string, variant: 'text' | 'json' = 'json') => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [temp, setTemp] = useState(0);

  const forceUpdate = useCallback(() => setTemp((p) => p + 1), []);

  useEffect(() => {
    if (!url) return;

    setIsLoading(true);
    setData(null);
    setError(null);

    fetch(url)
      .then((response) => {
        if (!response.ok) throw response;

        return response[variant]();
      })
      .then(setData)
      .catch((reason) => {
        console.error(reason);
        setError(reason);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [url, variant, temp]);

  return { data, isLoading, error, refetch: forceUpdate } as const;
};
