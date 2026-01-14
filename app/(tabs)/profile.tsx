import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/profile.styles';

const { width } = Dimensions.get('window');

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const stats = [
    { label: 'Đơn hàng', value: '15', icon: 'cube-outline' },
    { label: 'Yêu thích', value: '12', icon: 'heart-outline' },
    { label: 'Điểm', value: '450', icon: 'star-outline' },
  ];

  const accountItems = [
    { 
      label: 'Đơn hàng của tôi', 
      icon: 'cube-outline', 
      iconColor: COLORS.primary,
      badge: '3',
      onPress: () => {}
    },
    { 
      label: 'Sản phẩm yêu thích', 
      icon: 'heart', 
      iconColor: '#EF4444',
      badge: '12',
      onPress: () => {}
    },
    { 
      label: 'Địa chỉ giao hàng', 
      icon: 'checkmark-circle-outline', 
      iconColor: '#10B981',
      onPress: () => {}
    },
    { 
      label: 'Phương thức thanh toán', 
      icon: 'card-outline', 
      iconColor: '#8B5CF6',
      onPress: () => {}
    },
  ];

  const settingsItems = [
    { 
      label: 'Thông báo', 
      icon: 'notifications-outline', 
      iconColor: '#F59E0B',
      onPress: () => {}
    },
    { 
      label: 'Đánh giá của tôi', 
      icon: 'star-outline', 
      iconColor: '#F59E0B',
      onPress: () => {}
    },
    { 
      label: 'Trợ giúp & Hỗ trợ', 
      icon: 'help-circle-outline', 
      iconColor: COLORS.primary,
      onPress: () => {}
    },
    { 
      label: 'Cài đặt', 
      icon: 'settings-outline', 
      iconColor: COLORS.grey,
      onPress: () => {}
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              {user?.imageUrl ? (
                <Image 
                  source={{ uri: user.imageUrl }} 
                  style={styles.avatar}
                />
              ) : (
                <Ionicons name="person" size={32} color={COLORS.white} />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.fullName || user?.firstName || 'Nguyễn Văn A'}
              </Text>
              <Text style={styles.userEmail}>
                {user?.primaryEmailAddress?.emailAddress || 'nguyenvana@email.com'}
              </Text>
            </View>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Ionicons 
                  name={stat.icon as any} 
                  size={24} 
                  color={COLORS.white} 
                />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* VIP Member Card */}
        <View style={styles.vipCard}>
          <View style={styles.vipContent}>
            <View style={styles.vipIconContainer}>
              <Ionicons name="diamond" size={32} color="#FFD700" />
            </View>
            <View style={styles.vipTextContainer}>
              <Text style={styles.vipTitle}>Thành viên VIP</Text>
              <Text style={styles.vipDescription}>
                Bạn đang có 450 điểm tích lũy. Còn 550 điểm để lên hạng Platinum!
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </View>
        </View>

        {/* My Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản của tôi</Text>
          {accountItems.map((item, index) => (
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
                {item.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt & Hỗ trợ</Text>
          {settingsItems.map((item, index) => (
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
              <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Tech Store v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
