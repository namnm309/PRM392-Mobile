import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/constants/theme';
import { useMovies } from '@/contexts/MovieContext';
import { useMovieSearch } from '@/hooks/useMovieSearch';
import { SearchBar } from '@/components/SearchBar';

export default function FavoritesScreen() {
  const { movies, favoriteIds, toggleFavorite } = useMovies();
  const router = useRouter();

  const favoriteMovies = movies.filter((m) => favoriteIds.includes(m.id));
  const { query, setQuery, results, hasResults } = useMovieSearch(favoriteMovies, {
    favoriteOnly: true,
  });

  const handleToggleFavorite = (id: number) => {
    void toggleFavorite(id);
  };

  return (
    <TabScreenWrapper>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Phim yêu thích
        </ThemedText>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Tìm kiếm trong danh sách yêu thích..."
          style={styles.searchBar}
        />

        {!hasResults && (
          <Text style={styles.helperText}>
            Không tìm thấy phim yêu thích phù hợp với từ khóa.
          </Text>
        )}

        {favoriteIds.length === 0 && (
          <Text style={styles.helperText}>
            Bạn chưa lưu phim nào vào danh sách yêu thích. Hãy chọn một phim và nhấn nút "Thêm
            vào danh sách yêu thích" ở màn chi tiết.
          </Text>
        )}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
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
              </View>
              <TouchableOpacity
                style={styles.unfavoriteButton}
                onPress={() => handleToggleFavorite(item.id)}
              >
                <Text style={styles.unfavoriteText}>Bỏ</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </ThemedView>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  title: {
    marginBottom: 12,
    color: COLORS.white,
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
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  poster: {
    width: 64,
    height: 96,
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
  unfavoriteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  unfavoriteText: {
    color: COLORS.accentRed,
    fontSize: 12,
    fontWeight: '700',
  },
});

