import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import React, { useEffect } from 'react';
import { COLORS } from '@/constants/theme';

const TAB_BAR_HEIGHT = 56;
const ANIMATION_DURATION = 180;

function TabBarItem({
  isFocused,
  activeColor,
  inactiveColor,
  label,
  icon,
  onPress,
  onLongPress,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  testID,
}: {
  isFocused: boolean;
  activeColor: string;
  inactiveColor: string;
  label: string | undefined;
  icon: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
  accessibilityRole: 'button';
  accessibilityState: { selected?: boolean };
  accessibilityLabel: string | undefined;
  testID: string | undefined;
}) {
  const focused = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focused.value = withTiming(isFocused ? 1 : 0, { duration: ANIMATION_DURATION });
  }, [isFocused, focused]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.96 + 0.04 * focused.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(focused.value, [0, 1], [inactiveColor, activeColor]),
  }));

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabButtonContent, animatedContainerStyle]}>
        {icon}
        {label != null ? (
          <Animated.Text style={[styles.label, animatedLabelStyle]} numberOfLines={1}>
            {label}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function RoundedTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index];
  if (currentRoute?.name === 'cart') {
    return null;
  }

  const bottom = Math.max(insets.bottom, 4);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: bottom },
      ]}
    >
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? COLORS.accentRed : COLORS.grey;
          const icon = options.tabBarIcon
            ? options.tabBarIcon({
                focused: isFocused,
                color,
                size: 24,
              })
            : null;

          const onPress = () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabBarItem
              key={route.key}
              isFocused={isFocused}
              activeColor={COLORS.accentRed}
              inactiveColor={COLORS.grey}
              label={options.title ?? undefined}
              icon={icon}
              onPress={onPress}
              onLongPress={onLongPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
              testID={options.tabBarTestID}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: TAB_BAR_HEIGHT,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: TAB_BAR_HEIGHT,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    marginTop: 4,
  },
});
