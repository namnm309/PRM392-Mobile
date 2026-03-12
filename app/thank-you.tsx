import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { getOrderById } from '@/lib/ordersApi';
import type { OrderResponse } from '@/lib/ordersApi';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

export default function ThankYouScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { orderId, paymentSuccess } = useLocalSearchParams<{
    orderId: string;
    paymentSuccess?: string;
  }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const orderLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple calls
    if (orderLoadedRef.current || !orderId) {
      if (!orderId) setLoading(false);
      return;
    }
    
    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 10; // Poll tối đa 10 lần (20 giây)
    orderLoadedRef.current = true;
    
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderById(getToken, orderId);
        
        if (!isMounted) return;
        
        // Nếu là đơn Online và đang thanh toán VNPay thành công
        if (paymentSuccess === 'true' && orderData.paymentMethod === 'Online') {
          // Nếu PaymentStatus chưa phải Paid, tiếp tục poll
          if (orderData.paymentStatus !== 'Paid' && pollCount < maxPolls) {
            pollCount++;
            console.log(`Polling order status... attempt ${pollCount}/${maxPolls}`);
            setTimeout(fetchOrder, 2000); // Poll lại sau 2 giây
            return;
          }
        }
        
        setOrder(orderData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        // Order might not be found, but we still show success
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchOrder();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]); // Only depend on orderId, not getToken

  const handleContinueShopping = () => {
    router.replace('/(tabs)/store');
  };

  const handleViewOrders = () => {
    router.replace('/(tabs)/profile/orders');
  };

  const handleRetryPayment = async () => {
    if (!order) return;
    try {
      const { createVnPayUrl } = await import('@/lib/vnpayApi');
      const paymentUrl = await createVnPayUrl(getToken, order.id);
      const encodedUrl = encodeURIComponent(paymentUrl);
      router.replace({
        pathname: '/vnpay-payment',
        params: { paymentUrl: encodedUrl, orderId: order.id },
      });
    } catch (error) {
      console.error('Failed to create payment URL:', error);
    }
  };

  // Check if order can be retried (within 24h and payment not successful)
  const canRetryPayment = () => {
    if (!order || order.paymentMethod !== 'Online') return false;
    if (order.paymentStatus === 'Paid') return false;
    
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceCreation < 24 && 
           (order.paymentStatus === 'Pending' || order.paymentStatus === 'Failed' || order.paymentStatus === 'ManualReview');
  };

  const getHoursRemaining = () => {
    if (!order) return 0;
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return Math.max(0, 24 - hoursSinceCreation);
  };

  return (
    <View style={styles.screen}>
      <AdaptiveHeader
        variant="light"
        title="Cảm ơn bạn"
        left={
          <TouchableOpacity
            style={styles.headerBack}
            onPress={handleContinueShopping}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accentRed} />
          </View>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.accentRed} />
              </View>
            </View>

            <Text style={styles.title}>
              {order?.paymentStatus === 'Paid' 
                ? 'Thanh toán thành công!' 
                : order?.paymentMethod === 'Online'
                ? 'Đang xử lý thanh toán'
                : 'Đặt hàng thành công!'}
            </Text>
            <Text style={styles.subtitle}>
              {order?.paymentStatus === 'Paid'
                ? 'Thanh toán qua VNPAY đã hoàn tất. Đơn hàng của bạn đang được xử lý.'
                : order?.paymentMethod === 'Online' && (order?.paymentStatus === 'Pending' || order?.paymentStatus === 'Failed')
                ? 'Vui lòng đợi trong giây lát để hệ thống xác nhận thanh toán của bạn.'
                : 'Cảm ơn bạn đã mua sắm tại TechStore. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.'}
            </Text>

            {order && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderInfoTitle}>Thông tin đơn hàng</Text>
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.orderInfoValue}>{order.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Tổng tiền:</Text>
                  <Text style={styles.orderInfoValue}>{formatPrice(order.totalAmount)}</Text>
                </View>
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Phương thức thanh toán:</Text>
                  <Text style={styles.orderInfoValue}>
                    {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}
                  </Text>
                </View>
                {order.paymentMethod === 'Online' && (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Thanh toán:</Text>
                    <Text style={[
                      styles.orderInfoValue,
                      { color: order.paymentStatus === 'Paid'
                        ? '#22c55e' 
                        : order.paymentStatus === 'Failed' 
                        ? COLORS.accentRed
                        : order.paymentStatus === 'ManualReview'
                        ? '#f97316'
                        : COLORS.grey }
                    ]}>
                      {order.paymentStatus === 'Paid'
                        ? 'Đã thanh toán qua VNPAY'
                        : order.paymentStatus === 'Failed'
                        ? 'Thanh toán thất bại'
                        : order.paymentStatus === 'ManualReview'
                        ? 'Đang kiểm tra'
                        : order.paymentStatus === 'Expired'
                        ? 'Hết hạn thanh toán'
                        : 'Chưa thanh toán'}
                    </Text>
                  </View>
                )}
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Trạng thái:</Text>
                  <Text style={styles.orderInfoValue}>
                    {order.status === 'Pending'
                      ? 'Đang chờ shop xác nhận'
                      : order.status === 'Processing'
                        ? 'Shop đã xác nhận, đang chuẩn bị giao / GHN đang xử lý'
                        : order.status === 'Shipped'
                          ? 'Đang giao hàng'
                          : order.status === 'Delivered' || order.status === 'SUCCESS'
                            ? 'Đã giao thành công'
                            : order.status}
                  </Text>
                </View>

                {order.ghnOrderCode && (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Mã vận đơn:</Text>
                    <Text style={styles.orderInfoValue}>{order.ghnOrderCode}</Text>
                  </View>
                )}
                {order.expectedDeliveryTime && (
                  <View style={styles.orderInfoRow}>
                    <Text style={styles.orderInfoLabel}>Dự kiến giao:</Text>
                    <Text style={styles.orderInfoValue}>
                      {new Date(order.expectedDeliveryTime).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {order && canRetryPayment() && (
              <View style={styles.retryPaymentContainer}>
                <Text style={styles.retryPaymentTitle}>
                  Thanh toán chưa hoàn tất
                </Text>
                <Text style={styles.retryPaymentSubtitle}>
                  Bạn còn {Math.floor(getHoursRemaining())} giờ để hoàn tất thanh toán. Sau đó đơn hàng sẽ tự động hủy.
                </Text>
                <TouchableOpacity
                  style={styles.retryPaymentButton}
                  onPress={handleRetryPayment}
                  activeOpacity={0.7}
                >
                  <Ionicons name="card-outline" size={20} color={COLORS.white} />
                  <Text style={styles.retryPaymentButtonText}>Thanh toán lại</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleViewOrders}
                activeOpacity={0.7}
              >
                <Text style={styles.primaryButtonText}>Xem đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleContinueShopping}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Tiếp tục mua sắm</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerBack: {
    padding: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  orderInfo: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    padding: 16,
    marginBottom: 32,
  },
  orderInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: COLORS.grey,
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  retryPaymentContainer: {
    width: '100%',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  retryPaymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  retryPaymentSubtitle: {
    fontSize: 13,
    color: '#78350f',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  retryPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
  },
  retryPaymentButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
