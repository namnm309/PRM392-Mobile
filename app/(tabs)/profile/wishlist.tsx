import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { accountStyles as styles } from '@/styles/account.styles';
import { getWishlist, removeFromWishlist, WishlistItemDto } from '@/lib/wishlistApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { useWishlist } from '@/contexts/WishlistContext';

export default function WishlistScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const { refreshWishlist, toggleWishlist } = useWishlist();
  const [items, setItems] = useState<WishlistItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      setError(null);
      const data = await getWishlist(getToken);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  useFocusEffect(
    useCallback(() => {
      // Keep context + screen in sync when coming back
      refreshWishlist().catch(() => {});
      fetchWishlist();
    }, [fetchWishlist, refreshWishlist])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refreshWishlist().catch(() => {});
    fetchWishlist();
  }, [fetchWishlist, refreshWishlist]);

  const handleRemove = useCallback(async (productId: string, productName: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bỏ "${productName}" khỏi danh sách yêu thích?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Use shared toggle to keep Home/ProductDetail hearts in sync
              await toggleWishlist(productId);
              setItems(prev => prev.filter(item => item.productId !== productId));
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa sản phẩm');
              fetchWishlist();
            }
          },
        },
      ]
    );
  }, [fetchWishlist, toggleWishlist]);

  const getItemImageUrl = (item: WishlistItemDto): string | null => {
    const anyItem = item as any;
    return (
      item.productImageUrl ||
      anyItem.imageUrl ||
      (anyItem.product && (anyItem.product.imageUrl || anyItem.product.productImageUrl)) ||
      null
    );
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  if (loading) {
    return (
      <TabScreenWrapper>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </TabScreenWrapper>
    );
  }

  if (error) {
    return (
      <TabScreenWrapper>
        <View style={styles.errorContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchWishlist}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </TabScreenWrapper>
    );
  }

  return (
    <TabScreenWrapper>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.accentRed} />
        
        <AdaptiveHeader
          backgroundColor={COLORS.accentRed}
          title="Sản phẩm yêu thích"
          left={
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          }
        />
        <View style={{ height: 12, backgroundColor: COLORS.white }} />

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={COLORS.grey} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
            <Text style={styles.emptyText}>
              Thêm sản phẩm vào danh sách yêu thích để xem lại sau
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              { paddingBottom: tabBarBottomPadding, paddingTop: 4 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, wishlistStyles.itemCard]}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({ pathname: '/product/[id]', params: { id: item.productId } })
                  }
                >
                  <Image
                    source={{
                      uri: getItemImageUrl(item) || 'https://via.placeholder.com/100',
                    }}
                    style={wishlistStyles.thumb}
                  />
                  <View style={wishlistStyles.info}>
                    <Text style={wishlistStyles.name} numberOfLines={2}>
                      {item.productName}
                    </Text>

                    <View style={wishlistStyles.priceRow}>
                      <Text style={wishlistStyles.priceNow}>
                        {formatPrice(
                          item.isOnSale && item.productSalePrice
                            ? item.productSalePrice
                            : item.productPrice
                        )}
                      </Text>
                      {item.isOnSale && item.productSalePrice ? (
                        <Text style={wishlistStyles.priceOld}>
                          {formatPrice(item.productPrice)}
                        </Text>
                      ) : null}
                    </View>

                    <View style={wishlistStyles.metaRow}>
                      <View style={wishlistStyles.stockRow}>
                        <View
                          style={[
                            wishlistStyles.stockDot,
                            item.isAvailable && item.stock > 0
                              ? wishlistStyles.stockDotOk
                              : wishlistStyles.stockDotBad,
                          ]}
                        />
                        <Text
                          style={[
                            wishlistStyles.stockText,
                            item.isAvailable && item.stock > 0
                              ? wishlistStyles.stockTextOk
                              : wishlistStyles.stockTextBad,
                          ]}
                        >
                          {item.isAvailable && item.stock > 0
                            ? `Còn ${item.stock} sản phẩm`
                            : 'Hết hàng'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={wishlistStyles.removeBtn}
                    onPress={() => handleRemove(item.productId, item.productName)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="heart-dislike-outline" size={18} color={COLORS.accentRed} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </TabScreenWrapper>
  );
}

const wishlistStyles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  info: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
  },
  priceNow: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentRed,
  },
  priceOld: {
    fontSize: 12,
    color: COLORS.grey,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockDotOk: { backgroundColor: '#10B981' },
  stockDotBad: { backgroundColor: '#EF4444' },
  stockText: { fontSize: 12 },
  stockTextOk: { color: '#10B981' },
  stockTextBad: { color: '#EF4444' },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
