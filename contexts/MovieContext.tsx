import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';

import type { Movie } from '@/lib/tmdbApi';
import {
  fetchPopularMovies,
  loadFavoriteIds,
  loadMoviesCache,
  saveFavoriteIds,
  saveMoviesCache,
} from '@/lib/tmdbApi';

type MovieContextValue = {
  movies: Movie[];
  favoriteIds: number[];
  isOnline: boolean | null;
  isLoading: boolean;
  lastSyncedAt?: number;
  refreshFromTmdb: () => Promise<void>;
  toggleFavorite: (movieId: number) => Promise<void>;
};

const MovieContext = createContext<MovieContextValue | null>(null);

export function MovieProvider({ children }: { children: React.ReactNode }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true);
    });

    return () => unsubscribe();
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cache, favIds] = await Promise.all([
        loadMoviesCache(),
        loadFavoriteIds(),
      ]);

      if (cache) {
        setMovies(cache.movies);
        setLastSyncedAt(cache.updatedAt);
      }
      setFavoriteIds(favIds);

      if (isOnline) {
        const fetched = await fetchPopularMovies();
        setMovies(fetched);
        const now = Date.now();
        setLastSyncedAt(now);
        await saveMoviesCache({ movies: fetched, updatedAt: now });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Lỗi khi tải dữ liệu phim:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  const refreshFromTmdb = useCallback(async () => {
    if (!isOnline) {
      return;
    }
    setIsLoading(true);
    try {
      const fetched = await fetchPopularMovies();
      setMovies(fetched);
      const now = Date.now();
      setLastSyncedAt(now);
      await saveMoviesCache({ movies: fetched, updatedAt: now });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Lỗi khi tải lại dữ liệu phim:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  const toggleFavorite = useCallback(
    async (movieId: number) => {
      setFavoriteIds((prev) => {
        const exists = prev.includes(movieId);
        const next = exists ? prev.filter((id) => id !== movieId) : [...prev, movieId];
        void saveFavoriteIds(next);
        return next;
      });
    },
    []
  );

  const value = useMemo<MovieContextValue>(
    () => ({
      movies,
      favoriteIds,
      isOnline,
      isLoading,
      lastSyncedAt,
      refreshFromTmdb,
      toggleFavorite,
    }),
    [movies, favoriteIds, isOnline, isLoading, lastSyncedAt, refreshFromTmdb, toggleFavorite]
  );

  return <MovieContext.Provider value={value}>{children}</MovieContext.Provider>;
}

export function useMovies() {
  const ctx = useContext(MovieContext);
  if (!ctx) {
    throw new Error('useMovies phải được dùng bên trong MovieProvider');
  }
  return ctx;
}

