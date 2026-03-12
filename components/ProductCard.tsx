import type { HomeProduct } from '@/constants/homeProductData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { WishlistButton } from '@/components/WishlistButton';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

type ProductCardProps = {
  product: HomeProduct;
  width?: number;
};

export function ProductCard({ product, width }: ProductCardProps) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = width ?? Math.min(180, (screenWidth - 16 * 2 - 12) / 2);

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      activeOpacity={0.8}
    >
      {product.discountPercent > 0 ? (
        <View style={styles.badgeDiscount}>
          <Text style={styles.badgeText}>Giảm {product.discountPercent}%</Text>
        </View>
      ) : null}
      {product.badgeSecondary ? (
        <View
          style={[
            styles.badgeSecondary,
            product.badgeSecondary === 'Trả góp 0%' && styles.badgeSecondaryBlue,
          ]}
        >
          <Text style={styles.badgeSecondaryText}>{product.badgeSecondary}</Text>
        </View>
      ) : null}

      <View style={styles.imagePlaceholder}>
        {product.imageUri ? (
          <Image source={{ uri: product.imageUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={styles.imagePlaceholderText}>📦</Text>
        )}
      </View>

      {product.specs ? (
        <Text style={styles.specs} numberOfLines={2}>
          {product.specs}
        </Text>
      ) : null}

      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>

      <Text style={styles.priceCurrent}>{formatPrice(product.priceCurrent)}</Text>
      <Text style={styles.priceOriginal}>{formatPrice(product.priceOriginal)}</Text>

      {product.studentPrice != null ? (
        <Text style={styles.studentPrice}>
          Giá S-Student {formatPrice(product.studentPrice)}
        </Text>
      ) : null}

      <View style={styles.footer}>
        {product.rating != null ? (
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color="#FFC107" />
            <Text style={styles.ratingText}>{product.rating}</Text>
          </View>
        ) : null}
        <WishlistButton
          productId={product.id}
          size={18}
          color={COLORS.categoryLinkBlue}
          style={styles.wishlist}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cartBackground,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
  },
  badgeDiscount: {
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
  badgeSecondary: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFB74D',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    zIndex: 1,
  },
  badgeSecondaryBlue: {
    backgroundColor: COLORS.categoryLinkBlue,
  },
  badgeSecondaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  imagePlaceholder: {
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.categoryContentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  specs: {
    fontSize: 11,
    color: COLORS.cartTextSecondary,
    marginBottom: 4,
  },
  productName: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
    fontWeight: '500',
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
  studentPrice: {
    fontSize: 11,
    color: COLORS.studentPricePurple,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
  wishlist: {
    padding: 4,
  },
});
