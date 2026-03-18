import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

type ProductDetailBottomBarProps = {
  priceCurrent: number;
  priceOriginal: number;
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  inStock?: boolean;
  disabled?: boolean;
};

export function ProductDetailBottomBar({
  priceCurrent,
  priceOriginal,
  onAddToCart,
  onBuyNow,
  inStock = true,
  disabled = false,
}: ProductDetailBottomBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  const hasDiscount = priceOriginal > priceCurrent;

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Giá</Text>
        <View style={styles.prices}>
          {hasDiscount && (
            <Text style={styles.priceOriginal}>{formatPrice(priceOriginal)}</Text>
          )}
          <Text style={styles.priceCurrent}>{formatPrice(priceCurrent)}</Text>
        </View>
      </View>
      {inStock ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.buyBtn, disabled && styles.actionDisabled]}
            activeOpacity={0.7}
            onPress={onBuyNow}
            disabled={disabled}
          >
            <Text style={styles.buyText}>Mua ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cartBtn, disabled && styles.actionDisabled]}
            activeOpacity={0.7}
            onPress={onAddToCart}
            disabled={disabled}
          >
            <View style={styles.cartIcons}>
              <Ionicons name="cart" size={22} color={COLORS.accentRed} />
              <Ionicons name="add" size={14} color={COLORS.accentRed} />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.outOfStockWrap}>
          <Text style={styles.outOfStockText}>Hết hàng</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
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
  buyBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  cartBtn: {
    width: 52,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  outOfStockWrap: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  outOfStockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
