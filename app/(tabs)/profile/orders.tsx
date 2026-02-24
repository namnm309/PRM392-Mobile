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
import {
  getMyOrders,
  cancelOrder,
  OrderDto,
  getStatusColor,
  getStatusText,
} from '@/lib/orderApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

export default function OrdersScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      setError(null);
      const data = await getMyOrders(getToken, pageNum, 10);
      if (refresh || pageNum === 1) {
        setOrders(data.items);
      } else {
        setOrders(prev => [...prev, ...data.items]);
      }
      setHasMore(data.hasNextPage);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(1, true);
  }, [fetchOrders]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    Alert.alert(
      'Xác nhận hủy đơn',
      'Bạn có chắc muốn hủy đơn hàng này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(getToken, orderId);
              fetchOrders(1, true);
              Alert.alert('Thành công', 'Đơn hàng đã được hủy');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy đơn hàng');
            }
          },
        },
      ]
    );
  }, [getToken, fetchOrders]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders()}>
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
          title="Lịch sử mua hàng"
          left={
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.background} />
            </TouchableOpacity>
          }
        />

        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.grey} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
            <Text style={styles.emptyText}>
              Đơn hàng của bạn sẽ hiển thị tại đây
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
              {orders.map((order) => (
                <View key={order.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: COLORS.grey, marginBottom: 4 }}>
                        {formatDate(order.createdAt)}
                      </Text>
                      <Text style={styles.cardTitle}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.cardBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.cardBadgeText}>{getStatusText(order.status)}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    {order.orderItems.slice(0, 2).map((item, index) => (
                      <View key={item.id} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: '#F3F4F6',
                      }}>
                        <Image
                          source={{ uri: item.product?.imageUrl || 'https://via.placeholder.com/60' }}
                          style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, color: COLORS.background }} numberOfLines={1}>
                            {item.product?.name || 'Sản phẩm'}
                          </Text>
                          <Text style={{ fontSize: 13, color: COLORS.grey }}>
                            x{item.quantity} • {formatPrice(item.unitPrice)}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {order.orderItems.length > 2 && (
                      <Text style={{ fontSize: 13, color: COLORS.grey, fontStyle: 'italic' }}>
                        +{order.orderItems.length - 2} sản phẩm khác
                      </Text>
                    )}
                  </View>

                  <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
                    <View>
                      <Text style={{ fontSize: 13, color: COLORS.grey }}>Tổng tiền</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>
                        {formatPrice(order.totalAmount)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {(order.status === 'Pending' || order.status === 'Processing') && (
                        <TouchableOpacity
                          style={[styles.cardButton, styles.cardButtonDanger]}
                          onPress={() => handleCancelOrder(order.id)}
                        >
                          <Text style={[styles.cardButtonText, { color: '#EF4444' }]}>Hủy đơn</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}

              {hasMore && (
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    paddingVertical: 16,
                  }}
                  onPress={() => fetchOrders(page + 1)}
                >
                  <Text style={{ fontSize: 14, color: COLORS.primary, fontWeight: '600' }}>
                    Xem thêm
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </TabScreenWrapper>
  );
}
