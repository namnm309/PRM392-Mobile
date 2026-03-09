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
    orderLoadedRef.current = true;
    
    getOrderById(getToken, orderId)
      .then((orderData) => {
        if (isMounted) {
          setOrder(orderData);
        }
      })
      .catch(() => {
        // Order might not be found, but we still show success
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    
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
              {paymentSuccess === 'true' ? 'Thanh toán thành công!' : 'Đặt hàng thành công!'}
            </Text>
            <Text style={styles.subtitle}>
              {paymentSuccess === 'true'
                ? 'Thanh toán qua VNPAY đã hoàn tất. Đơn hàng của bạn đang được xử lý.'
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
                      { color: paymentSuccess === 'true' || order.paymentStatus === 'Paid'
                        ? '#22c55e' : COLORS.accentRed }
                    ]}>
                      {paymentSuccess === 'true' || order.paymentStatus === 'Paid'
                        ? 'Đã thanh toán qua VNPAY'
                        : 'Chưa thanh toán'}
                    </Text>
                  </View>
                )}
                <View style={styles.orderInfoRow}>
                  <Text style={styles.orderInfoLabel}>Trạng thái:</Text>
                  <Text style={styles.orderInfoValue}>
                    {order.status === 'Pending' ? 'Đang chờ xử lý'
                      : order.status === 'Processing' ? 'Đang xử lý'
                      : order.status}
                  </Text>
                </View>
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
});
