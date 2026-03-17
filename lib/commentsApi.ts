import { API_BASE_URL } from '@/constants/api';
import { fetchWithAuth } from './authApi';
import { ApiError } from './reviewsApi';

export type ProductCommentResponseDto = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  productId: string;
  parentId: string | null;
  content: string;
  replies: ProductCommentResponseDto[];
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentRequest = {
  productId: string;
  content: string;
  parentId: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
};

export async function fetchComments(
  productId: string,
): Promise<ProductCommentResponseDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/ProductComments/product/${productId}`,
    { headers: { accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`Failed to fetch comments: ${res.status}`);
  const json: ApiResponse<ProductCommentResponseDto[]> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data ?? [];
}

export async function createComment(
  data: CreateCommentRequest,
  getToken: () => Promise<string | null>,
): Promise<ProductCommentResponseDto> {
  const res = await fetchWithAuth('/api/ProductComments', getToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<ProductCommentResponseDto> = await res.json();
  if (!res.ok || !json.success) {
    throw new ApiError(json.message, res.status, json.errors);
  }
  return json.data;
}

export async function deleteComment(
  commentId: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const res = await fetchWithAuth(
    `/api/ProductComments/${commentId}`,
    getToken,
    { method: 'DELETE' },
  );
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

export function countAllReplies(comment: ProductCommentResponseDto): number {
  let count = comment.replies.length;
  for (const reply of comment.replies) {
    count += countAllReplies(reply);
  }
  return count;
}
