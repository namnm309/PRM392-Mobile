import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';

import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/constants/theme';
import { useMovies } from '@/contexts/MovieContext';
import { useMovieSearch } from '@/hooks/useMovieSearch';
import { SearchBar } from '@/components/SearchBar';
import { useRouter } from 'expo-router';

export default function MoviesListScreen() {
  const { movies, favoriteIds, isOnline, isLoading } = useMovies();
  const router = useRouter();

  const { query, setQuery, results } = useMovieSearch(movies, {
    favoriteOnly: false,
  });

  const data = useMemo(() => results, [results]);

  return (
    <TabScreenWrapper>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Danh sách phim
          </ThemedText>
          <Text style={[styles.status, isOnline ? styles.online : styles.offline]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm kiếm phim..."
          style={styles.searchBar}
        />

        {isLoading && (
          <Text style={styles.helperText}>Đang tải dữ liệu phim...</Text>
        )}

        {!isLoading && data.length === 0 && (
          <Text style={styles.helperText}>
            Không tìm thấy phim nào phù hợp với từ khóa.
          </Text>
        )}

        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isFavorite = favoriteIds.includes(item.id);
            return (
              <TouchableOpacity
                style={[styles.card, isFavorite && styles.cardFavorite]}
                onPress={() => router.push(`/(movies)/${item.id}`)}
              >
                {item.posterPath ? (
                  <Image source={{ uri: item.posterPath }} style={styles.poster} />
                ) : (
                  <View style={[styles.poster, styles.posterPlaceholder]}>
                    <Text style={styles.posterPlaceholderText}>Không ảnh</Text>
                  </View>
                )}
                <View style={styles.cardContent}>
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.releaseDate && (
                    <Text style={styles.movieMeta}>Ngày phát hành: {item.releaseDate}</Text>
                  )}
                  {item.voteAverage != null && (
                    <Text style={styles.movieMeta}>Điểm TMDB: {item.voteAverage.toFixed(1)}</Text>
                  )}
                </View>
                {isFavorite && (
                  <View style={styles.favoriteBadge}>
                    <Text style={styles.favoriteBadgeText}>Yêu thích</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </ThemedView>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: COLORS.white,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
  online: {
    color: COLORS.primary,
  },
  offline: {
    color: COLORS.accentRed,
  },
  searchBar: {
    marginBottom: 8,
  },
  helperText: {
    marginVertical: 8,
    color: COLORS.grey,
    fontSize: 14,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  cardFavorite: {
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  poster: {
    width: 72,
    height: 108,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    color: COLORS.grey,
    fontSize: 12,
  },
  cardContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  movieTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  movieMeta: {
    color: COLORS.grey,
    fontSize: 13,
  },
  favoriteBadge: {
    backgroundColor: COLORS.accentRed,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  favoriteBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

