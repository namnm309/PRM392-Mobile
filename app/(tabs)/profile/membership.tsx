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
import {
  getMyMembership,
  getPointHistory,
  getAllTiers,
  UserMembershipDto,
  PointHistoryResponse,
  MembershipTierDto,
  getTierColor,
  getPointTypeColor,
  getPointTypeText,
} from '@/lib/membershipApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

export default function MembershipScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [membership, setMembership] = useState<UserMembershipDto | null>(null);
  const [pointHistory, setPointHistory] = useState<PointHistoryResponse | null>(null);
  const [allTiers, setAllTiers] = useState<MembershipTierDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'tiers'>('info');

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [membershipData, historyData, tiersData] = await Promise.all([
        getMyMembership(getToken),
        getPointHistory(getToken, 20),
        getAllTiers(),
      ]);
      setMembership(membershipData);
      setPointHistory(historyData);
      setAllTiers(tiersData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin thành viên');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatPoints = (points: number): string => {
    return points.toLocaleString('vi-VN');
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </TabScreenWrapper>
    );
  }

  const tierColor = membership?.currentTier
    ? getTierColor(membership.currentTier.name)
    : COLORS.grey;

  const progressPercent = membership && membership.nextTier && membership.currentTier
    ? Math.min(
        ((membership.totalPoints - membership.currentTier.minPoints) /
          (membership.nextTier.minPoints - membership.currentTier.minPoints)) *
          100,
        100
      )
    : 100;

  return (
    <TabScreenWrapper>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        <AdaptiveHeader
          variant="light"
          title="Hạng thành viên"
          left={
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.background} />
            </TouchableOpacity>
          }
        />

        {membership && membership.currentTier && (
          <View style={{
            backgroundColor: tierColor,
            marginHorizontal: 16,
            marginTop: 8,
            borderRadius: 16,
            padding: 20,
            shadowColor: tierColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="trophy" size={32} color={COLORS.white} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Hạng hiện tại</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.white }}>
                  {membership.currentTier.name}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Điểm hiện có</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
                  {formatPoints(membership.availablePoints)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Tổng tích lũy</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.white }}>
                  {formatPoints(membership.totalPoints)}
                </Text>
              </View>
            </View>

            {membership.nextTier && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                    Hạng tiếp theo: {membership.nextTier.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                    Còn {formatPoints(membership.pointsToNextTier || 0)} điểm
                  </Text>
                </View>
                <View style={{
                  height: 8,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: COLORS.white,
                    borderRadius: 4,
                  }} />
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{
          flexDirection: 'row',
          marginHorizontal: 16,
          marginTop: 16,
          backgroundColor: '#F3F4F6',
          borderRadius: 12,
          padding: 4,
        }}>
          {(['info', 'history', 'tiers'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                backgroundColor: activeTab === tab ? COLORS.white : 'transparent',
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{
                textAlign: 'center',
                fontSize: 14,
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? COLORS.background : COLORS.grey,
              }}>
                {tab === 'info' ? 'Quyền lợi' : tab === 'history' ? 'Lịch sử' : 'Hạng'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: tabBarBottomPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
        {activeTab === 'info' && membership && membership.currentTier && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quyền lợi của bạn</Text>
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Ionicons name="pricetag-outline" size={20} color={COLORS.primary} />
                  <Text style={[styles.cardValue, { marginLeft: 12 }]}>
                    Giảm {membership.currentTier.discountPercent}% cho mỗi đơn hàng
                  </Text>
                </View>
                {membership.currentTier.benefits && (
                  <View style={styles.cardRow}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={[styles.cardValue, { marginLeft: 12 }]}>
                      {membership.currentTier.benefits}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Thống kê</Text>
            {pointHistory && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.card, { flex: 1, padding: 16 }]}>
                  <Ionicons name="trending-up" size={24} color="#10B981" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.background, marginTop: 8 }}>
                    {formatPoints(pointHistory.totalPoints)}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.grey }}>Tổng điểm</Text>
                </View>
                <View style={[styles.card, { flex: 1, padding: 16 }]}>
                  <Ionicons name="wallet-outline" size={24} color="#F59E0B" />
                  <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.background, marginTop: 8 }}>
                    {formatPoints(pointHistory.availablePoints)}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.grey }}>Điểm khả dụng</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'history' && pointHistory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lịch sử điểm thưởng</Text>
            {pointHistory.transactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có lịch sử điểm</Text>
              </View>
            ) : (
              pointHistory.transactions.map((transaction) => (
                <View key={transaction.id} style={styles.listItem}>
                  <View style={[
                    styles.listItemIcon,
                    { backgroundColor: `${getPointTypeColor(transaction.type)}20` }
                  ]}>
                    <Ionicons
                      name={transaction.points > 0 ? 'add-circle-outline' : 'remove-circle-outline'}
                      size={24}
                      color={getPointTypeColor(transaction.type)}
                    />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{transaction.description}</Text>
                    <Text style={styles.listItemSubtitle}>{getPointTypeText(transaction.type)}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[
                      styles.listItemValue,
                      { color: transaction.points > 0 ? '#10B981' : '#EF4444' }
                    ]}>
                      {transaction.points > 0 ? '+' : ''}{formatPoints(transaction.points)}
                    </Text>
                    <Text style={styles.listItemDate}>{formatDate(transaction.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

          {activeTab === 'tiers' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Các hạng thành viên</Text>
              {allTiers.map((tier) => {
                const isCurrentTier = membership?.currentTier?.id === tier.id;
                return (
                  <View
                    key={tier.id}
                    style={[
                      styles.card,
                      isCurrentTier && { borderColor: getTierColor(tier.name), borderWidth: 2 }
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: getTierColor(tier.name),
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                        <Ionicons name="trophy" size={20} color={COLORS.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{tier.name}</Text>
                        <Text style={{ fontSize: 13, color: COLORS.grey }}>
                          {formatPoints(tier.minPoints)} - {formatPoints(tier.maxPoints)} điểm
                        </Text>
                      </View>
                      {isCurrentTier && (
                        <View style={[styles.cardBadge, { backgroundColor: COLORS.primary }]}>
                          <Text style={styles.cardBadgeText}>Hiện tại</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={{ fontSize: 14, color: COLORS.grey }}>
                        • Giảm {tier.discountPercent}%{tier.benefits ? ` • ${tier.benefits}` : ''}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </TabScreenWrapper>
  );
}
