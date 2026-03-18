import type { HomeProduct } from '@/constants/homeProductData';
import type {
  ProductDetail,
  ProductMediaItem,
  ProductSpec,
  ProductVariant,
  StoreBranch,
} from '@/constants/productDetailData';
import { API_BASE_URL } from '@/constants/api';

export type ApiProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  brand?: { id: string; name: string } | null;
  isOnSale?: boolean;
};

export type ApiProductImage = {
  id?: string;
  url?: string;
  imageUrl?: string;
};

export type ApiProductVariant = {
  id: string;
  productId: string;
  sku?: string | null;
  variantName?: string | null;
  colorName: string;
  colorHex?: string | null;
  ramGb?: number | null;
  storageGb?: number | null;
  price: number;
  discountPrice?: number | null;
  stock: number;
  isActive: boolean;
  displayOrder: number;
};

export type ApiProductDetail = ApiProduct & {
  stock?: number;
  productImages?: ApiProductImage[];
  category?: { id: string; name: string } | null;
  hasVariants?: boolean;
  variants?: ApiProductVariant[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type FetchProductsParams = {
  categoryId?: string;
  brandId?: string;
  // Optional client-side limit for number of products returned
  limit?: number;
};

export async function fetchProducts(
  params: FetchProductsParams = {}
): Promise<ApiProduct[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('isActive', 'true');
  if (params.categoryId) searchParams.set('categoryId', params.categoryId);
  if (params.brandId) searchParams.set('brandId', params.brandId);

  const url = `${API_BASE_URL}/api/Products?${searchParams.toString()}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  const json = (await res.json()) as ApiResponse<ApiProduct[]>;
  if (!json.success || !json.data) {
    throw new Error(json.message ?? 'Failed to fetch products');
  }

  const data = json.data;
  if (typeof params.limit === 'number' && params.limit > 0) {
    return data.slice(0, params.limit);
  }
  return data;
}

export async function searchProductsByName(name: string): Promise<ApiProduct[]> {
  if (!name?.trim()) return [];
  const params = new URLSearchParams();
  params.set('name', name.trim());
  params.set('isActive', 'true');
  const url = `${API_BASE_URL}/api/Products/search?${params.toString()}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) return [];
  const json = (await res.json()) as ApiResponse<ApiProduct[]>;
  if (!json.success || !json.data) return [];
  return json.data;
}

export async function fetchProductById(
  id: string
): Promise<ApiProductDetail | null> {
  const res = await fetch(`${API_BASE_URL}/api/Products/${id}`, {
    headers: { accept: 'application/json' },
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch product: ${res.status}`);

  const json = (await res.json()) as ApiResponse<ApiProductDetail>;
  if (!json.success || !json.data) return null;

  return json.data;
}

const DEFAULT_STORE_BRANCHES: StoreBranch[] = [
  { address: '334 Trần Hưng Đạo, Đại Phúc, TP. Bắc Ninh', phone: '02471010334', hasMap: true },
  { address: '242 Trần Phú, TX. Từ Sơn, Bắc Ninh', phone: '02471080242', hasMap: true },
];

export function mapApiProductToProductDetail(
  api: ApiProductDetail
): ProductDetail {
  const price = api.price;
  const discountPrice = api.discountPrice ?? price;
  const discountPercent =
    price > 0 ? Math.round((1 - discountPrice / price) * 100) : 0;

  const media: ProductMediaItem[] = [];
  if (api.imageUrl) media.push({ type: 'image', uri: api.imageUrl });
  (api.productImages ?? []).forEach((img) => {
    const uri = img.url ?? img.imageUrl;
    if (uri) media.push({ type: 'image', uri });
  });
  if (media.length === 0) media.push({ type: 'image' });

  const specsList: ProductSpec[] = [
    { label: 'Mô tả', value: api.description ?? '-' },
    { label: 'Tồn kho', value: `${api.stock ?? 0} sản phẩm` },
  ];

  const features = api.description
    ? api.description.split(/[,.]/).map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: api.id,
    name: api.name,
    brand: api.brand?.name ?? '',
    priceCurrent: discountPrice,
    priceOriginal: price,
    discountPercent,
    studentPrice: undefined,
    specs: api.description
      ? api.description.slice(0, 80) + (api.description.length > 80 ? '...' : '')
      : undefined,
    imageUri: api.imageUrl ?? null,
    badgeSecondary: api.isOnSale ? null : 'Trả góp 0%',
    stock: api.stock ?? 0,
    hasVariants: api.hasVariants ?? false,
    variants: (api.variants ?? []) as unknown as ProductVariant[],
    categoryId: api.categoryId ?? api.category?.id ?? null,
    categoryName: api.category?.name ?? null,
    media,
    storageOptions: undefined,
    colorOptions: undefined,
    tradeInPrice: undefined,
    specsList,
    features: features.length > 0 ? features : (api.description ? [api.description] : []),
    reviews: { rating: 0, totalReviews: 0, distribution: {} },
    reviewItems: [],
    relatedNews: [],
    questions: [],
    storeBranches: DEFAULT_STORE_BRANCHES,
  };
}

export function mapApiProductToHomeProduct(apiProduct: ApiProduct): HomeProduct {
  const price = apiProduct.price;
  const discountPrice = apiProduct.discountPrice ?? price;
  const discountPercent =
    price > 0
      ? Math.round((1 - discountPrice / price) * 100)
      : 0;

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    brand: apiProduct.brand?.name ?? '',
    priceCurrent: discountPrice,
    priceOriginal: price,
    discountPercent,
    studentPrice: undefined,
    specs: apiProduct.description
      ? apiProduct.description.slice(0, 80) +
        (apiProduct.description.length > 80 ? '...' : '')
      : undefined,
    imageUri: apiProduct.imageUrl ?? null,
    badgeSecondary: apiProduct.isOnSale ? null : 'Trả góp 0%',
  };
}
