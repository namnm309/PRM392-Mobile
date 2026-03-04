import { fetchWithAuth } from './authApi';

export type SocialProvider = 'Google' | 'Facebook' | 'Apple' | 'Github';

export interface LinkedAccountDto {
  id: string;
  provider: string;
  providerEmail: string | null;
  providerName: string | null;
  providerAvatarUrl: string | null;
  linkedAt: string;
  lastUsedAt: string | null;
}

export interface AvailableProvider {
  provider: string;
  isLinked: boolean;
}

export interface LinkedAccountsResponse {
  accounts: LinkedAccountDto[];
  availableProviders: AvailableProvider[];
}

export interface LinkAccountRequest {
  provider: string;
  providerUserId: string;
  providerEmail?: string;
  providerName?: string;
  providerAvatarUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getLinkedAccounts(
  getToken: () => Promise<string | null>
): Promise<LinkedAccountsResponse> {
  const response = await fetchWithAuth('/api/LinkedAccounts', getToken);
  const result: ApiResponse<LinkedAccountsResponse> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function linkAccount(
  getToken: () => Promise<string | null>,
  data: LinkAccountRequest
): Promise<LinkedAccountDto> {
  const response = await fetchWithAuth('/api/LinkedAccounts', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result: ApiResponse<LinkedAccountDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function unlinkAccount(
  getToken: () => Promise<string | null>,
  provider: string
): Promise<boolean> {
  const response = await fetchWithAuth(
    `/api/LinkedAccounts/${provider}`,
    getToken,
    { method: 'DELETE' }
  );
  const result: ApiResponse<object> = await response.json();
  return result.success;
}

export function getProviderIcon(provider: string): string {
  switch (provider) {
    case 'Google':
      return 'logo-google';
    case 'Facebook':
      return 'logo-facebook';
    case 'Apple':
      return 'logo-apple';
    case 'Github':
      return 'logo-github';
    default:
      return 'link-outline';
  }
}

export function getProviderColor(provider: string): string {
  switch (provider) {
    case 'Google':
      return '#DB4437';
    case 'Facebook':
      return '#4267B2';
    case 'Apple':
      return '#000000';
    case 'Github':
      return '#333333';
    default:
      return '#6B7280';
  }
}
