import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useMemo } from 'react';
import { API_BASE_URL } from '@/constants/api';

if (!API_BASE_URL) {
  console.warn(
    'Warning: EXPO_PUBLIC_API_BASE_URL chưa được setup. Điền url vào file .env.local.'
  );
}

export { API_BASE_URL };

export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
}

export const useApiClient = () => {
  const { getToken } = useAuth();

  const apiCall = useCallback(
    async <T = unknown>(url: string, options: ApiClientOptions = {}): Promise<T> => {
      const { skipAuth = false, headers = {}, ...fetchOptions } = options;
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
      };

      if (!skipAuth) {
        try {
          const token = await getToken();
          if (token) requestHeaders['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          console.error('[API] Failed to get auth token:', error);
          throw new Error('Authentication failed');
        }
      }

      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      const response = await fetch(fullUrl, { ...fetchOptions, headers: requestHeaders });

      if (!response.ok) {
        let msg = `API Error: ${response.status}`;
        try {
          const errData = await response.json();
          msg = (errData as { message?: string }).message ?? msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      return response.json() as Promise<T>;
    },
    [getToken]
  );

  const post = useCallback(
    (url: string, body?: unknown, options?: ApiClientOptions) =>
      apiCall(url, {
        ...options,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),
    [apiCall]
  );

  return useMemo(() => ({ apiCall, post }), [apiCall, post]);
};
