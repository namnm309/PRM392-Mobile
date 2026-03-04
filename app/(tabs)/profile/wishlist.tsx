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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { accountStyles as styles } from '@/styles/account.styles';
import { getWishlist, removeFromWishlist, WishlistItemDto } from '@/lib/wishlistApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

export default function WishlistScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlist();
  }, [fetchWishlist]);

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
              await removeFromWishlist(getToken, productId);
              setItems(prev => prev.filter(item => item.productId !== productId));
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa sản phẩm');
            }
          },
        },
      ]
    );
  }, [getToken]);

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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        <AdaptiveHeader
          variant="light"
          title="Sản phẩm yêu thích"
          left={
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.background} />
            </TouchableOpacity>
          }
          right={
            items.length > 0 ? (
              <View style={{ backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.white }}>{items.length}</Text>
              </View>
            ) : undefined
          }
        />

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
            contentContainerStyle={[styles.scrollViewContent, { paddingBottom: tabBarBottomPadding }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingVertical: 8 }}>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.card, { flexDirection: 'row' }]}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: item.productImageUrl || 'https://via.placeholder.com/100' }}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 8,
                      marginRight: 12,
                      backgroundColor: '#F3F4F6',
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: COLORS.background, marginBottom: 4 }} numberOfLines={2}>
                      {item.productName}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                        {formatPrice(item.isOnSale && item.productSalePrice ? item.productSalePrice : item.productPrice)}
                      </Text>
                      {item.isOnSale && item.productSalePrice && (
                        <Text style={{
                          fontSize: 13,
                          color: COLORS.grey,
                          textDecorationLine: 'line-through',
                        }}>
                          {formatPrice(item.productPrice)}
                        </Text>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        <View style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: item.isAvailable && item.stock > 0 ? '#10B981' : '#EF4444',
                        }} />
                        <Text style={{ fontSize: 12, color: item.isAvailable && item.stock > 0 ? '#10B981' : '#EF4444' }}>
                          {item.isAvailable && item.stock > 0 ? `Còn ${item.stock} sản phẩm` : 'Hết hàng'}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={{
                          padding: 8,
                          borderRadius: 20,
                          backgroundColor: '#FEE2E2',
                        }}
                        onPress={() => handleRemove(item.productId, item.productName)}
                      >
                        <Ionicons name="heart-dislike-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </TabScreenWrapper>
  );
}
