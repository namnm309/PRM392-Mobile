import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { cartStyles } from '@/styles/cart.styles';
import { COLORS } from '@/constants/theme';

export default function CartScreen() {
  const router = useRouter();
  const tabBarBottomPadding = useTabBarBottomPadding();

  const subtotal = 0;
  const isEmpty = true;

  const handleExploreProducts = () => {
    router.push('/(tabs)/store');
  };

  const handleBuyNow = () => {
    if (isEmpty) {
      return;
    }
    // TODO: navigate to checkout when cart has items
  };

  return (
    <TabScreenWrapper>
      <View style={cartStyles.screen}>
        <AdaptiveHeader
        variant="light"
        title="Giỏ hàng"
        left={
          <TouchableOpacity
            style={cartStyles.headerBack}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={cartStyles.emptyContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={cartStyles.emptyCard}>
          <View style={cartStyles.emptyCardIconWrap}>
            <Ionicons
              name="cart-outline"
              size={60}
              color={COLORS.cartTextSecondary}
            />
          </View>
          <Text style={cartStyles.emptyCardTitle}>Giỏ hàng trống</Text>
          <Text style={cartStyles.emptyCardSubtitle}>
            Thêm sản phẩm để bắt đầu mua sắm
          </Text>
          <Pressable
            style={cartStyles.emptyCardCta}
            onPress={handleExploreProducts}
            android_ripple={{ color: COLORS.cartPrimaryDark }}
          >
            <Text style={cartStyles.emptyCardCtaText}>Khám phá sản phẩm</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View
        style={[
          cartStyles.footer,
          { paddingBottom: tabBarBottomPadding + 14 },
        ]}
      >
        <View style={cartStyles.footerLeft}>
          <Text style={cartStyles.footerSubtotalLabel}>Tạm tính:</Text>
          <Text style={cartStyles.footerSubtotalValue}>
            {subtotal.toLocaleString('vi-VN')}₫
          </Text>
        </View>
        <Pressable
          style={[
            cartStyles.footerButton,
            isEmpty && cartStyles.footerButtonDisabled,
          ]}
          onPress={handleBuyNow}
          disabled={isEmpty}
        >
          <Text style={cartStyles.footerButtonText}>Mua ngay</Text>
        </Pressable>
      </View>
      </View>
    </TabScreenWrapper>
  );
}
