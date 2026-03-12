import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { CategoryHeader } from '@/components/CategoryHeader';
import { ProductCard } from '@/components/ProductCard';
import { COLORS } from '@/constants/theme';
import { fetchCategories } from '@/lib/categoriesApi';
import type { ApiCategory } from '@/lib/categoriesApi';
import {
  fetchProducts,
  mapApiProductToHomeProduct,
} from '@/lib/productsApi';
import type { HomeProduct } from '@/constants/homeProductData';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';

const SIDEBAR_WIDTH = 88;

export default function CategoryScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();
  const { categoryId: paramCategoryId } = useLocalSearchParams<{
    categoryId?: string;
  }>();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  const { width } = useWindowDimensions();
  const cardWidth = (width - SIDEBAR_WIDTH - 16 - 16 - 12) / 2;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const categoryLabel = selectedCategory?.name ?? 'Danh mục';

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data);
          const initialId =
            paramCategoryId && data.some((c) => c.id === paramCategoryId)
              ? paramCategoryId
              : data[0]?.id ?? null;
          setSelectedCategoryId(initialId);
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paramCategoryId]);

  const categoryIdToFetch = selectedSubId ?? selectedCategoryId;

  useEffect(() => {
    if (!categoryIdToFetch) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    let cancelled = false;
    setProductsLoading(true);
    fetchProducts({ categoryId: categoryIdToFetch })
      .then((data) => {
        if (!cancelled) {
          setProducts(data.map(mapApiProductToHomeProduct));
        }
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [categoryIdToFetch]);

  const handleSubPress = (childId: string) => {
    setSelectedSubId(selectedSubId === childId ? null : childId);
  };

  if (loading) {
    return (
      <TabScreenWrapper>
        <View style={[styles.screen, styles.centered]}>
          <ActivityIndicator size="small" color={COLORS.headerBlue} />
        </View>
      </TabScreenWrapper>
    );
  }

  if (categories.length === 0) {
    return (
      <TabScreenWrapper>
        <View style={[styles.screen, styles.centered]}>
          <Text style={styles.errorText}>Chưa có danh mục</Text>
        </View>
      </TabScreenWrapper>
    );
  }

  return (
    <TabScreenWrapper>
      <View style={styles.screen}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <CategoryHeader />
          <View style={styles.body}>
            <View style={styles.sidebar}>
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.sidebarItem,
                      isSelected && styles.sidebarItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedSubId(null);
                    }}
                    activeOpacity={0.7}
                  >
                    {isSelected ? (
                      <View style={styles.sidebarRedBar} />
                    ) : null}
                    <View style={styles.sidebarIconWrap}>
                      {cat.imageUrl ? (
                        <Image
                          source={{ uri: cat.imageUrl }}
                          style={styles.sidebarIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="grid-outline"
                          size={36}
                          color={isSelected ? COLORS.accentRed : COLORS.categoryChipTextSecondary}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.sidebarText,
                        isSelected && styles.sidebarTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={[
                styles.contentScrollContent,
                { paddingBottom: tabBarBottomPadding },
              ]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.titleRow}>
                <Text style={styles.categoryTitle}>{categoryLabel}</Text>
              </View>

              {selectedCategory && selectedCategory.children.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Hãng / Loại</Text>
                  <View style={styles.chipRow}>
                    {selectedCategory.children.map((child) => (
                      <TouchableOpacity
                        key={child.id}
                        style={[
                          styles.chip,
                          selectedSubId === child.id && styles.chipSelected,
                        ]}
                        onPress={() => handleSubPress(child.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedSubId === child.id &&
                              styles.chipTextSelected,
                          ]}
                        >
                          {child.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sản phẩm</Text>
                {productsLoading ? (
                  <View style={styles.productsLoading}>
                    <ActivityIndicator size="small" color={COLORS.headerBlue} />
                  </View>
                ) : products.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có sản phẩm</Text>
                ) : (
                  <View style={styles.productsGrid}>
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        width={cardWidth}
                      />
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </TabScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: COLORS.categoryContentBg,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.categoryChipBorder,
  },
  sidebarItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    position: 'relative',
  },
  sidebarItemSelected: {
    backgroundColor: '#fff',
  },
  sidebarRedBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accentRed,
  },
  sidebarIconWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sidebarIcon: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  sidebarText: {
    fontSize: 12,
    color: COLORS.categoryChipTextSecondary,
    textAlign: 'center',
  },
  sidebarTextSelected: {
    color: COLORS.accentRed,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.categoryChipText,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.categoryChipText,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.categoryChipBorder,
  },
  chipSelected: {
    backgroundColor: COLORS.accentRed,
    borderColor: COLORS.accentRed,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  productsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.categoryChipText,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.categoryChipText,
  },
});
