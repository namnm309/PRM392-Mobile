import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { COLORS } from '@/constants/theme';

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'vivo'];

export type FeaturedProduct = {
  id: string;
  name: string;
  priceCurrent: number;
  priceOriginal: number;
  discountPercent: number;
  imageUri?: string | null;
};

const MOCK_PRODUCTS: FeaturedProduct[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    priceCurrent: 29990000,
    priceOriginal: 34990000,
    discountPercent: 2,
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    priceCurrent: 27990000,
    priceOriginal: 29990000,
    discountPercent: 1,
  },
  {
    id: '3',
    name: 'Xiaomi 14',
    priceCurrent: 15990000,
    priceOriginal: 17990000,
    discountPercent: 5,
  },
];

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

export function HomeFeaturedProducts() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(160, (width - 16 * 2 - 12) / 2);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>ĐIỆN THOẠI NỔI BẬT NHẤT</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsWrap}
        style={styles.chipsScroll}
      >
        {BRANDS.map((brand) => (
          <TouchableOpacity
            key={brand}
            style={[
              styles.chip,
              selectedBrand === brand && styles.chipSelected,
            ]}
            onPress={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedBrand === brand && styles.chipTextSelected,
              ]}
            >
              {brand}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsWrap}
      >
        {MOCK_PRODUCTS.map((item) => (
          <View key={item.id} style={[styles.productCard, { width: cardWidth }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Giảm {item.discountPercent}%</Text>
            </View>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>📱</Text>
            </View>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.priceCurrent}>
              {formatPrice(item.priceCurrent)}
            </Text>
            <Text style={styles.priceOriginal}>
              {formatPrice(item.priceOriginal)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.accentRed,
    fontWeight: '500',
  },
  chipsScroll: {
    marginBottom: 12,
  },
  chipsWrap: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    paddingRight: 32,
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
  productsWrap: {
    paddingHorizontal: 16,
    gap: 12,
    flexDirection: 'row',
    paddingRight: 32,
  },
  productCard: {
    backgroundColor: COLORS.cartBackground,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.accentRed,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
  imagePlaceholder: {
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  productName: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
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
    marginTop: 2,
  },
});
