import { fetchWithAuth } from './authApi';
import { API_BASE_URL } from '@/constants/api';

export interface GhnProvince {
  provinceId: number;
  provinceName: string;
  code?: string;
}

export interface GhnDistrict {
  districtId: number;
  provinceId: number;
  districtName: string;
  code?: string;
  supportType: number;
}

export interface GhnWard {
  wardCode: string;
  districtId: number;
  wardName: string;
}

export interface GhnAvailableService {
  serviceId: number;
  shortName: string;
  serviceTypeId: number;
}

export interface GhnFeeResponse {
  total: number;
  serviceFee: number;
  insuranceFee: number;
  codFee: number;
}

export interface CalculateFeeRequest {
  toDistrictId: number;
  toWardCode: string;
  serviceId?: number;
  serviceTypeId?: number;
  weight?: number;
  height?: number;
  length?: number;
  width?: number;
  insuranceValue?: number;
}

export interface GhnResolvedCodes {
  provinceId: number;
  districtId: number;
  wardCode?: string;
}

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await response.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'API request failed');
  }
  return json.data;
}

export async function getProvinces(): Promise<GhnProvince[]> {
  return fetchApi<GhnProvince[]>('/api/Shipping/provinces');
}

export async function getDistricts(provinceId: number): Promise<GhnDistrict[]> {
  return fetchApi<GhnDistrict[]>(`/api/Shipping/districts?provinceId=${provinceId}`);
}

export async function getWards(districtId: number): Promise<GhnWard[]> {
  return fetchApi<GhnWard[]>(`/api/Shipping/wards?districtId=${districtId}`);
}

export async function getShippingServices(toDistrictId: number): Promise<GhnAvailableService[]> {
  return fetchApi<GhnAvailableService[]>(`/api/Shipping/services?toDistrictId=${toDistrictId}`);
}

export async function calculateShippingFee(request: CalculateFeeRequest): Promise<GhnFeeResponse> {
  return fetchApi<GhnFeeResponse>('/api/Shipping/calculate-fee', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function resolveGhnCodes(city: string, district: string, ward: string): Promise<GhnResolvedCodes> {
  return fetchApi<GhnResolvedCodes>('/api/Shipping/resolve-codes', {
    method: 'POST',
    body: JSON.stringify({ city, district, ward }),
  });
}
