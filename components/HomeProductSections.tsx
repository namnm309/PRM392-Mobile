import { ProductCategorySection } from '@/components/ProductCategorySection';
import { fetchCategories } from '@/lib/categoriesApi';
import type { ApiCategory } from '@/lib/categoriesApi';
import { COLORS } from '@/constants/theme';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';

export function HomeProductSections() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tải danh mục');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <ProductCategorySection key={category.id} category={category} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  centered: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
});
