import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WishlistButton } from '@/components/WishlistButton';

type ProductTitleSectionProps = {
  productId: string;
  name: string;
  rating?: number;
};

export function ProductTitleSection({ productId, name, rating }: ProductTitleSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      <View style={styles.row}>
        {rating != null && (
          <View style={styles.rating}>
            <Ionicons name="star" size={18} color="#FFC107" />
            <Text style={styles.ratingText}>{rating}/5</Text>
          </View>
        )}
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
    gap: 16,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.cartTextSecondary,
  },
  wishlist: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wishlistText: {
    fontSize: 14,
    color: COLORS.cartTextSecondary,
  },
});
