import { fetchWithAuth } from './authApi';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type VnPayUrlResponse = {
  paymentUrl: string;
};

export async function createVnPayUrl(
  getToken: () => Promise<string | null>,
  orderId: string
): Promise<string> {
  const response = await fetchWithAuth('/api/VnPay/create-payment-url', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create payment URL' }));
    throw new Error(error.message || `Failed to create payment URL: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<VnPayUrlResponse>;
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Failed to create payment URL');
  }

  return json.data.paymentUrl;
}
