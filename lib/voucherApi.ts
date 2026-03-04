import { API_BASE_URL } from '@/constants/api';
import { fetchWithAuth } from './authApi';

export interface VoucherDto {
  id: string;
  code: string;
  discountType: string;
  value: number;
  startTime: string;
  endTime: string;
  minOrderValue: number;
  totalUsageLimit: number;
  perUserLimit: number;
  isActive: boolean;
  isValid: boolean;
  currentUsage: number;
  userUsage: number;
  remainingForUser: number;
}

export interface VoucherBreakdownDto {
  subtotalEligible: number;
  discountAmount: number;
  finalTotal: number;
  voucherCode: string;
  errorMessage?: string;
  ineligibleItems: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getActiveVouchers(): Promise<VoucherDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/Vouchers`);
  const result: ApiResponse<VoucherDto[]> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getAvailableVouchers(
  getToken: () => Promise<string | null>
): Promise<VoucherDto[]> {
  const response = await fetchWithAuth('/api/Vouchers/available', getToken);
  const result: ApiResponse<VoucherDto[]> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getVoucherByCode(code: string): Promise<VoucherDto | null> {
  const response = await fetch(`${API_BASE_URL}/api/Vouchers/${code}`);
  if (response.status === 404) return null;
  const result: ApiResponse<VoucherDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function applyVoucher(
  getToken: () => Promise<string | null>,
  code: string,
  cartItemIds: string[]
): Promise<VoucherBreakdownDto> {
  const queryParams = cartItemIds.map(id => `cartItemIds=${id}`).join('&');
  const response = await fetchWithAuth(
    `/api/Vouchers/apply?${queryParams}`,
    getToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }
  );
  const result: ApiResponse<VoucherBreakdownDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}
