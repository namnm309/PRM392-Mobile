import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { accountStyles as styles } from '@/styles/account.styles';
import { getAvailableVouchers, VoucherDto } from '@/lib/voucherApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

export default function VouchersScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    try {
      setError(null);
      const data = await getAvailableVouchers(getToken);
      setVouchers(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVouchers();
  }, [fetchVouchers]);

  const formatDiscount = (voucher: VoucherDto): string => {
    if (voucher.discountType === 'Percentage') {
      return `-${voucher.value}%`;
    }
    return `-${voucher.value.toLocaleString('vi-VN')}đ`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isExpiringSoon = (endTime: string): boolean => {
    const end = new Date(endTime);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchVouchers}>
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
          title="Mã giảm giá"
          left={
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.background} />
            </TouchableOpacity>
          }
        />

        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color={COLORS.grey} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Chưa có mã giảm giá</Text>
            <Text style={styles.emptyText}>
              Các mã giảm giá khả dụng sẽ hiển thị tại đây
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
              {vouchers.map((voucher) => (
                <View key={voucher.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: COLORS.primary, fontSize: 20 }]}>
                        {formatDiscount(voucher)}
                      </Text>
                      <Text style={styles.cardTitle}>{voucher.code}</Text>
                    </View>
                    {isExpiringSoon(voucher.endTime) && (
                      <View style={[styles.cardBadge, { backgroundColor: '#F59E0B' }]}>
                        <Text style={styles.cardBadgeText}>Sắp hết hạn</Text>
                      </View>
                    )}
                    {!voucher.isValid && (
                      <View style={[styles.cardBadge, { backgroundColor: '#EF4444' }]}>
                        <Text style={styles.cardBadgeText}>Không khả dụng</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Mã:</Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#F3F4F6',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderStyle: 'dashed',
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.background, letterSpacing: 1 }}>
                          {voucher.code}
                        </Text>
                      </View>
                    </View>
                    {voucher.minOrderValue > 0 && (
                      <View style={styles.cardRow}>
                        <Text style={styles.cardLabel}>Đơn tối thiểu:</Text>
                        <Text style={styles.cardValue}>
                          {voucher.minOrderValue.toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                    )}
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Còn lại:</Text>
                      <Text style={styles.cardValue}>
                        {voucher.remainingForUser}/{voucher.perUserLimit} lượt
                      </Text>
                    </View>
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Hạn sử dụng:</Text>
                      <Text style={styles.cardValue}>
                        {formatDate(voucher.endTime)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </TabScreenWrapper>
  );
}
