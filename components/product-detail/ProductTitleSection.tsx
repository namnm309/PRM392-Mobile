import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWishlist } from '@/contexts/WishlistContext';

type ProductTitleSectionProps = {
  productId: string;
  name: string;
  rating?: number;
};

export function ProductTitleSection({ productId, name, rating }: ProductTitleSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wished = isWishlisted(productId);

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
        <TouchableOpacity
          style={styles.wishlist}
          activeOpacity={0.7}
          onPress={() => {
            if (!isSignedIn) {
              router.push({
                pathname: '/(auth)/login',
                params: { redirect: pathname ?? '/' },
              });
              return;
            }
            toggleWishlist(productId).catch(() => {
              // UI is reverted by context on failure
            });
          }}
        >
          <Ionicons
            name={wished ? 'heart' : 'heart-outline'}
            size={22}
            color={COLORS.accentRed}
          />
          <Text style={[styles.wishlistText, wished && styles.wishlistTextActive]}>
            Yêu thích
          </Text>
        </TouchableOpacity>
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
  wishlistTextActive: {
    color: COLORS.accentRed,
    fontWeight: '600',
  },
});
