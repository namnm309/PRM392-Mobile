import { checkout } from '@/lib/ordersApi';
import { getMyAddresses, formatAddress, type AddressDto } from '@/lib/addressApi';
import { addCartItem, getCart } from '@/lib/cartApi';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React, { useState, useEffect, useRef } from 'react';
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
  const { getToken } = useAuth();
  const { items, reloadCart } = useCart();
  
  // Only use selected items for checkout
  const selectedItems = items.filter(item => item.selected !== false);
  
  // Calculate subtotal from selected items only
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.priceCurrent * item.quantity,
    0
  );
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  
  // Address management
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const addressesLoadedRef = useRef(false);
  
  // Notes only
  const [notes, setNotes] = useState('');

  // Load addresses on mount (only once)
  useEffect(() => {
    // Prevent multiple calls
    if (addressesLoadedRef.current) return;
    
    let isMounted = true;
    addressesLoadedRef.current = true;
    
    const loadAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const addressList = await getMyAddresses(getToken);
        
        if (!isMounted) return;
        
        setAddresses(addressList);
        
        // Find primary address
        const primaryAddress = addressList.find(addr => addr.isPrimary);
        if (primaryAddress) {
          setSelectedAddressId(primaryAddress.id);
        } else if (addressList.length > 0) {
          // If no primary, use first address
          setSelectedAddressId(addressList[0].id);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      } finally {
        if (isMounted) {
          setLoadingAddresses(false);
        }
      }
    };

    loadAddresses();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleSelectAddress = (address: AddressDto) => {
    setSelectedAddressId(address.id);
    setShowAddressDropdown(false);
  };

  const handleAddNewAddress = async () => {
    // Navigate to addresses screen
    router.push('/(tabs)/profile/addresses');
    // Reload addresses when coming back (using a small delay to ensure navigation completes)
    setTimeout(() => {
      addressesLoadedRef.current = false;
    }, 500);
  };

  const handleCheckout = async () => {
    // Validation
    if (!selectedAddressId) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    setLoading(true);
    try {
      // Get cart item IDs for selected items
      // Note: localItem.id should be the cart item ID from backend
      // If items were properly loaded from backend, these IDs are valid
      const cartItemIds = selectedItems.map(item => item.id);

      const order = await checkout(getToken, {
        addressId: selectedAddressId,
        paymentMethod,
        notes: notes.trim() || undefined,
        cartItemIds: cartItemIds.length > 0 ? cartItemIds : undefined,
      });

      // Reload cart after successful checkout
      // Backend has already removed the checked out items from database
      await reloadCart();

      // Navigate to thank you page with order ID
      router.replace({
        pathname: '/thank-you',
        params: { orderId: order.id },
      });
    } catch (error) {
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
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={handleAddNewAddress}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={COLORS.accentRed} />
              <Text style={styles.addAddressButtonText}>Thêm địa chỉ mới</Text>
            </TouchableOpacity>
          </View>

          {loadingAddresses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accentRed} />
              <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyAddressContainer}>
              <Text style={styles.emptyAddressText}>Chưa có địa chỉ nào</Text>
              <TouchableOpacity
                style={styles.addAddressButtonInline}
                onPress={handleAddNewAddress}
                activeOpacity={0.7}
              >
                <Text style={styles.addAddressButtonInlineText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addressSelector}
              onPress={() => setShowAddressDropdown(true)}
              activeOpacity={0.7}
            >
              {selectedAddressId ? (
                <View style={styles.selectedAddressContent}>
                  <Text style={styles.selectedAddressText} numberOfLines={1}>
                    {(() => {
                      const selected = addresses.find(a => a.id === selectedAddressId);
                      return selected ? formatAddress(selected) : 'Chọn địa chỉ';
                    })()}
                  </Text>
                  {addresses.find(a => a.id === selectedAddressId)?.isPrimary && (
                    <View style={styles.primaryBadgeInline}>
                      <Text style={styles.primaryBadgeInlineText}>Mặc định</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.selectAddressText}>Chọn địa chỉ giao hàng</Text>
              )}
              <Ionicons name="chevron-down" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.7}
          >
            <View style={styles.radio}>
              {paymentMethod === 'COD' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>Thanh toán khi nhận hàng</Text>
              <Text style={styles.radioDescription}>Thanh toán bằng tiền mặt khi nhận hàng</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPaymentMethod('Online')}
            activeOpacity={0.7}
          >
            <View style={styles.radio}>
              {paymentMethod === 'Online' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>Thanh toán online</Text>
              <Text style={styles.radioDescription}>Thanh toán qua thẻ, ví điện tử</Text>
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
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
          {selectedItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
              <Text style={styles.orderItemPrice}>{formatPrice(item.priceCurrent * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng:</Text>
            <Text style={styles.totalAmount}>{formatPrice(selectedSubtotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) + 14 }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Tổng thanh toán:</Text>
          <Text style={styles.footerTotalAmount}>{formatPrice(selectedSubtotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, loading && styles.checkoutButtonDisabled]}
          onPress={handleCheckout}
          disabled={loading}
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
      <Modal
        visible={showAddressDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn địa chỉ giao hàng</Text>
              <TouchableOpacity
                onPress={() => setShowAddressDropdown(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={COLORS.cartTextPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addressOption,
                    selectedAddressId === item.id && styles.addressOptionSelected,
                  ]}
                  onPress={() => handleSelectAddress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressOptionContent}>
                    <View style={styles.addressOptionHeader}>
                      <Text style={styles.addressOptionAddress} numberOfLines={1}>
                        {formatAddress(item)}
                      </Text>
                      {item.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {selectedAddressId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.accentRed} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyAddressContainer}>
                  <Text style={styles.emptyAddressText}>Chưa có địa chỉ nào</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  addAddressButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  addressSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  selectedAddressContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedAddressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  selectAddressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.grey,
  },
  primaryBadgeInline: {
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeInlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  addAddressButtonInline: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
    alignItems: 'center',
  },
  addAddressButtonInlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.grey,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
    backgroundColor: COLORS.white,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accentRed,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 12,
    color: COLORS.grey,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: COLORS.grey,
    marginHorizontal: 8,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerTotal: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: COLORS.grey,
    marginBottom: 4,
  },
  footerTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  checkoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  addressOptionSelected: {
    backgroundColor: COLORS.white,
  },
  addressOptionContent: {
    flex: 1,
  },
  addressOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressOptionAddress: {
    flex: 1,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  primaryBadge: {
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyAddressContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyAddressText: {
    fontSize: 14,
    color: COLORS.grey,
  },
});
