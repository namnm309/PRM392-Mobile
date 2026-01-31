import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

const ENTERING_DURATION = 220;

export function TabScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeIn.duration(ENTERING_DURATION)}
      style={{ flex: 1 }}
    >
      {children}
    </Animated.View>
  );
}
