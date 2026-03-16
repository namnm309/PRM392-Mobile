import { useMemo, useState } from 'react';

import type { Movie } from '@/lib/tmdbApi';

type Options = {
  favoriteOnly?: boolean;
};

export function useMovieSearch(source: Movie[], options: Options = {}) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return source;

    return source.filter((movie) => {
      const title = movie.title.toLowerCase();
      const overview = movie.overview.toLowerCase();
      return title.includes(normalizedQuery) || overview.includes(normalizedQuery);
    });
  }, [normalizedQuery, source]);

  const hasResults = results.length > 0;

  return {
    query,
    setQuery,
    results,
    hasResults,
    favoriteOnly: options.favoriteOnly ?? false,
  };
}

