import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  setData: (data: T) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * 通用API状态管理Hook
 */
export function useApiState<T>(initialData: T | null = null): UseApiState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    setData,
    setLoading,
    setError,
    reset
  };
}