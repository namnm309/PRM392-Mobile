import { fetchWithAuth } from './authApi';
import { API_BASE_URL } from '@/constants/api';

export interface CartItemDto {
  id: string;
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  variantColorName?: string | null;
  variantColorHex?: string | null;
  variantRamGb?: number | null;
  variantStorageGb?: number | null;
  productName: string;
  productPrice: number;
  productDiscountPrice?: number | null;
  productImageUrl?: string | null;
  quantity: number;
  isAvailable: boolean;
  maxQuantity: number;
  reasonUnavailable?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartResponseDto {
  items: CartItemDto[];
  totalItems: number;
  totalAmount: number;
}

export interface AddCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getCart(
  getToken: () => Promise<string | null>
): Promise<CartResponseDto> {
  const response = await fetchWithAuth('/api/Cart', getToken);
  const result: ApiResponse<CartResponseDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function addCartItem(
  getToken: () => Promise<string | null>,
  request: AddCartItemRequest
): Promise<CartItemDto> {
  const response = await fetchWithAuth('/api/Cart/items', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const result: ApiResponse<CartItemDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function updateCartItem(
  getToken: () => Promise<string | null>,
  itemId: string,
  request: UpdateCartItemRequest
): Promise<CartItemDto> {
  const response = await fetchWithAuth(`/api/Cart/items/${itemId}`, getToken, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const result: ApiResponse<CartItemDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function removeCartItem(
  getToken: () => Promise<string | null>,
  itemId: string
): Promise<boolean> {
  const response = await fetchWithAuth(`/api/Cart/items/${itemId}`, getToken, {
    method: 'DELETE',
  });
  const result: ApiResponse<object> = await response.json();
  return result.success;
}

export async function clearCart(
  getToken: () => Promise<string | null>
): Promise<boolean> {
  const response = await fetchWithAuth('/api/Cart/clear', getToken, {
    method: 'DELETE',
  });
  const result: ApiResponse<object> = await response.json();
  return result.success;
}
