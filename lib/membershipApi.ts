import { API_BASE_URL } from '@/constants/api';
import { fetchWithAuth } from './authApi';

export interface MembershipTierDto {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  discountPercent: number;
  benefits: string | null;
  iconUrl: string | null;
  displayOrder: number;
}

export interface UserMembershipDto {
  totalPoints: number;
  availablePoints: number;
  currentTier: MembershipTierDto | null;
  nextTier: MembershipTierDto | null;
  pointsToNextTier: number;
}

export interface PointTransactionDto {
  id: string;
  points: number;
  type: string;
  orderId: string | null;
  description: string | null;
  createdAt: string;
}

export interface PointHistoryResponse {
  totalPoints: number;
  availablePoints: number;
  transactions: PointTransactionDto[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export async function getAllTiers(): Promise<MembershipTierDto[]> {
  const response = await fetch(`${API_BASE_URL}/api/Membership/tiers`);
  const result: ApiResponse<MembershipTierDto[]> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getMyMembership(
  getToken: () => Promise<string | null>
): Promise<UserMembershipDto> {
  const response = await fetchWithAuth('/api/Membership/me', getToken);
  const result: ApiResponse<UserMembershipDto> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export async function getPointHistory(
  getToken: () => Promise<string | null>,
  limit: number = 20
): Promise<PointHistoryResponse> {
  const response = await fetchWithAuth(
    `/api/Membership/points/history?limit=${limit}`,
    getToken
  );
  const result: ApiResponse<PointHistoryResponse> = await response.json();
  if (!result.success) throw new Error(result.message);
  return result.data;
}

export function getTierColor(tierName: string): string {
  switch (tierName.toLowerCase()) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#FFD700';
    case 'platinum':
      return '#E5E4E2';
    case 'diamond':
      return '#B9F2FF';
    default:
      return '#6B7280';
  }
}

export function getPointTypeColor(type: string): string {
  switch (type) {
    case 'Earned':
      return '#10B981';
    case 'Redeemed':
      return '#F59E0B';
    case 'Expired':
      return '#EF4444';
    case 'Adjustment':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}

export function getPointTypeText(type: string): string {
  switch (type) {
    case 'Earned':
      return 'Tích điểm';
    case 'Redeemed':
      return 'Đổi điểm';
    case 'Expired':
      return 'Hết hạn';
    case 'Adjustment':
      return 'Điều chỉnh';
    default:
      return type;
  }
}
