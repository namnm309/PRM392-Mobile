import { Tabs } from 'expo-router';
import React from 'react';

import { RoundedTabBar } from '@/components/RoundedTabBar';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <RoundedTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: COLORS.accentRed,
        tabBarInactiveTintColor: COLORS.grey,
        headerShown: false,
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ size, color }) => <Ionicons size={size} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          title: 'Danh mục',
          tabBarIcon: ({ size, color }) => <Ionicons size={size} name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Cửa hàng',
          tabBarIcon: ({ size, color }) => <Ionicons size={size} name="location" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Giỏ hàng',
          tabBarIcon: ({ size, color }) => <Ionicons size={size} name="cart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ size, color }) => <Ionicons size={size} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
