import { API_BASE_URL } from '@/constants/api';

/**
 * Fetch with Clerk session token. Use for authenticated API calls (Cart, Orders, etc.).
 * Pass getToken from useAuth() so the Clerk token is sent in Authorization: Bearer &lt;token&gt;.
 */
export async function fetchWithAuth(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
