import React from 'react';
import { Text, View } from 'react-native';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { COLORS } from '@/constants/theme';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';

export default function store() {
  const tabBarBottomPadding = useTabBarBottomPadding();

  return (
    <TabScreenWrapper>
      <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingBottom: tabBarBottomPadding,
      }}
    >
      <Text style={{ color: COLORS.white, padding: 16 }}>store</Text>
    </View>
    </TabScreenWrapper>
  );
}