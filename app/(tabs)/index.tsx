import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { COLORS } from '@/constants/theme';
import { HomeHeader } from '@/components/HomeHeader';
import { HomeCategories } from '@/components/HomeCategories';
import { HomePromoBanner } from '@/components/HomePromoBanner';
import { HomeFeaturedProducts } from '@/components/HomeFeaturedProducts';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';

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
        <HomeFeaturedProducts />
      </ScrollView>
    </View>
    </TabScreenWrapper>
  );
}
