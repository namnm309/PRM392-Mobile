import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WishlistButton } from '@/components/WishlistButton';

type ProductTitleSectionProps = {
  productId: string;
  name: string;
  rating?: number;
  inStock?: boolean;
};

export function ProductTitleSection({
  productId,
  name,
  rating,
  inStock = true,
}: ProductTitleSectionProps) {
  const ratingText =
    rating == null
      ? null
      : Number.isInteger(rating)
        ? String(rating)
        : rating.toFixed(1);

  return (
    <View style={styles.container}>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      <View style={styles.row}>
        <View style={styles.leftCol}>
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: inStock ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text
              style={[
                styles.stockText,
                { color: inStock ? '#10B981' : '#EF4444' },
              ]}
            >
              {inStock ? 'Còn hàng' : 'Hết hàng'}
            </Text>
            {ratingText && (
              <>
                <View style={styles.stockDivider} />
                <View style={styles.inlineRating}>
                  <Ionicons name="star" size={14} color="#FFC107" />
                  <Text style={styles.inlineRatingText}>{ratingText}</Text>
                </View>
              </>
            )}
          </View>
        </View>
        <View style={styles.wishlist}>
          <WishlistButton
            productId={productId}
            size={22}
            color={COLORS.accentRed}
            fetchInitial
          />
          <Text style={styles.wishlistText}>Yêu thích</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  leftCol: {
    flexDirection: 'column',
    gap: 4,
  },
  wishlist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.categoryChipBorder,
    marginHorizontal: 4,
  },
  inlineRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineRatingText: {
    fontSize: 13,
    color: COLORS.cartTextSecondary,
    fontWeight: '600',
  },
  stockDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '500',
  },
  wishlistText: {
    fontSize: 14,
    color: COLORS.cartTextSecondary,
  },
});
