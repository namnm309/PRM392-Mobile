import { fetchCategories } from '@/lib/categoriesApi';
import type { ApiCategory } from '@/lib/categoriesApi';
import { COLORS } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLS = 5;
const MAX_ITEMS = 10;

const FALLBACK_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Điện thoại': 'phone-portrait-outline',
  'Tablet': 'tablet-portrait-outline',
  'Laptop': 'laptop-outline',
  'Âm thanh': 'headset-outline',
  'Đồng hồ': 'watch-outline',
  'Màn hình': 'desktop-outline',
  'Tivi': 'tv-outline',
  default: 'grid-outline',
};

function getIconForCategory(name: string): keyof typeof Ionicons.glyphMap {
  return FALLBACK_ICONS[name] ?? FALLBACK_ICONS.default;
}

export function HomeCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data.slice(0, MAX_ITEMS));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Lỗi tải danh mục');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePress = (categoryId: string) => {
    router.push({ pathname: '/category' as const, params: { categoryId } });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="small" color={COLORS.headerBlue} />
      </View>
    );
  }

  if (error || categories.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error ?? 'Chưa có danh mục'}</Text>
      </View>
    );
  }

  const rows = Math.ceil(categories.length / COLS);

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {categories
            .slice(rowIndex * COLS, (rowIndex + 1) * COLS)
            .map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.cell}
                activeOpacity={0.7}
                onPress={() => handlePress(cat.id)}
              >
                <View style={styles.iconBox}>
                  {cat.imageUrl ? (
                    <Image
                      source={{ uri: cat.imageUrl }}
                      style={styles.iconImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={getIconForCategory(cat.name)}
                      size={28}
                      color={COLORS.headerBlue}
                    />
                  )}
                </View>
                <Text style={styles.label} numberOfLines={2}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
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
  centered: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
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
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  label: {
    fontSize: 11,
    color: COLORS.categoryChipText,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
});
