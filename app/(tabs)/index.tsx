import { HomeCategories } from '@/components/HomeCategories';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeProductSections } from '@/components/HomeProductSections';
import { HomePromoBanner } from '@/components/HomePromoBanner';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { COLORS } from '@/constants/theme';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import React from 'react';
import { ScrollView, View } from 'react-native';

export default function HomeScreen() {
  const tabBarBottomPadding = useTabBarBottomPadding();

  return (
    <TabScreenWrapper>
      <View style={{ flex: 1, backgroundColor: COLORS.white }}>
      <HomeHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <HomeCategories />
        <HomePromoBanner />
        <HomeProductSections />
      </ScrollView>
    </View>
    </TabScreenWrapper>
  );
}
