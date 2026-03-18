import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { API_BASE_URL } from '@/constants/api';
import { accountStyles as styles } from '@/styles/account.styles';
import {
  getMyOrders,
  cancelOrder,
  OrderDto,
  OrderItemDto,
  getStatusColor,
  getStatusText,
} from '@/lib/orderApi';
import { fetchProductById } from '@/lib/productsApi';
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
  const ordersLoadedRef = useRef(false);
  const variantImageByVariantIdRef = useRef<Map<string, string | null>>(new Map());
  const [variantImageTick, setVariantImageTick] = useState(0);

  const enrichOrderVariantImages = useCallback(async (incoming: OrderDto[]) => {
    const items = incoming.flatMap((o) => o.orderItems ?? []);
    const needsResolve = items
      .map((i) => i.variantId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .filter((id) => !variantImageByVariantIdRef.current.has(id));

    if (needsResolve.length === 0) return;

    const productIds = Array.from(
      new Set(
        items
          .filter((i) => i.variantId)
          .map((i) => i.productId)
          .filter(Boolean),
      ),
    );

    await Promise.all(
      productIds.map(async (pid) => {
        try {
          const api = await fetchProductById(pid);
          const variants = api?.variants ?? [];
          for (const v of variants) {
            if (!v?.id) continue;
            if (!variantImageByVariantIdRef.current.has(v.id)) {
              variantImageByVariantIdRef.current.set(v.id, v.imageUrl ?? null);
            }
          }
        } catch {
          // Ignore enrichment failures; keep product image
        }
      }),
    );

    for (const vid of needsResolve) {
      if (!variantImageByVariantIdRef.current.has(vid)) {
        variantImageByVariantIdRef.current.set(vid, null);
      }
    }

    setVariantImageTick((x) => x + 1);
  }, []);

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
      // Enrich variant images in background (doesn't block UI)
      enrichOrderVariantImages(data.items).catch(() => null);
    } catch (err: any) {
      setError(err.message || 'Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, enrichOrderVariantImages]);

  // Load orders on mount (only once)
  useEffect(() => {
    // Prevent multiple calls
    if (ordersLoadedRef.current) return;
    
    let isMounted = true;
    ordersLoadedRef.current = true;
    
    const loadOrders = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await getMyOrders(getToken, 1, 10);
        
        if (!isMounted) return;
        
        setOrders(data.items);
        setHasMore(data.hasNextPage);
        setPage(1);
        enrichOrderVariantImages(data.items).catch(() => null);

        // Auto-sync GHN status for shipping orders in background
        const shippingOrders = data.items.filter(
          (o: OrderDto) => 
            (o.status === 'Confirmed' || o.status === 'Shipping') && 
            o.ghnOrderCode
        );
        
        if (shippingOrders.length > 0) {
          const token = await getToken();
          // Call API in background (don't block UI)
          Promise.all(
            shippingOrders.map((o: OrderDto) =>
              fetch(`${API_BASE_URL}/api/Orders/${o.id}/ghn-status`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }).catch(() => null) // Ignore errors for background sync
            )
          ).then(() => {
            // Reload orders after sync (only if still mounted)
            if (isMounted) {
              getMyOrders(getToken, 1, 10).then(refreshedData => {
                if (isMounted) {
                  setOrders(refreshedData.items);
                  setHasMore(refreshedData.hasNextPage);
                }
              }).catch(() => {
                // Ignore errors for refresh after sync
              });
            }
          });
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Không thể tải lịch sử đơn hàng');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

  const handleCheckGhnStatus = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await fetch(
        `${API_BASE_URL}/api/Orders/${orderId}/ghn-status`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = await response.json();
      
      if (result.success && result.data) {
        // Refresh orders list to show updated status
        await fetchOrders(1, true);
        Alert.alert(
          'Trạng thái đơn hàng',
          `Mã GHN: ${result.data.ghnOrderCode}\nTrạng thái GHN: ${result.data.ghnStatus}\nTrạng thái đơn: ${result.data.orderStatus}${result.data.statusChanged ? '\n✅ Đã cập nhật' : '\nℹ️ Không có thay đổi'}`
        );
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể lấy trạng thái');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lấy trạng thái');
    } finally {
      setLoading(false);
    }
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

  const resolveOrderItemImageUri = (item: OrderItemDto) => {
    // touch state so screen rerenders when cache updates
    void variantImageTick;
    if (item.variantImageUrl) return item.variantImageUrl;
    const vid = item.variantId ?? null;
    const cached = vid ? variantImageByVariantIdRef.current.get(vid) : null;
    return cached || item.product?.imageUrl || 'https://via.placeholder.com/60';
  };

  if (loading) {
    return (
      <TabScreenWrapper>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
          <ActivityIndicator size="large" color={COLORS.accentRed} />
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
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ padding: 8 }}>
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentRed]} />
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
                    {order.orderItems.slice(0, 2).map((item, index) => {
                      const hasVariantInfo =
                        item.variantRamGb != null ||
                        item.variantStorageGb != null ||
                        !!item.variantColorName;

                      const variantParts: string[] = [];
                      if (item.variantRamGb != null) {
                        variantParts.push(`${item.variantRamGb}GB`);
                      }
                      if (item.variantStorageGb != null) {
                        variantParts.push(`${item.variantStorageGb}GB`);
                      }
                      if (item.variantColorName) {
                        variantParts.push(item.variantColorName);
                      }
                      const variantLabel = hasVariantInfo ? variantParts.join(' · ') : null;

                      return (
                        <View
                          key={item.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            borderTopWidth: index > 0 ? 1 : 0,
                            borderTopColor: '#F3F4F6',
                          }}
                        >
                          <Image
                            source={{
                              uri: resolveOrderItemImageUri(item),
                            }}
                            style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{ fontSize: 14, color: COLORS.background }}
                              numberOfLines={1}
                            >
                              {item.product?.name || 'Sản phẩm'}
                            </Text>
                            {variantLabel && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: COLORS.grey,
                                  marginTop: 2,
                                }}
                                numberOfLines={1}
                              >
                                {variantLabel}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                    {order.orderItems.length > 2 && (
                      <Text style={{ fontSize: 13, color: COLORS.grey, fontStyle: 'italic' }}>
                        +{order.orderItems.length - 2} sản phẩm khác
                      </Text>
                    )}
                  </View>

                  <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
                    <View>
                      <Text style={{ fontSize: 13, color: COLORS.grey }}>Tổng tiền</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.accentRed }}>
                        {formatPrice(order.totalAmount)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {order.status === 'Delivered' && (
                        <TouchableOpacity
                          style={[styles.cardButton, { borderColor: COLORS.accentRed, backgroundColor: `${COLORS.accentRed}10` }]}
                          onPress={() => router.push({
                            pathname: '/product/[id]/reviews',
                            params: { id: order.orderItems[0]?.productId },
                          })}
                        >
                          <Ionicons name="star-outline" size={16} color={COLORS.accentRed} />
                          <Text style={[styles.cardButtonText, { color: COLORS.accentRed }]}>Đánh giá</Text>
                        </TouchableOpacity>
                      )}
                      {(order.status === 'Confirmed' || order.status === 'Shipping') && order.ghnOrderCode && (
                        <TouchableOpacity
                          style={[styles.cardButton, { borderColor: COLORS.accentRed }]}
                          onPress={() => handleCheckGhnStatus(order.id)}
                        >
                          <Ionicons name="location-outline" size={16} color={COLORS.accentRed} />
                          <Text style={[styles.cardButtonText, { color: COLORS.accentRed }]}>Tình trạng</Text>
                        </TouchableOpacity>
                      )}
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
                  <Text style={{ fontSize: 14, color: COLORS.accentRed, fontWeight: '600' }}>
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
