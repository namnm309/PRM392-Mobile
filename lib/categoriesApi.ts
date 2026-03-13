import { API_BASE_URL } from '@/constants/api';

export type ApiBrandSummary = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  children: ApiCategory[];
  brands?: ApiBrandSummary[];
  isBrand?: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type RawBrand = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

type RawCategory = {
  id: string;
  name: string;
  imageUrl?: string | null;
  children?: RawCategory[];
  Children?: RawCategory[];
  brands?: RawBrand[];
  Brands?: RawBrand[];
};

function mapRawCategory(raw: RawCategory): ApiCategory {
  const rawChildren = raw.children ?? raw.Children ?? [];
  const rawBrands = raw.brands ?? raw.Brands ?? [];

  return {
    id: raw.id,
    name: raw.name,
    imageUrl: raw.imageUrl ?? null,
    children: rawChildren.map(mapRawCategory),
    brands: rawBrands.map((b) => ({
      id: b.id,
      name: b.name,
      imageUrl: b.imageUrl ?? null,
    })),
  };
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE_URL}/api/Categories`, {
    headers: { accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }

  const json = (await res.json()) as ApiResponse<RawCategory[]>;
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Failed to fetch categories');
  }

  return json.data.map(mapRawCategory);
}
