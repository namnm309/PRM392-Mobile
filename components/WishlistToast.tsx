import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

const BOTTOM_BAR_OFFSET = 100;

type WishlistToastProps = {
  visible: boolean;
  message: string;
  onDismiss: () => void;
};

export function WishlistToast({ visible, message, onDismiss }: WishlistToastProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = BOTTOM_BAR_OFFSET + Math.max(insets.bottom, 12);

  if (!visible) return null;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Animated.View
        style={styles.toast}
        entering={FadeInDown.duration(180)}
        exiting={FadeOutDown.duration(160)}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="heart" size={18} color={COLORS.white} />
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          style={styles.closeBtn}
          onPress={onDismiss}
          hitSlop={12}
          accessibilityLabel="Đóng"
        >
          <Ionicons name="close" size={22} color={COLORS.white} />
        </Pressable>
      </Animated.View>
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
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  closeBtn: {
    padding: 4,
  },
});

