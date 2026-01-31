import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export function CategoryHeader() {
  const insets = useSafeAreaInsets();
  const paddingTop =
    Platform.OS === 'android' && insets.top === 0
      ? (StatusBar.currentHeight ?? 24)
      : insets.top;
  const paddingTopReduced = Math.max(paddingTop - 8, 12);

  return (
    <View style={[styles.container, { paddingTop: paddingTopReduced }]}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={COLORS.grey} />
        <Text style={styles.searchPlaceholder}>Tìm kiếm...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.categoryContentBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: COLORS.grey,
  },
});
