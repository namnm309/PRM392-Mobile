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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { accountStyles as styles } from '@/styles/account.styles';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress,
  AddressDto,
  CreateAddressRequest,
  formatAddress,
} from '@/lib/addressApi';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import { TabScreenWrapper } from '@/components/TabScreenWrapper';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

export default function AddressesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const tabBarBottomPadding = useTabBarBottomPadding();
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateAddressRequest>({
    recipientName: '',
    phoneNumber: '',
    city: '',
    district: '',
    ward: '',
    addressLine1: '',
    addressLine2: '',
    isPrimary: false,
  });

  const fetchAddresses = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyAddresses(getToken);
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAddresses();
  }, [fetchAddresses]);

  const resetForm = () => {
    setFormData({
      recipientName: '',
      phoneNumber: '',
      city: '',
      district: '',
      ward: '',
      addressLine1: '',
      addressLine2: '',
      isPrimary: false,
    });
    setEditingAddress(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (address: AddressDto) => {
    setEditingAddress(address);
    setFormData({
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      city: address.city,
      district: address.district,
      ward: address.ward,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      isPrimary: address.isPrimary,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.recipientName || !formData.phoneNumber || !formData.city ||
        !formData.district || !formData.ward || !formData.addressLine1) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAddress) {
        await updateAddress(getToken, editingAddress.id, formData);
      } else {
        await createAddress(getToken, formData);
      }
      setModalVisible(false);
      resetForm();
      fetchAddresses();
      Alert.alert('Thành công', editingAddress ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu địa chỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = useCallback(async (addressId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa địa chỉ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(getToken, addressId);
              fetchAddresses();
              Alert.alert('Thành công', 'Đã xóa địa chỉ');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa địa chỉ');
            }
          },
        },
      ]
    );
  }, [getToken, fetchAddresses]);

  const handleSetPrimary = useCallback(async (addressId: string) => {
    try {
      await setPrimaryAddress(getToken, addressId);
      fetchAddresses();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đặt làm địa chỉ mặc định');
    }
  }, [getToken, fetchAddresses]);

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
          <TouchableOpacity style={styles.retryButton} onPress={fetchAddresses}>
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
          title="Sổ địa chỉ"
          left={
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={{ padding: 8 }}>
              <Ionicons name="chevron-back" size={24} color={COLORS.background} />
            </TouchableOpacity>
          }
          right={
            <TouchableOpacity onPress={openAddModal} style={{ padding: 8 }}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          }
        />

        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={COLORS.grey} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptyText}>
              Thêm địa chỉ để giao hàng nhanh hơn
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { marginTop: 20 }]}
              onPress={openAddModal}
            >
              <Text style={styles.retryButtonText}>Thêm địa chỉ</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollViewContent, { paddingBottom: tabBarBottomPadding + 80 }]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingVertical: 8 }}>
              {addresses.map((address) => (
                <View key={address.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.cardTitle}>{address.recipientName}</Text>
                        {address.isPrimary && (
                          <View style={[styles.cardBadge, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.cardBadgeText}>Mặc định</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: COLORS.grey, marginTop: 4 }}>
                        {address.phoneNumber}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={{ fontSize: 14, color: COLORS.background, lineHeight: 20 }}>
                      {formatAddress(address)}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    {!address.isPrimary && (
                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: '#F3F4F6' }]}
                        onPress={() => handleSetPrimary(address.id)}
                      >
                        <Text style={[styles.cardButtonText, { color: COLORS.background }]}>
                          Đặt mặc định
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.cardButton, styles.cardButtonPrimary]}
                      onPress={() => openEditModal(address)}
                    >
                      <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                      <Text style={[styles.cardButtonText, { color: COLORS.primary }]}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardButton, styles.cardButtonDanger]}
                      onPress={() => handleDelete(address.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={[styles.cardButtonText, { color: '#EF4444' }]}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <TouchableOpacity style={styles.fab} onPress={openAddModal}>
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.grey} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Họ và tên người nhận</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ và tên"
                placeholderTextColor={COLORS.grey}
                value={formData.recipientName}
                onChangeText={(text) => setFormData({ ...formData, recipientName: text })}
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập số điện thoại"
                placeholderTextColor={COLORS.grey}
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              />

              <Text style={styles.inputLabel}>Tỉnh/Thành phố</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tỉnh/thành phố"
                placeholderTextColor={COLORS.grey}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
              />

              <Text style={styles.inputLabel}>Quận/Huyện</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập quận/huyện"
                placeholderTextColor={COLORS.grey}
                value={formData.district}
                onChangeText={(text) => setFormData({ ...formData, district: text })}
              />

              <Text style={styles.inputLabel}>Phường/Xã</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập phường/xã"
                placeholderTextColor={COLORS.grey}
                value={formData.ward}
                onChangeText={(text) => setFormData({ ...formData, ward: text })}
              />

              <Text style={styles.inputLabel}>Địa chỉ dòng 1 (Số nhà, tên đường)</Text>
              <TextInput
                style={styles.input}
                placeholder="Số nhà, tên đường..."
                placeholderTextColor={COLORS.grey}
                value={formData.addressLine1}
                onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
              />

              <Text style={styles.inputLabel}>Địa chỉ dòng 2 (Tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Tòa nhà, tầng, số phòng..."
                placeholderTextColor={COLORS.grey}
                value={formData.addressLine2}
                onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  submitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingAddress ? 'Cập nhật' : 'Thêm địa chỉ'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </TabScreenWrapper>
  );
}
