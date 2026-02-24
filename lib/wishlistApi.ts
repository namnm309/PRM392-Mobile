import { fetchWithAuth } from './authApi';

export interface WishlistItemDto {
  id: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  productPrice: number;
  productSalePrice: number | null;
  isOnSale: boolean;
  isAvailable: boolean;
  stock: number;
  addedAt: string;
}

export interface WishlistStatusDto {
  isInWishlist: boolean;
  addedAt: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getWishlist(
  getToken: () => Promise<string | null>
): Promise<WishlistItemDto[]> {
  const response = await fetchWithAuth('/api/Wishlist', getToken);
  const result: ApiResponse<WishlistItemDto[]> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function addToWishlist(
  getToken: () => Promise<string | null>,
  productId: string
): Promise<WishlistItemDto> {
  const response = await fetchWithAuth('/api/Wishlist', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
  const result: ApiResponse<WishlistItemDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function removeFromWishlist(
  getToken: () => Promise<string | null>,
  productId: string
): Promise<boolean> {
  const response = await fetchWithAuth(`/api/Wishlist/${productId}`, getToken, {
    method: 'DELETE',
  });
  const result: ApiResponse<object> = await response.json();
  return result.success;
}

export async function getWishlistStatus(
  getToken: () => Promise<string | null>,
  productId: string
): Promise<WishlistStatusDto> {
  const response = await fetchWithAuth(
    `/api/Wishlist/status/${productId}`,
    getToken
  );
  const result: ApiResponse<WishlistStatusDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getWishlistCount(
  getToken: () => Promise<string | null>
): Promise<number> {
  const response = await fetchWithAuth('/api/Wishlist/count', getToken);
  const result: ApiResponse<number> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}
