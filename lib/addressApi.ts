import { fetchWithAuth } from './authApi';

export interface AddressDto {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string | null;
  ward: string;
  district: string;
  city: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  ward: string;
  district: string;
  city: string;
  isPrimary?: boolean;
}

export interface UpdateAddressRequest {
  recipientName?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getMyAddresses(
  getToken: () => Promise<string | null>
): Promise<AddressDto[]> {
  const response = await fetchWithAuth('/api/Addresses', getToken);
  const result: ApiResponse<AddressDto[]> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getAddressById(
  getToken: () => Promise<string | null>,
  addressId: string
): Promise<AddressDto | null> {
  const response = await fetchWithAuth(`/api/Addresses/${addressId}`, getToken);
  if (response.status === 404) return null;
  const result: ApiResponse<AddressDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function createAddress(
  getToken: () => Promise<string | null>,
  data: CreateAddressRequest
): Promise<AddressDto> {
  const response = await fetchWithAuth('/api/Addresses', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<AddressDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function updateAddress(
  getToken: () => Promise<string | null>,
  addressId: string,
  data: UpdateAddressRequest
): Promise<AddressDto> {
  const response = await fetchWithAuth(`/api/Addresses/${addressId}`, getToken, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<AddressDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function deleteAddress(
  getToken: () => Promise<string | null>,
  addressId: string
): Promise<boolean> {
  const response = await fetchWithAuth(`/api/Addresses/${addressId}`, getToken, {
    method: 'DELETE',
  });
  const result: ApiResponse<object> = await response.json();
  return result.success;
}

export async function setPrimaryAddress(
  getToken: () => Promise<string | null>,
  addressId: string
): Promise<AddressDto> {
  const response = await fetchWithAuth(
    `/api/Addresses/${addressId}/set-primary`,
    getToken,
    { method: 'POST' }
  );
  const result: ApiResponse<AddressDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export function formatAddress(address: AddressDto): string {
  const parts = [address.addressLine1];
  if (address.addressLine2) parts.push(address.addressLine2);
  parts.push(address.ward, address.district, address.city);
  return parts.join(', ');
}
