import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/profile.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';

export default function Profile() {
  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [phoneVisible, setPhoneVisible] = useState(false);

  const handleLogout = async () => {
    try {
      // Xóa lịch sử chat hỗ trợ trên backend trước khi đăng xuất
      try {
        const token = await getToken();
        if (token) {
          await fetch(`${process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? ''}/api/support-chat/messages`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).catch(() => {});
        }
      } catch {
        // Bỏ qua lỗi xóa lịch sử, vẫn cho logout bình thường
      }

      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const rawPhone =
    user?.primaryPhoneNumber?.phoneNumber ||
    user?.phoneNumbers?.[0]?.phoneNumber ||
    '';
  const displayPhone = rawPhone
    ? phoneVisible
      ? rawPhone
      : rawPhone.slice(0, 3) + '****' + rawPhone.slice(-3)
    : '082****553';
  const hasPhone = rawPhone.length > 0 || true;

  const quickAccessItems = [
    { label: 'Hạng thành viên', icon: 'heart-outline' as const, onPress: () => router.push('/(tabs)/profile/membership') },
    { label: 'Mã giảm giá', icon: 'pricetag-outline' as const, onPress: () => router.push('/(tabs)/profile/vouchers') },
    { label: 'Lịch sử mua hàng', icon: 'receipt-outline' as const, onPress: () => router.push('/(tabs)/profile/orders') },
    { label: 'Học sinh/Sinh viên', icon: 'school-outline' as const, onPress: () => {} },
  ];

  const accentRed = COLORS.accentRed;

  const historyItems = [
    { label: 'Lịch sử mua hàng', icon: 'document-text-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/orders') },
    { label: 'Tra cứu bảo hành', icon: 'refresh-outline' as const, iconColor: accentRed, onPress: () => {} },
  ];

  const promotionItems = [
    { label: 'Hạng thành viên', icon: 'heart-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/membership') },
    { label: 'Tech-edu', icon: 'school-outline' as const, iconColor: accentRed, onPress: () => {} },
  ];

  const accountItems = [
    { label: 'Thông tin cá nhân', icon: 'person-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/edit') },
    { label: 'Sổ địa chỉ', icon: 'location-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/addresses') },
    { label: 'Liên kết tài khoản', icon: 'link-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/linked-accounts') },
    { label: 'Đổi mật khẩu', icon: 'lock-closed-outline' as const, iconColor: accentRed, onPress: () => {} },
  ];

  const otherItems = [
    { label: 'Sản phẩm yêu thích', icon: 'heart-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/wishlist') },
    { label: 'Tư vấn và hỗ trợ', icon: 'chatbubbles-outline' as const, iconColor: accentRed, onPress: () => router.push('/(tabs)/profile/chat-with-staff') },
    { label: 'Điều khoản sử dụng', icon: 'document-text-outline' as const, iconColor: COLORS.grey, onPress: () => {} },
  ];

  const renderMenuSection = (
    title: string,
    items: Array<{ label: string; icon: string; iconColor: string; onPress: () => void }>
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: `${item.iconColor}20` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
            </View>
            <Text style={styles.menuItemText}>{item.label}</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Màn tài khoản khi chưa đăng nhập
  if (!user) {
    return (
      <TabScreenWrapper>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              {
                paddingTop: insets.top,
                paddingBottom: tabBarBottomPadding,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.guestWelcomeSection}>
              <Text style={styles.guestWelcomeTitle}>Chào mừng bạn đến với TechStore</Text>
              <Text style={styles.guestWelcomeSubtitle}>
                Đăng nhập để theo dõi đơn hàng, nhận ưu đãi và nhiều tiện ích khác.
              </Text>
              <View style={styles.guestButtonRow}>
                <TouchableOpacity
                  style={styles.guestPrimaryButton}
                  onPress={() =>
                    router.push({
                      pathname: '/(auth)/login',
                      params: { redirect: '/(tabs)/profile' },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestPrimaryButtonText}>Đăng nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.guestSecondaryButton}
                  onPress={() => router.push('/(auth)/register')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.guestSecondaryButtonText}>Đăng ký</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderMenuSection('Lịch sử', historyItems.map(item => ({
              ...item,
              onPress: () =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { redirect: '/(tabs)/profile' },
                }),
            })))}

            {renderMenuSection('Ưu đãi', promotionItems.map(item => ({
              ...item,
              onPress: () =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { redirect: '/(tabs)/profile' },
                }),
            })))}

            {renderMenuSection('Tài khoản', accountItems.map(item => ({
              ...item,
              onPress: () =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { redirect: '/(tabs)/profile' },
                }),
            })))}

            {renderMenuSection('Khác', otherItems.map(item => ({
              ...item,
              onPress: () =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { redirect: '/(tabs)/profile' },
                }),
            })))}

            <View className="footer">
              <View style={styles.footer}>
                <Text style={styles.versionText}>Tech Store v1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </TabScreenWrapper>
    );
  }

  return (
    <TabScreenWrapper>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollViewContent,
          {
            paddingTop: insets.top,
            paddingBottom: tabBarBottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User info (white) */}
        <View style={styles.userInfoSection}>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={32} color={COLORS.grey} />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.fullName || user?.firstName || 'Nguyễn Minh Nam'}
              </Text>
              {hasPhone && (
                <View style={styles.phoneRow}>
                  <Text style={styles.userPhone}>{displayPhone}</Text>
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setPhoneVisible(!phoneVisible)}
                  >
                    <Ionicons
                      name={phoneVisible ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={COLORS.grey}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats 2 columns */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statColumn}>
              <Ionicons
                name="cart-outline"
                size={24}
                color={COLORS.accentRed}
                style={styles.statIcon}
              />
              <Text style={styles.statValue}>9</Text>
              <Text style={styles.statLabel}>Tổng số đơn hàng</Text>
            </View>
            <View style={styles.statColumnDivider} />
            <View style={styles.statColumn}>
              <Ionicons
                name="wallet-outline"
                size={24}
                color={COLORS.accentRed}
                style={styles.statIcon}
              />
              <Text style={styles.statValueGreen}>1.979.000₫</Text>
              <Text style={styles.statLabel}>Tổng tiền tích lũy</Text>
              <Text style={styles.statSubLabel}>Từ 01/01/2025</Text>
            </View>
          </View>
        </View>

        {/* Banner Techmember */}
        <View style={styles.banner}>
          <Ionicons
            name="information-circle"
            size={24}
            color={accentRed}
            style={styles.bannerIcon}
          />
          <Text style={styles.bannerText}>
            Vui lòng đưa mã này cho nhân viên để hưởng ưu đãi Techmember
          </Text>
          <TouchableOpacity style={styles.bannerCta} onPress={() => {}}>
            <Text style={styles.bannerCtaText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

        {/* Quick access row */}
        <View style={styles.quickAccessRow}>
          {quickAccessItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAccessItem}
              onPress={item.onPress}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={COLORS.accentRed}
                style={styles.quickAccessIcon}
              />
              <Text style={styles.quickAccessLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lịch sử */}
        {renderMenuSection('Lịch sử', historyItems)}

        {/* Ưu đãi */}
        {renderMenuSection('Ưu đãi', promotionItems)}

        {/* Tài khoản */}
        {renderMenuSection('Tài khoản', accountItems)}

        {/* Khác */}
        {renderMenuSection('Khác', otherItems)}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Tech Store v1.0.0</Text>
        </View>
      </ScrollView>
      </View>
    </TabScreenWrapper>
  );
}
