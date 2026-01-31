import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

const CATEGORIES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Điện thoại, Tablet', icon: 'phone-portrait-outline' },
  { label: 'Laptop', icon: 'laptop-outline' },
  { label: 'Đồng hồ', icon: 'watch-outline' },
  { label: 'Âm thanh', icon: 'headset-outline' },
  { label: 'Đồ gia dụng', icon: 'home-outline' },
  { label: 'Màn hình', icon: 'desktop-outline' },
  { label: 'Tivi', icon: 'tv-outline' },
  { label: 'Phụ kiện', icon: 'hardware-chip-outline' },
  { label: 'Hàng cũ', icon: 'refresh-outline' },
  { label: 'Khuyến mãi', icon: 'pricetag-outline' },
];

const COLS = 5;

export function HomeCategories() {
  return (
    <View style={styles.container}>
      {[0, 1].map((rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {CATEGORIES.slice(rowIndex * COLS, (rowIndex + 1) * COLS).map(
            (cat, i) => (
              <TouchableOpacity
                key={cat.label}
                style={styles.cell}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={COLORS.headerBlue}
                  />
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    maxWidth: '20%',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.categoryContentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: COLORS.categoryChipText,
    textAlign: 'center',
  },
});
