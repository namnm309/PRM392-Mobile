import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { accountStyles as styles } from '@/styles/account.styles';
import {
  getLinkedAccounts,
  unlinkAccount,
  LinkedAccountsResponse,
  AvailableProvider,
  getProviderIcon,
  getProviderColor,
} from '@/lib/linkedAccountApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

export default function LinkedAccountsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [data, setData] = useState<LinkedAccountsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getLinkedAccounts(getToken);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Không thể tải thông tin liên kết');
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

  const handleUnlink = useCallback(async (provider: string) => {
    Alert.alert(
      'Xác nhận hủy liên kết',
      `Bạn có chắc muốn hủy liên kết tài khoản ${provider}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hủy liên kết',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkAccount(getToken, provider);
              fetchData();
              Alert.alert('Thành công', `Đã hủy liên kết tài khoản ${provider}`);
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy liên kết');
            }
          },
        },
      ]
    );
  }, [getToken, fetchData]);

  const handleLink = useCallback((provider: string) => {
    Alert.alert(
      'Thông báo',
      `Tính năng liên kết ${provider} sẽ được hỗ trợ sớm.\n\nBạn có thể liên kết tài khoản qua Clerk Dashboard.`,
      [{ text: 'Đã hiểu' }]
    );
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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

  const linkedAccounts = data?.accounts || [];
  const availableProviders = data?.availableProviders || [];

  return (
    <TabScreenWrapper>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        <AdaptiveHeader
          variant="light"
          title="Liên kết tài khoản"
          left={
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.background} />
            </TouchableOpacity>
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: tabBarBottomPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {linkedAccounts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đã liên kết</Text>
              {linkedAccounts.map((account) => (
                <View key={account.id} style={styles.listItem}>
                  <View style={[
                    styles.listItemIcon,
                    { backgroundColor: `${getProviderColor(account.provider)}20` }
                  ]}>
                    <Ionicons
                      name={getProviderIcon(account.provider) as any}
                      size={24}
                      color={getProviderColor(account.provider)}
                    />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{account.provider}</Text>
                    <Text style={styles.listItemSubtitle} numberOfLines={1}>
                      {account.providerEmail || account.providerName || 'Đã liên kết'}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={styles.listItemDate}>
                      {formatDate(account.linkedAt)}
                    </Text>
                    <TouchableOpacity
                      style={{ marginTop: 4, padding: 4 }}
                      onPress={() => handleUnlink(account.provider)}
                    >
                      <Text style={{ fontSize: 13, color: '#EF4444' }}>Hủy liên kết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {availableProviders.filter(p => !p.isLinked).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Có thể liên kết</Text>
              {availableProviders.filter(p => !p.isLinked).map((providerInfo) => (
                <TouchableOpacity
                  key={providerInfo.provider}
                  style={styles.listItem}
                  onPress={() => handleLink(providerInfo.provider)}
                >
                  <View style={[
                    styles.listItemIcon,
                    { backgroundColor: `${getProviderColor(providerInfo.provider)}20` }
                  ]}>
                    <Ionicons
                      name={getProviderIcon(providerInfo.provider) as any}
                      size={24}
                      color={getProviderColor(providerInfo.provider)}
                    />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>{providerInfo.provider}</Text>
                    <Text style={styles.listItemSubtitle}>Chưa liên kết</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: `${COLORS.primary}15`,
                      borderRadius: 16,
                    }}>
                      <Ionicons name="add" size={16} color={COLORS.primary} />
                      <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>
                        Liên kết
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {linkedAccounts.length === 0 && availableProviders.filter(p => !p.isLinked).length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="link-outline" size={64} color={COLORS.grey} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Không có tài khoản</Text>
              <Text style={styles.emptyText}>
                Tính năng liên kết tài khoản mạng xã hội sẽ được hỗ trợ sớm
              </Text>
            </View>
          )}

          <View style={{ padding: 16, marginTop: 16 }}>
            <View style={{
              backgroundColor: '#FEF3C7',
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              gap: 12,
            }}>
              <Ionicons name="information-circle" size={24} color="#D97706" />
              <Text style={{ flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 }}>
                Liên kết tài khoản mạng xã hội giúp bạn đăng nhập nhanh hơn và bảo mật tài khoản tốt hơn.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </TabScreenWrapper>
  );
}
