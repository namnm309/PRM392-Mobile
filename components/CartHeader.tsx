import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export function CartHeader() {
  const insets = useSafeAreaInsets();
  const paddingTop =
    Platform.OS === 'android' && insets.top === 0
      ? (StatusBar.currentHeight ?? 24)
      : insets.top;

  return (
    <View style={[styles.container, { paddingTop }]}>
      <View style={styles.row}>
        <Ionicons name="cart" size={24} color={COLORS.accentRed} />
        <Text style={styles.title}>Giỏ hàng</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
});
