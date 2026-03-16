import { useState, useCallback } from 'react';
import { GitHubData } from '../types';

interface UseGithubDataReturn {
  data: GitHubData | null;
  loading: boolean;
  error: string | null;
  fetchData: (username: string) => Promise<void>;
}

export function useGithubData(): UseGithubDataReturn {
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (username: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/user/${encodeURIComponent(username)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
        throw new Error(errorData.error ?? `HTTP ${response.status}`);
      }
      const json = await response.json() as GitHubData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
