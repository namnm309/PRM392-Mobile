import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHECK_GREEN = '#4CAF50';
const CART_FOOTER_OFFSET = 90;

type RemoveFromCartToastProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function RemoveFromCartToast({ visible, onDismiss }: RemoveFromCartToastProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = CART_FOOTER_OFFSET + Math.max(insets.bottom, 14) + 14;

  if (!visible) return null;

  return (
    <View
      style={[styles.wrapper, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.toast}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.message}>Xóa sản phẩm thành công</Text>
        <Pressable
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={12}
          accessibilityLabel="Đóng"
        >
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CHECK_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
});
