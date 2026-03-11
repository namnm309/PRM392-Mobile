import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { addToWishlist, getWishlistStatus, removeFromWishlist } from '@/lib/wishlistApi';
import { COLORS } from '@/constants/theme';

type WishlistButtonProps = {
  productId: string;
  size?: number;
  color?: string;
  fetchInitial?: boolean;
  style?: ViewStyle;
};

export function WishlistButton({
  productId,
  size = 18,
  color = COLORS.accentRed,
  fetchInitial = false,
  style,
}: WishlistButtonProps) {
  const { isSignedIn, getToken } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchInitial || !productId || !isSignedIn) return;
    let cancelled = false;
    getWishlistStatus(getToken, productId)
      .then((r) => {
        if (!cancelled) setIsInWishlist(r.isInWishlist);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [productId, isSignedIn, fetchInitial, getToken]);

  const toggle = useCallback(async () => {
    if (!isSignedIn) {
      Alert.alert(
        'Đăng nhập',
        'Vui lòng đăng nhập để thêm sản phẩm vào yêu thích',
        [{ text: 'OK' }]
      );
      return;
    }
    if (loading) return;
    setLoading(true);
    const prev = isInWishlist;
    setIsInWishlist(!prev);
    try {
      if (prev) {
        await removeFromWishlist(getToken, productId);
      } else {
        await addToWishlist(getToken, productId);
      }
    } catch (err: any) {
      setIsInWishlist(prev);
      Alert.alert('Lỗi', err?.message || 'Không thể cập nhật yêu thích');
    } finally {
      setLoading(false);
    }
  }, [productId, isSignedIn, isInWishlist, loading, getToken]);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={toggle}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name={isInWishlist ? 'heart' : 'heart-outline'}
        size={size}
        color={isInWishlist ? COLORS.accentRed : color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});
