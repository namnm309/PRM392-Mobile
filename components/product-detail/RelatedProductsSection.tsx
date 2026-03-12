import type { HomeProduct } from '@/constants/homeProductData';
import { COLORS } from '@/constants/theme';
import { fetchProducts, mapApiProductToHomeProduct } from '@/lib/productsApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type RelatedProductsSectionProps = {
  categoryId?: string | null;
  currentProductId: string;
};

export function RelatedProductsSection({
  categoryId,
  currentProductId,
}: RelatedProductsSectionProps) {
  const router = useRouter();
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProducts({ categoryId, limit: 12 })
      .then((data) => {
        if (cancelled) return;
        const mapped = data
          .map(mapApiProductToHomeProduct)
          .filter((p) => p.id !== currentProductId)
          .slice(0, 6);
        setProducts(mapped);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Không thể tải sản phẩm liên quan');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, currentProductId]);

  if (!categoryId) return null;
  if (!loading && (error || products.length === 0)) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sản phẩm liên quan</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.headerBlue} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <View style={styles.list}>
          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/product/[id]',
                  params: { id: product.id },
                })
              }
            >
              <View style={styles.imageBox}>
                {product.imageUri ? (
                  <Image
                    source={{ uri: product.imageUri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="image-outline" size={26} color={COLORS.grey} />
                )}
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {product.name}
                </Text>
                <View style={styles.prices}>
                  <Text style={styles.priceCurrent}>
                    {new Intl.NumberFormat('vi-VN').format(product.priceCurrent)}₫
                  </Text>
                  <Text style={styles.priceOriginal}>
                    {new Intl.NumberFormat('vi-VN').format(product.priceOriginal)}₫
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.categoryChipTextSecondary,
  },
  list: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cartBorder,
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  priceOriginal: {
    fontSize: 12,
    color: COLORS.grey,
    textDecorationLine: 'line-through',
  },
});

