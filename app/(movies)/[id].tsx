import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/constants/theme';
import { useMovies } from '@/contexts/MovieContext';

export default function MovieDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { movies, favoriteIds, toggleFavorite, isOnline } = useMovies();

  const movieId = Number(params.id);

  const movie = useMemo(
    () => movies.find((m) => m.id === movieId),
    [movies, movieId]
  );

  const isFavorite = favoriteIds.includes(movieId);

  if (!movie) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="title">Không tìm thấy phim</ThemedText>
        <Text style={styles.helperText}>
          Vui lòng quay lại danh sách phim và thử chọn lại.
        </Text>
      </ThemedView>
    );
  }

  const handleToggleFavorite = () => {
    void toggleFavorite(movie.id);
  };

  return (
    <TabScreenWrapper>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {movie.posterPath ? (
            <Image source={{ uri: movie.posterPath }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.posterPlaceholderText}>Không có ảnh poster</Text>
            </View>
          )}

          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.title}>
              {movie.title}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            {movie.releaseDate && (
              <Text style={styles.metaText}>Ngày phát hành: {movie.releaseDate}</Text>
            )}
            {movie.voteAverage != null && (
              <Text style={styles.metaText}>Điểm TMDB: {movie.voteAverage.toFixed(1)}</Text>
            )}
          </View>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
              <Text style={styles.badgeText}>
                {isOnline ? 'Đang online' : 'Đang offline (xem từ cache)'}
              </Text>
            </View>
            {isFavorite && (
              <View style={[styles.badge, styles.badgeFavorite]}>
                <Text style={styles.badgeText}>Đã lưu yêu thích</Text>
              </View>
            )}
          </View>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Tóm tắt nội dung
          </ThemedText>
          <Text style={styles.overview}>{movie.overview}</Text>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favoriteButtonText}>
              {isFavorite ? 'Bỏ khỏi danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}
            </Text>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  helperText: {
    marginTop: 8,
    color: COLORS.grey,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  poster: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    color: COLORS.grey,
  },
  headerRow: {
    marginBottom: 8,
  },
  title: {
    color: COLORS.white,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    color: COLORS.grey,
    fontSize: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeOnline: {
    backgroundColor: COLORS.primary,
  },
  badgeOffline: {
    backgroundColor: COLORS.accentRed,
  },
  badgeFavorite: {
    backgroundColor: COLORS.gradientPurple,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    marginBottom: 8,
    color: COLORS.white,
  },
  overview: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  favoriteButton: {
    backgroundColor: COLORS.accentRed,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  favoriteButtonActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  favoriteButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});

