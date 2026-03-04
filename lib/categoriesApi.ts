import { API_BASE_URL } from '@/constants/api';

export type ApiCategory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  children: ApiCategory[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE_URL}/api/Categories`, {
    headers: { accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }

  const json = (await res.json()) as ApiResponse<ApiCategory[]>;
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Failed to fetch categories');
  }

  return json.data;
}
