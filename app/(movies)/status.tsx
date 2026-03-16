import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COLORS } from '@/constants/theme';
import { useMovies } from '@/contexts/MovieContext';

export default function MovieStatusScreen() {
  const router = useRouter();
  const { isOnline, isLoading, movies, lastSyncedAt, refreshFromTmdb } = useMovies();

  const lastSyncText =
    lastSyncedAt != null
      ? new Date(lastSyncedAt).toLocaleString('vi-VN')
      : 'Chưa từng đồng bộ';

  const handleRefresh = () => {
    void refreshFromTmdb();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        <ThemedText type="title" style={styles.title}>
          Trạng thái dữ liệu phim
        </ThemedText>

        <View style={styles.row}>
          <Text style={styles.label}>Trạng thái kết nối:</Text>
          <Text style={[styles.value, isOnline ? styles.online : styles.offline]}>
            {isOnline == null
              ? 'Đang kiểm tra...'
              : isOnline
              ? 'Đang online'
              : 'Đang offline'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Lần đồng bộ gần nhất:</Text>
          <Text style={styles.value}>{lastSyncText}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Số lượng phim trong cache:</Text>
          <Text style={styles.value}>{movies.length}</Text>
        </View>

        {!isOnline && movies.length === 0 && (
          <View style={styles.offlineWarning}>
            <Text style={styles.offlineWarningText}>
              Hiện chưa có dữ liệu phim trong máy. Hãy kết nối mạng và nhấn "Tải dữ liệu từ
              TMDB" để đồng bộ.
            </Text>
          </View>
        )}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton, !isOnline && styles.buttonDisabled]}
            disabled={!isOnline || isLoading}
            onPress={handleRefresh}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Tải dữ liệu từ TMDB</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/(movies)')}
          >
            <Text style={styles.secondaryButtonText}>Xem danh sách phim</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => router.push('/(movies)/favorites')}
          >
            <Text style={styles.secondaryButtonText}>Xem phim đã lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: COLORS.grey,
    fontSize: 14,
  },
  value: {
    color: COLORS.white,
    fontWeight: '600',
  },
  online: {
    color: COLORS.primary,
  },
  offline: {
    color: COLORS.accentRed,
  },
  offlineWarning: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.accentRed,
  },
  offlineWarningText: {
    color: COLORS.white,
    fontSize: 14,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: COLORS.surfaceLight,
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

