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

export type ReviewSummary = {
  avgRating: number | null;
  totalReviews: number;
};

type ReviewSummaryCacheEntry = {
  createdAtMs: number;
  promise: Promise<ReviewSummary>;
};

const REVIEW_SUMMARY_TTL_MS = 3 * 60_000; // 3 minutes
const reviewSummaryCache = new Map<string, ReviewSummaryCacheEntry>();

function computeReviewSummary(reviews: ReviewResponseDto[]): ReviewSummary {
  const totalReviews = reviews.length;
  if (totalReviews === 0) return { avgRating: null, totalReviews: 0 };

  const sum = reviews.reduce((s, r) => s + (r.rating ?? 0), 0);
  const avgRating = Math.round((sum / totalReviews) * 10) / 10;
  return { avgRating, totalReviews };
}

export async function fetchReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  const now = Date.now();
  const cached = reviewSummaryCache.get(productId);
  if (cached && now - cached.createdAtMs < REVIEW_SUMMARY_TTL_MS) {
    return cached.promise;
  }

  const promise = fetchReviews(productId)
    .then((reviews) => computeReviewSummary(reviews))
    .catch(() => ({ avgRating: null, totalReviews: 0 } satisfies ReviewSummary));

  reviewSummaryCache.set(productId, { createdAtMs: now, promise });
  return promise;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }

  const workers = new Array(Math.min(concurrency, items.length))
    .fill(0)
    .map(() => worker());
  await Promise.all(workers);
  return results;
}

export async function fetchReviewSummaries(
  productIds: string[],
  opts?: { concurrency?: number },
): Promise<Record<string, ReviewSummary>> {
  const ids = Array.from(new Set(productIds.filter(Boolean)));
  const concurrency = Math.max(1, opts?.concurrency ?? 6);

  const summaries = await mapWithConcurrency(ids, concurrency, async (id) => ({
    id,
    summary: await fetchReviewSummary(id),
  }));

  return summaries.reduce(
    (acc, cur) => {
      acc[cur.id] = cur.summary;
      return acc;
    },
    {} as Record<string, ReviewSummary>,
  );
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
