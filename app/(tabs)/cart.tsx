import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartHeader } from '@/components/CartHeader';
import { RemoveFromCartToast } from '@/components/RemoveFromCartToast';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/contexts/CartContext';
import { cartStyles } from '@/styles/cart.styles';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@clerk/clerk-expo';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

function CartItemRow({
  item,
  onToggleSelect,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onToggleSelect: () => void;
  onRemove: () => void;
  onUpdateQuantity: (q: number) => void;
}) {
  const isSelected = item.selected === true;
  const discount = item.priceOriginal - item.priceCurrent;

  return (
    <View style={cartStyles.itemCard}>
      <TouchableOpacity
        style={[cartStyles.itemCheckbox, isSelected && cartStyles.itemCheckboxChecked]}
        onPress={onToggleSelect}
        activeOpacity={0.7}
      >
        {isSelected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
      </TouchableOpacity>
      <View style={cartStyles.itemImage}>
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={cartStyles.itemImagePlaceholder}>📦</Text>
        )}
      </View>
      <View style={cartStyles.itemContent}>
        <Text style={cartStyles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.variantLabel ? (
          <Text style={cartStyles.itemVariantLabel} numberOfLines={1}>
            {item.variantLabel}
          </Text>
        ) : null}
        <Text style={cartStyles.itemPriceCurrent}>
          {formatPrice(item.priceCurrent)}
        </Text>
        <Text style={cartStyles.itemPriceOriginal}>
          {formatPrice(item.priceOriginal)}
        </Text>
        {discount > 0 && (
          <Text style={cartStyles.itemDiscount}>
            Đã giảm {formatPrice(discount)}
          </Text>
        )}
        <View style={cartStyles.itemQuantityRow}>
          <TouchableOpacity
            style={cartStyles.itemQuantityBtn}
            onPress={() =>
              item.quantity <= 1 ? onRemove() : onUpdateQuantity(item.quantity - 1)
            }
            activeOpacity={0.7}
          >
            {item.quantity <= 1 ? (
              <Ionicons name="trash-outline" size={16} color={COLORS.accentRed} />
            ) : (
              <Ionicons name="remove" size={18} color={COLORS.cartTextPrimary} />
            )}
          </TouchableOpacity>
          <Text style={cartStyles.itemQuantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={cartStyles.itemQuantityBtn}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const {
    items,
    removeItem,
    updateQuantity,
    toggleSelect,
    selectAll,
    subtotal,
  } = useCart();

  const isEmpty = items.length === 0;
  const allSelected = items.length > 0 && items.every((i) => i.selected === true);
  const [showRemoveToast, setShowRemoveToast] = useState(false);
  const removeToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outOfStockHandledRef = useRef(false);

  useEffect(() => {
    if (items.length === 0) return;

    const outOfStockItems = items.filter(
      (item) => item.isAvailable === false || item.maxQuantity === 0,
    );

    if (outOfStockItems.length === 0) {
      return;
    }

    if (!outOfStockHandledRef.current) {
      outOfStockHandledRef.current = true;
      Alert.alert(
        'Thông báo',
        'Một số sản phẩm trong giỏ hàng đã hết hàng và sẽ được xoá khỏi giỏ.',
      );
    }

    outOfStockItems.forEach((item) => {
      removeItem(item.id);
    });
  }, [items, removeItem]);

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    setShowRemoveToast(true);
    if (removeToastTimeoutRef.current) clearTimeout(removeToastTimeoutRef.current);
    removeToastTimeoutRef.current = setTimeout(() => {
      setShowRemoveToast(false);
      removeToastTimeoutRef.current = null;
    }, 2000);
  };

  const handleDismissRemoveToast = () => {
    setShowRemoveToast(false);
    if (removeToastTimeoutRef.current) {
      clearTimeout(removeToastTimeoutRef.current);
      removeToastTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (removeToastTimeoutRef.current) clearTimeout(removeToastTimeoutRef.current);
    };
  }, []);

  const handleExploreProducts = () => {
    router.push('/(tabs)/store');
  };

  const handleBuyNow = () => {
    if (isEmpty) return;
    const selectedCount = items.filter(item => item.selected === true).length;
    if (selectedCount === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }
    if (!isSignedIn) {
      router.push({
        pathname: '/(auth)/login',
        params: { redirect: '/checkout' },
      });
      return;
    }
    router.push('/checkout');
  };

  const handleSelectAll = () => {
    selectAll(!allSelected);
  };

  return (
    <TabScreenWrapper>
      <View style={cartStyles.screen}>
        <CartHeader />

        {isEmpty ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={cartStyles.emptyContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={cartStyles.emptyCard}>
              <View style={cartStyles.emptyCardIconWrap}>
                <Ionicons
                  name="cart-outline"
                  size={60}
                  color={COLORS.cartTextSecondary}
                />
              </View>
              <Text style={cartStyles.emptyCardTitle}>Giỏ hàng trống</Text>
              <Text style={cartStyles.emptyCardSubtitle}>
                Thêm sản phẩm để bắt đầu mua sắm
              </Text>
              <Pressable
                style={cartStyles.emptyCardCta}
                onPress={handleExploreProducts}
                android_ripple={{ color: COLORS.cartPrimaryDark }}
              >
                <Text style={cartStyles.emptyCardCtaText}>Khám phá sản phẩm</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={cartStyles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onToggleSelect={() => toggleSelect(item.id)}
                onRemove={() => handleRemoveItem(item.id)}
                onUpdateQuantity={(q) => updateQuantity(item.id, q)}
              />
            ))}
          </ScrollView>
        )}

        <RemoveFromCartToast
          visible={showRemoveToast}
          onDismiss={handleDismissRemoveToast}
        />

        <View
          style={[
            cartStyles.footer,
            { paddingBottom: Math.max(insets.bottom, 14) + 14 },
          ]}
        >
          <View style={cartStyles.footerLeft}>
            {!isEmpty && (
              <TouchableOpacity
                style={cartStyles.footerSelectAll}
                onPress={handleSelectAll}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    cartStyles.footerSelectAllCheckbox,
                    allSelected && cartStyles.footerSelectAllCheckboxChecked,
                  ]}
                >
                  {allSelected && (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  )}
                </View>
                <Text style={cartStyles.footerSelectAllLabel}>Chọn tất cả</Text>
              </TouchableOpacity>
            )}
            <Text style={cartStyles.footerSubtotalRed}>
              Tạm tính: {formatPrice(subtotal)}
            </Text>
          </View>
          <Pressable
            style={[
              cartStyles.footerButton,
              isEmpty && cartStyles.footerButtonDisabled,
            ]}
            onPress={handleBuyNow}
            disabled={isEmpty}
          >
            <Text style={cartStyles.footerButtonText}>Mua ngay</Text>
          </Pressable>
        </View>
      </View>
    </TabScreenWrapper>
  );
}
