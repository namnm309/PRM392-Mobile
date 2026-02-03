import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

type ProductDetailBottomBarProps = {
  priceCurrent: number;
  priceOriginal: number;
};

export function ProductDetailBottomBar({
  priceCurrent,
  priceOriginal,
}: ProductDetailBottomBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.left}>
        <Text style={styles.snewLabel}>Đặc quyền SNew</Text>
        <View style={styles.prices}>
          <Text style={styles.priceOriginal}>{formatPrice(priceOriginal)}</Text>
          <Text style={styles.priceCurrent}>{formatPrice(priceCurrent)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.phoneIcon} activeOpacity={0.7}>
          <Ionicons name="call" size={22} color={COLORS.accentRed} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.installmentBtn} activeOpacity={0.7}>
          <Text style={styles.installmentText}>Trả góp 0%</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyBtn} activeOpacity={0.7}>
          <Text style={styles.buyText}>Mua ngay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7}>
          <Ionicons name="cart" size={22} color={COLORS.accentRed} />
          <Ionicons name="add" size={16} color={COLORS.accentRed} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
  },
  left: {},
  snewLabel: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
    marginBottom: 2,
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceOriginal: {
    fontSize: 13,
    color: COLORS.grey,
    textDecorationLine: 'line-through',
  },
  priceCurrent: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneIcon: {
    padding: 8,
  },
  installmentBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.categoryLinkBlue,
    backgroundColor: COLORS.white,
  },
  installmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.categoryLinkBlue,
  },
  buyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
  },
  buyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
