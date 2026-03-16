import AsyncStorage from '@react-native-async-storage/async-storage';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// TODO: DÁN V3 API KEY CỦA BẠN Ở ĐÂY (chuỗi ngắn, không phải JWT dài)
// Ví dụ: const TMDB_API_KEY_V3 = '1234567890abcdef1234567890abcdef';
const TMDB_API_KEY_V3 = 'REPLACE_WITH_YOUR_V3_API_KEY';

// Vẫn giữ token v4 để fallback nếu bạn muốn dùng sau này
const TMDB_ACCESS_TOKEN_V4 =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZjEzMWVjYzc3YzE5MWVlZTRmMzk3M2NhNzk1N2I2YiIsIm5iZiI6MTc3MzE2NDk0NC4xNzUsInN1YiI6IjY5YjA1OTkwYmY4NzAzM2RjNDc5NTJkOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.BsB2fxYSNiYL79kXSY1BQ0oeeKdMhaQ9jSwohqm6qtM';

export type Movie = {
  id: number;
  title: string;
  posterPath: string | null;
  overview: string;
  releaseDate?: string;
  voteAverage?: number;
};

export type MoviesCache = {
  movies: Movie[];
  updatedAt: number;
};

const MOVIES_CACHE_KEY = '@movies_cache';
const FAVORITES_KEY = '@favorite_ids';

export async function fetchPopularMovies(): Promise<Movie[]> {
  const useV3 = TMDB_API_KEY_V3 && TMDB_API_KEY_V3 !== 'REPLACE_WITH_YOUR_V3_API_KEY';

  const url = useV3
    ? `${TMDB_BASE_URL}/movie/popular?language=vi-VN&page=1&api_key=${TMDB_API_KEY_V3}`
    : `${TMDB_BASE_URL}/movie/popular?language=vi-VN&page=1`;

  const headers: Record<string, string> = { accept: 'application/json' };

  if (!useV3 && TMDB_ACCESS_TOKEN_V4) {
    headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN_V4}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // eslint-disable-next-line no-console
    console.error('TMDB error', res.status, text);
    throw new Error(`Không thể tải danh sách phim (TMDB ${res.status})`);
  }

  const json = (await res.json()) as {
    results?: Array<{
      id: number;
      title?: string;
      name?: string;
      original_title?: string;
      poster_path?: string | null;
      overview?: string;
      release_date?: string;
      vote_average?: number;
    }>;
  };

  const results = json.results ?? [];

  return results.map((item) => ({
    id: item.id,
    title: item.title ?? item.name ?? item.original_title ?? 'Không rõ tiêu đề',
    posterPath: item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : null,
    overview: item.overview ?? 'Không có mô tả.',
    releaseDate: item.release_date,
    voteAverage: item.vote_average,
  }));
}

export async function loadMoviesCache(): Promise<MoviesCache | null> {
  const raw = await AsyncStorage.getItem(MOVIES_CACHE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MoviesCache;
  } catch {
    return null;
  }
}

export async function saveMoviesCache(cache: MoviesCache): Promise<void> {
  await AsyncStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify(cache));
}

export async function loadFavoriteIds(): Promise<number[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as number[];
  } catch {
    return [];
  }
}

export async function saveFavoriteIds(ids: number[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

