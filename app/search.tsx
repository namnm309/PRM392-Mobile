import { COLORS } from '@/constants/theme';
import { getSearchHistory, addSearchTerm, clearSearchHistory } from '@/lib/searchHistory';
import { fetchProducts, mapApiProductToHomeProduct } from '@/lib/productsApi';
import type { HomeProduct } from '@/constants/homeProductData';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [allProducts, setAllProducts] = useState<HomeProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSearchHistory()
      .then((items) => {
        if (!cancelled) setHistory(items);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setProductsError(null);
    fetchProducts({ limit: 200 })
      .then((data) => {
        if (cancelled) return;
        setAllProducts(data.map(mapApiProductToHomeProduct));
      })
      .catch((err) => {
        if (cancelled) return;
        setProductsError(err instanceof Error ? err.message : 'Không thể tải sản phẩm gợi ý');
        setAllProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    const term = query.trim();
    if (!term) return;
    setLoadingHistory(true);
    const next = await addSearchTerm(term);
    setHistory(next);
    setLoadingHistory(false);
    Keyboard.dismiss();
  }, [query]);

  const handleClearAll = useCallback(async () => {
    setLoadingHistory(true);
    await clearSearchHistory();
    setHistory([]);
    setLoadingHistory(false);
  }, []);

  const suggestedProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return allProducts
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 20);
  }, [allProducts, query]);

  const paddingTop = insets.top + 8;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={COLORS.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Bạn muốn mua gì hôm nay?"
            placeholderTextColor={COLORS.grey}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoFocus
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim().length === 0 && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Lịch sử tìm kiếm</Text>
                {history.length > 0 && (
                  <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
                    <Text style={styles.clearAllText}>Xóa tất cả</Text>
                  </TouchableOpacity>
                )}
              </View>
              {loadingHistory ? (
                <View style={styles.historyLoading}>
                  <ActivityIndicator size="small" color={COLORS.headerBlue} />
                </View>
              ) : history.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có lịch sử tìm kiếm</Text>
              ) : (
                <View>
                  {history.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.historyRow}
                      activeOpacity={0.7}
                      onPress={() => setQuery(item)}
                    >
                      <Ionicons name="time-outline" size={18} color={COLORS.grey} />
                      <Text style={styles.historyText} numberOfLines={1}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

          </>
        )}

        {query.trim().length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sản phẩm gợi ý</Text>
            {loadingProducts ? (
              <View style={styles.productsLoading}>
                <ActivityIndicator size="small" color={COLORS.headerBlue} />
              </View>
            ) : productsError ? (
              <Text style={styles.emptyText}>{productsError}</Text>
            ) : suggestedProducts.length === 0 ? (
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp</Text>
            ) : (
              <View style={styles.suggestedList}>
                {suggestedProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.suggestedRow}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: product.id },
                      })
                    }
                  >
                    <View style={styles.suggestedImageBox}>
                      {product.imageUri ? (
                        <Image
                          source={{ uri: product.imageUri }}
                          style={styles.suggestedImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons name="image-outline" size={24} color={COLORS.grey} />
                      )}
                    </View>
                    <View style={styles.suggestedInfo}>
                      <Text style={styles.suggestedName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <View style={styles.suggestedPrices}>
                        <Text style={styles.suggestedPriceCurrent}>
                          {formatPrice(product.priceCurrent)}
                        </Text>
                        <Text style={styles.suggestedPriceOriginal}>
                          {formatPrice(product.priceOriginal)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.accentRed,
    gap: 8,
  },
  backButton: {
    padding: 6,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  clearAllText: {
    fontSize: 13,
    color: COLORS.accentRed,
  },
  historyLoading: {
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.categoryChipTextSecondary,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  productsLoading: {
    paddingVertical: 8,
  },
  suggestedList: {
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cartBorder,
  },
  suggestedImageBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestedImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  suggestedPrices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestedPriceCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  suggestedPriceOriginal: {
    fontSize: 12,
    color: COLORS.grey,
    textDecorationLine: 'line-through',
  },
});

