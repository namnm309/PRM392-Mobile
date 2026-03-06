import { API_BASE_URL } from '@/constants/api';
import { fetchWithAuth } from './authApi';

export type CheckoutRequest = {
  addressId: string;
  paymentMethod: 'COD' | 'Online';
  voucherId?: string;
  notes?: string;
  cartItemIds?: string[]; // List of cart item IDs to checkout
};

export type OrderResponse = {
  id: string;
  userId: string;
  addressId: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export async function checkout(
  getToken: () => Promise<string | null>,
  request: CheckoutRequest
): Promise<OrderResponse> {
  const response = await fetchWithAuth('/api/Orders/checkout', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addressId: request.addressId,
      paymentMethod: request.paymentMethod,
      voucherId: request.voucherId,
      notes: request.notes,
      cartItemIds: request.cartItemIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Checkout failed' }));
    throw new Error(error.message || `Checkout failed: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<OrderResponse>;
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Checkout failed');
  }

  return json.data;
}

export async function getOrderById(
  getToken: () => Promise<string | null>,
  orderId: string
): Promise<OrderResponse | null> {
  const response = await fetchWithAuth(`/api/Orders/${orderId}`, getToken);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<OrderResponse>;
  if (!json.success || !json.data) return null;

  return json.data;
}
