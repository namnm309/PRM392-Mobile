import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const paddingTop =
    Platform.OS === 'android' && insets.top === 0
      ? (StatusBar.currentHeight ?? 24)
      : insets.top;
  const iconColor = COLORS.accentRed;

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.locationBlock} activeOpacity={0.7}>
          <Ionicons name="location" size={20} color={iconColor} />
          <View>
            <Text style={styles.locationLabel}>Xem giá tại</Text>
            <Text style={styles.locationCity}>Hồ Chí Minh</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={iconColor} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm</Text>
        </View>

        <TouchableOpacity style={styles.bellButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 80,
  },
  locationLabel: {
    fontSize: 11,
    color: COLORS.cartTextSecondary,
    opacity: 0.9,
  },
  locationCity: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  searchWrapper: {
    flex: 1,
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
  bellButton: {
    padding: 4,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
