import { API_BASE_URL } from '@/constants/api';
import { fetchWithAuth } from './authApi';

export type CheckoutRequest = {
  addressId: string;
  paymentMethod: 'COD' | 'Online';
  voucherId?: string;
  notes?: string;
  cartItemIds?: string[];
  shippingFee: number;
  shippingServiceId?: number;
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
  paymentStatus: string;
  vnPayTransactionNo?: string;
  paymentDate?: string;
  notes?: string;
  shippingFee: number;
  ghnOrderCode?: string;
  expectedDeliveryTime?: string;
  shippingServiceId?: number;
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
      shippingFee: request.shippingFee,
      shippingServiceId: request.shippingServiceId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { message: 'Checkout failed' };
    }
    
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
