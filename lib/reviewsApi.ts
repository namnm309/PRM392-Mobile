import { API_BASE_URL } from '@/constants/api';
import { fetchWithAuth } from './authApi';

export type ReviewReplyDto = {
  id: string;
  reviewId: string;
  staffId: string;
  staffName: string;
  replyContent: string;
  createdAt: string;
};

export type ReviewResponseDto = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  productId: string;
  rating: number;
  content: string;
  reply: ReviewReplyDto | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateReviewRequest = {
  productId: string;
  rating: number;
  content: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
};

export async function fetchReviews(
  productId: string,
): Promise<ReviewResponseDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/Reviews/product/${productId}`,
    { headers: { accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`Failed to fetch reviews: ${res.status}`);
  const json: ApiResponse<ReviewResponseDto[]> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data ?? [];
}

export async function createReview(
  data: CreateReviewRequest,
  getToken: () => Promise<string | null>,
): Promise<ReviewResponseDto> {
  const res = await fetchWithAuth('/api/Reviews', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<ReviewResponseDto> = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(json.message, res.status, json.errors);
  }
  return json.data;
}

export async function replyToReview(
  reviewId: string,
  replyContent: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const res = await fetchWithAuth(`/api/Reviews/${reviewId}/reply`, getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ replyContent }),
  });
  const json: ApiResponse<unknown> = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(json.message, res.status, json.errors);
  }
}

export async function deleteReview(
  reviewId: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const res = await fetchWithAuth(`/api/Reviews/${reviewId}`, getToken, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json: ApiResponse<unknown> = await res.json().catch(() => ({
      success: false,
      message: 'Delete failed',
      data: null,
      errors: null,
    }));
    throw new ApiError(json.message, res.status, json.errors);
  }
}

export class ApiError extends Error {
  status: number;
  errors: string[] | null;
  constructor(message: string, status: number, errors: string[] | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}
