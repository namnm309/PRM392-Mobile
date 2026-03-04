import React, { type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';

const HEADER_CONTENT_HEIGHT = 44;
const BASE_PADDING_H = 16;
const BASE_TITLE_SIZE = 18;
const LARGE_MIN_WIDTH = 600;

type AdaptiveHeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
  transparent?: boolean;
  /** 'dark' = nền tối, chữ trắng (mặc định); 'light' = nền trắng, chữ đen */
  variant?: 'dark' | 'light';
};

const LIGHT_BG = '#FFFFFF';
const LIGHT_BORDER = '#E0E0E0';
const LIGHT_TITLE = '#212121';

export function AdaptiveHeader({
  title,
  left,
  right,
  transparent = false,
  variant = 'dark',
}: AdaptiveHeaderProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LARGE_MIN_WIDTH;

  const paddingHorizontal = isLargeScreen ? BASE_PADDING_H * 1.5 : BASE_PADDING_H;
  const titleFontSize = isLargeScreen ? BASE_TITLE_SIZE + 2 : BASE_TITLE_SIZE;

  const paddingTop =
    Platform.OS === 'android' && insets.top === 0
      ? (StatusBar.currentHeight ?? 24)
      : insets.top;

  const isLight = variant === 'light';
  const containerVariant = isLight && !transparent
    ? {
        backgroundColor: LIGHT_BG,
        borderBottomColor: LIGHT_BORDER,
        zIndex: 10,
        elevation: 4,
      }
    : !transparent && styles.withBackground;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop,
          paddingBottom: 12,
          paddingHorizontal,
        },
        containerVariant,
      ]}
    >
      <View style={[styles.row, { minHeight: HEADER_CONTENT_HEIGHT }]}>
        <View style={styles.side}>{left}</View>
        <Text
          style={[
            styles.title,
            { fontSize: titleFontSize },
            isLight && { color: LIGHT_TITLE },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.side}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceLight,
  },
  withBackground: {
    backgroundColor: COLORS.background,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: HEADER_CONTENT_HEIGHT,
  },
  side: {
    width: 56,
    minWidth: 56,
    maxWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: '600',
  },
});
