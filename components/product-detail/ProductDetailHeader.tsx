import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CART_BADGE_COUNT = 2;

export function ProductDetailHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const paddingTop =
    Platform.OS === 'android' && insets.top === 0
      ? (StatusBar.currentHeight ?? 24)
      : insets.top;

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.promoBanner}>
        <Text style={styles.promoText}>
          Trao Tết "ANt" deal ngập tràn - Chọn quà ngay!
        </Text>
      </View>
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.cartTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Thông tin sản phẩm
        </Text>
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={22} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cart')}
            style={styles.cartButton}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={22} color={COLORS.cartTextPrimary} />
            {CART_BADGE_COUNT > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{CART_BADGE_COUNT}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },
  promoBanner: {
    backgroundColor: COLORS.accentRed,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  promoText: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  iconButton: {
    padding: 4,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    textAlign: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accentRed,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
  },
});
