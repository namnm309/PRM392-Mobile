import { checkout } from '@/lib/ordersApi';
import { createVnPayUrl } from '@/lib/vnpayApi';
import { getMyAddresses, formatAddress, type AddressDto } from '@/lib/addressApi';
import { calculateShippingFee } from '@/lib/shippingApi';
import { useCart } from '@/contexts/CartContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';

function formatPrice(v: number) {
  return new Intl.NumberFormat('vi-VN').format(v) + '₫';
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken, isSignedIn } = useAuth();
  const { items, reloadCart, updateQuantity, removeItem } = useCart();

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected === true),
    [items]
  );
  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce((sum, item) => sum + item.priceCurrent * item.quantity, 0),
    [selectedItems]
  );

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const selectedAddressIdRef = useRef<string | null>(null);

  const [notes, setNotes] = useState('');

  // Shipping
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingServiceId, setShippingServiceId] = useState<number | undefined>();
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const lastShippingCalcKeyRef = useRef<string | null>(null);

  const totalAmount = selectedSubtotal + shippingFee;
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  useEffect(() => {
    selectedAddressIdRef.current = selectedAddressId;
  }, [selectedAddressId]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadAddresses = async () => {
        try {
          setLoadingAddresses(true);
          const addressList = await getMyAddresses(getToken);
          if (!isActive) return;

          setAddresses(addressList);

          const previousSelectedId = selectedAddressIdRef.current;
          if (previousSelectedId && addressList.some(addr => addr.id === previousSelectedId)) {
            setSelectedAddressId(previousSelectedId);
            return;
          }

          const primaryAddress = addressList.find(addr => addr.isPrimary);
          if (primaryAddress) {
            setSelectedAddressId(primaryAddress.id);
          } else if (addressList.length > 0) {
            setSelectedAddressId(addressList[0].id);
          } else {
            setSelectedAddressId(null);
          }
        } catch (error) {
          console.error('Error loading addresses:', error);
        } finally {
          if (isActive) setLoadingAddresses(false);
        }
      };

      loadAddresses();

      return () => {
        isActive = false;
      };
    }, [getToken])
  );

  const calculateFee = useCallback(
    async (
      address: AddressDto,
      itemsForFee: typeof selectedItems = selectedItems,
      subtotalForFee: number = selectedSubtotal
    ) => {
      // Avoid duplicate GHN calls for the same inputs
      const totalWeight = itemsForFee.reduce((sum, item) => sum + item.quantity * 500, 0);
      const weight = totalWeight > 0 ? totalWeight : 500;
      const insuranceValue = Math.min(subtotalForFee, 5000000);
      const calcKey = `${address.id}:${address.districtId}:${address.wardCode}:${weight}:${insuranceValue}`;
      if (lastShippingCalcKeyRef.current === calcKey) return;
      lastShippingCalcKeyRef.current = calcKey;

      setLoadingShipping(true);
      setShippingError(null);
      try {
        const fee = await calculateShippingFee({
          toDistrictId: address.districtId!,
          toWardCode: address.wardCode!,
          weight,
          insuranceValue,
        });
        setShippingFee(fee.total);
        setShippingServiceId(undefined);
      } catch (err) {
        console.error('Shipping fee error:', err);
        setShippingError('Không thể tính phí vận chuyển. Vui lòng thử lại.');
        setShippingFee(0);
        // Allow retry on next render / change
        lastShippingCalcKeyRef.current = null;
      } finally {
        setLoadingShipping(false);
      }
    },
    [selectedItems, selectedSubtotal]
  );

  // Calculate shipping fee when address changes or items change
  useEffect(() => {
    if (!selectedAddressId) {
      setShippingFee(0);
      setShippingError(null);
      lastShippingCalcKeyRef.current = null;
      return;
    }
    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address?.districtId || !address?.wardCode) {
      setShippingFee(0);
      setShippingError('Địa chỉ chưa có mã vùng GHN. Vui lòng cập nhật địa chỉ.');
      lastShippingCalcKeyRef.current = null;
      return;
    }
    calculateFee(address, selectedItems, selectedSubtotal);
  }, [selectedAddressId, addresses, calculateFee, selectedItems, selectedSubtotal]);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace({
        pathname: '/(auth)/login',
        params: { redirect: '/checkout' },
      });
    }
  }, [isSignedIn, router]);

  const handleSelectAddress = (address: AddressDto) => {
    setSelectedAddressId(address.id);
    setShowAddressDropdown(false);
  };

  const handleEditAddress = (addressId: string) => {
    router.push({ pathname: '/address-form', params: { editId: addressId } });
  };

  const handleAddNewAddress = async () => {
    router.push('/address-form');
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    const address = addresses.find(a => a.id === selectedAddressId);
    if (!address?.districtId || !address?.wardCode) {
      Alert.alert('Lỗi', 'Địa chỉ giao hàng chưa có mã vùng. Vui lòng cập nhật địa chỉ trước khi đặt hàng.');
      return;
    }

    setLoading(true);
    try {
      const cartItemIds = selectedItems.map(item => item.id);
      
      const order = await checkout(getToken, {
        addressId: selectedAddressId,
        paymentMethod,
        notes: notes.trim() || undefined,
        cartItemIds: cartItemIds.length > 0 ? cartItemIds : undefined,
        shippingFee,
        shippingServiceId,
      });

      await reloadCart();

      if (paymentMethod === 'Online') {
        const paymentUrl = await createVnPayUrl(getToken, order.id);
        const encodedUrl = encodeURIComponent(paymentUrl);
        
        router.replace({
          pathname: '/vnpay-payment',
          params: { 
            paymentUrl: encodedUrl,
            orderId: order.id 
          },
        });
      } else {
        router.replace({
          pathname: '/thank-you',
          params: { orderId: order.id },
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      Alert.alert(
        'Lỗi',
        error instanceof Error ? error.message : 'Đặt hàng thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <AdaptiveHeader
        variant="light"
        title="Thanh toán"
        left={
          <TouchableOpacity style={styles.headerBack} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <TouchableOpacity style={styles.addAddressButton} onPress={handleAddNewAddress} activeOpacity={0.7}>
              <Ionicons name="add" size={18} color={COLORS.accentRed} />
              <Text style={styles.addAddressButtonText}>Thêm mới</Text>
            </TouchableOpacity>
          </View>

          {loadingAddresses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accentRed} />
              <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyAddressContainer}>
              <Ionicons name="location-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyAddressText}>Chưa có địa chỉ nào</Text>
              <TouchableOpacity style={styles.addAddressButtonInline} onPress={handleAddNewAddress} activeOpacity={0.7}>
                <Text style={styles.addAddressButtonInlineText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addressSelector}
              onPress={() => setShowAddressDropdown(true)}
              activeOpacity={0.7}
            >
              {selectedAddress ? (
                <View style={styles.selectedAddressBox}>
                  <View style={styles.addressNameRow}>
                    <Text style={styles.addressName}>{selectedAddress.recipientName}</Text>
                    <Text style={styles.addressPhone}>{selectedAddress.phoneNumber}</Text>
                    {selectedAddress.isPrimary && (
                      <View style={styles.primaryBadgeInline}>
                        <Text style={styles.primaryBadgeInlineText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.selectedAddressText} numberOfLines={2}>
                    {formatAddress(selectedAddress)}
                  </Text>
                  {!selectedAddress.districtId && (
                    <TouchableOpacity
                      style={styles.warningRow}
                      onPress={() => handleEditAddress(selectedAddress.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="warning" size={14} color="#F59E0B" />
                      <Text style={styles.warningText}>Cần cập nhật mã vùng (chạm để chỉnh sửa)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={styles.selectAddressText}>Chọn địa chỉ giao hàng</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </View>

        {/* Shipping Provider */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đơn vị vận chuyển</Text>
          <View style={styles.shippingCard}>
            <View style={styles.shippingIcon}>
              <Ionicons name="car" size={24} color={COLORS.accentRed} />
            </View>
            <View style={styles.shippingInfo}>
              <Text style={styles.shippingName}>Giao Hàng Nhanh (GHN)</Text>
              {loadingShipping ? (
                <View style={styles.shippingLoading}>
                  <ActivityIndicator size="small" color={COLORS.accentRed} />
                  <Text style={styles.shippingLoadingText}>Đang tính phí...</Text>
                </View>
              ) : shippingError ? (
                <Text style={styles.shippingErrorText}>{shippingError}</Text>
              ) : shippingFee > 0 ? (
                <Text style={styles.shippingFee}>{formatPrice(shippingFee)}</Text>
              ) : (
                <Text style={styles.shippingPlaceholder}>Chọn địa chỉ để tính phí</Text>
              )}
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity style={styles.radioOption} onPress={() => setPaymentMethod('COD')} activeOpacity={0.7}>
            <View style={styles.radio}>
              {paymentMethod === 'COD' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <View style={styles.radioRow}>
                <Ionicons name="cash-outline" size={20} color={paymentMethod === 'COD' ? COLORS.accentRed : COLORS.grey} />
                <Text style={styles.radioLabel}>Thanh toán khi nhận hàng (COD)</Text>
              </View>
              <Text style={styles.radioDescription}>Thanh toán bằng tiền mặt khi nhận hàng</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.radioOption} onPress={() => setPaymentMethod('Online')} activeOpacity={0.7}>
            <View style={styles.radio}>
              {paymentMethod === 'Online' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <View style={styles.radioRow}>
                <Ionicons name="card-outline" size={20} color={paymentMethod === 'Online' ? COLORS.accentRed : COLORS.grey} />
                <Text style={styles.radioLabel}>VNPay</Text>
              </View>
              <Text style={styles.radioDescription}>Thanh toán qua VNPay (thẻ, ví điện tử)</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú đơn hàng</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ghi chú cho người giao hàng (tùy chọn)"
            placeholderTextColor={COLORS.grey}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.orderItemQuantityControls}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() =>
                    item.quantity <= 1
                      ? removeItem(item.id)
                      : updateQuantity(item.id, item.quantity - 1)
                  }
                  activeOpacity={0.7}
                >
                  {item.quantity <= 1 ? (
                    <Ionicons name="trash-outline" size={14} color={COLORS.accentRed} />
                  ) : (
                    <Ionicons name="remove" size={14} color={COLORS.cartTextPrimary} />
                  )}
                </TouchableOpacity>
                <Text style={styles.orderItemQuantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={14} color={COLORS.cartTextPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.orderItemPrice}>{formatPrice(item.priceCurrent * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{formatPrice(selectedSubtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>
              {loadingShipping ? '...' : shippingFee > 0 ? formatPrice(shippingFee) : 'Miễn phí'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>{formatPrice(totalAmount)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) + 14 }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotalAmount}>{formatPrice(totalAmount)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, (loading || loadingShipping) && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading || loadingShipping}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.checkoutButtonText}>Đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Dropdown Modal */}
      <Modal visible={showAddressDropdown} transparent animationType="slide" onRequestClose={() => setShowAddressDropdown(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ giao hàng</Text>
              <TouchableOpacity onPress={() => setShowAddressDropdown(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={COLORS.cartTextPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.addressOption, selectedAddressId === item.id && styles.addressOptionSelected]}
                  onPress={() => handleSelectAddress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressOptionContent}>
                    <View style={styles.addressOptionHeader}>
                      <Text style={styles.addressOptionName}>{item.recipientName}</Text>
                      <Text style={styles.addressOptionPhone}>{item.phoneNumber}</Text>
                      {item.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressOptionAddress} numberOfLines={2}>{formatAddress(item)}</Text>
                    {!item.districtId && (
                      <TouchableOpacity
                        style={styles.warningRow}
                        onPress={() => handleEditAddress(item.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="warning" size={12} color="#F59E0B" />
                        <Text style={[styles.warningText, { fontSize: 11 }]}>Chưa có mã vùng GHN (chạm để chỉnh sửa)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {selectedAddressId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.accentRed} />
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity style={styles.modalAddButton} onPress={handleAddNewAddress} activeOpacity={0.7}>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.accentRed} />
                  <Text style={styles.modalAddButtonText}>Thêm địa chỉ mới</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  headerBack: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  section: { marginBottom: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.cartTextPrimary },
  addAddressButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: COLORS.accentRed },
  addAddressButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.accentRed },

  addressSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, backgroundColor: '#FAFAFA' },
  selectedAddressBox: { flex: 1 },
  addressNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addressName: { fontSize: 14, fontWeight: '700', color: COLORS.cartTextPrimary },
  addressPhone: { fontSize: 13, color: COLORS.grey },
  selectedAddressText: { fontSize: 13, color: COLORS.cartTextPrimary, lineHeight: 18 },
  selectAddressText: { flex: 1, fontSize: 14, color: COLORS.grey },
  primaryBadgeInline: { backgroundColor: COLORS.accentRed, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeInlineText: { fontSize: 10, fontWeight: '600', color: COLORS.white },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  warningText: { fontSize: 12, color: '#F59E0B', fontWeight: '500' },

  // Shipping
  shippingCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, backgroundColor: '#FAFAFA', marginTop: 8 },
  shippingIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  shippingInfo: { flex: 1 },
  shippingName: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary, marginBottom: 4 },
  shippingFee: { fontSize: 14, fontWeight: '700', color: COLORS.accentRed },
  shippingLoading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shippingLoadingText: { fontSize: 12, color: COLORS.grey },
  shippingErrorText: { fontSize: 12, color: '#EF4444' },
  shippingPlaceholder: { fontSize: 12, color: COLORS.grey },

  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 12, color: COLORS.grey },
  emptyAddressContainer: { padding: 24, alignItems: 'center', gap: 8 },
  emptyAddressText: { fontSize: 14, color: COLORS.grey },
  addAddressButtonInline: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.accentRed },
  addAddressButtonInlineText: { fontSize: 14, fontWeight: '600', color: COLORS.accentRed },

  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.cartTextPrimary, backgroundColor: COLORS.white },
  textArea: { minHeight: 70, paddingTop: 10 },

  radioOption: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.accentRed, marginRight: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accentRed },
  radioContent: { flex: 1 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  radioLabel: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary },
  radioDescription: { fontSize: 12, color: COLORS.grey, marginLeft: 28 },

  orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  orderItemName: { flex: 1, fontSize: 13, color: COLORS.cartTextPrimary },
  orderItemQuantity: { fontSize: 13, color: COLORS.grey, marginHorizontal: 8 },
  orderItemQuantityControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 8 },
  quantityBtn: { width: 24, height: 24, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  orderItemQuantityText: { fontSize: 13, fontWeight: '600', color: COLORS.cartTextPrimary, minWidth: 20, textAlign: 'center' },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: COLORS.cartTextPrimary },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: COLORS.grey },
  summaryValue: { fontSize: 13, color: COLORS.cartTextPrimary, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.cartTextPrimary },
  totalAmount: { fontSize: 18, fontWeight: '700', color: COLORS.accentRed },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 12, color: COLORS.grey, marginBottom: 2 },
  footerTotalAmount: { fontSize: 18, fontWeight: '700', color: COLORS.accentRed },
  checkoutButton: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 10, backgroundColor: COLORS.accentRed, alignItems: 'center', justifyContent: 'center', minWidth: 120 },
  checkoutButtonDisabled: { opacity: 0.6 },
  checkoutButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.cartTextPrimary },
  addressOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  addressOptionSelected: { backgroundColor: '#FEF2F2' },
  addressOptionContent: { flex: 1 },
  addressOptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addressOptionName: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary },
  addressOptionPhone: { fontSize: 13, color: COLORS.grey },
  addressOptionAddress: { fontSize: 13, color: COLORS.cartTextPrimary, lineHeight: 18 },
  primaryBadge: { backgroundColor: COLORS.accentRed, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.white },
  modalAddButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  modalAddButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.accentRed },
});
