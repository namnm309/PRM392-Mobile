import { AdaptiveHeader } from "@/components/AdaptiveHeader";
import { COLORS } from "@/constants/theme";
import { useCart } from "@/contexts/CartContext";
import {
    formatAddress,
    getMyAddresses,
    type AddressDto,
} from "@/lib/addressApi";
import { checkout } from "@/lib/ordersApi";
import { calculateShippingFee } from "@/lib/shippingApi";
import { createVnPayUrl } from "@/lib/vnpayApi";
import {
  applyVoucher,
  getActiveVouchers,
  getVoucherByCode,
  type VoucherBreakdownDto,
  type VoucherDto,
} from "@/lib/voucherApi";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatPrice(v: number) {
  return new Intl.NumberFormat("vi-VN").format(v) + "₫";
}

function translateVoucherMessage(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("not active")) {
    return "Mã khuyến mãi này hiện không hoạt động. Vui lòng chọn mã khác.";
  }

  if (lower.includes("no eligible items for voucher")) {
    return "Không có sản phẩm nào trong giỏ đủ điều kiện áp dụng mã này. Vui lòng thử với sản phẩm khác hoặc xem lại điều kiện sử dụng.";
  }

  if (lower.includes("voucher not found")) {
    return "Không tìm thấy mã khuyến mãi. Vui lòng kiểm tra lại mã bạn đã nhập.";
  }

  return "Không thể áp dụng mã khuyến mãi. Vui lòng kiểm tra lại điều kiện sử dụng hoặc thử mã khác.";
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken, isSignedIn } = useAuth();
  const { items, reloadCart } = useCart();

  const selectedItems = useMemo(
    () => items.filter((item) => item.selected === true),
    [items],
  );
  const selectedSubtotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.priceCurrent * item.quantity,
        0,
      ),
    [selectedItems],
  );

  const hasDiscountedItems = useMemo(
    () => selectedItems.some((item) => item.priceOriginal > item.priceCurrent),
    [selectedItems],
  );

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "Online">("COD");

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const selectedAddressIdRef = useRef<string | null>(null);

  const [notes, setNotes] = useState("");

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] =
    useState<VoucherBreakdownDto | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherList, setVoucherList] = useState<VoucherDto[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [voucherListError, setVoucherListError] = useState<string | null>(null);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Shipping
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingServiceId, setShippingServiceId] = useState<
    number | undefined
  >();
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const lastShippingCalcKeyRef = useRef<string | null>(null);

  // Refs to prevent unnecessary re-renders
  const getTokenRef = useRef(getToken);
  const addressesLoadedRef = useRef(false);

  // Keep getToken ref updated
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const totalAmount = useMemo(
    () => Math.max(selectedSubtotal + shippingFee - discountAmount, 0),
    [selectedSubtotal, shippingFee, discountAmount],
  );
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  useEffect(() => {
    selectedAddressIdRef.current = selectedAddressId;
  }, [selectedAddressId]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadAddresses = async () => {
        // Only show loading indicator on first load
        if (!addressesLoadedRef.current) {
          setLoadingAddresses(true);
        }

        try {
          const addressList = await getMyAddresses(getTokenRef.current);
          if (!isActive) return;

          addressesLoadedRef.current = true;
          setAddresses(addressList);

          const previousSelectedId = selectedAddressIdRef.current;
          if (
            previousSelectedId &&
            addressList.some((addr) => addr.id === previousSelectedId)
          ) {
            // Keep the current selection - don't call setSelectedAddressId to avoid re-render
            return;
          }

          const primaryAddress = addressList.find((addr) => addr.isPrimary);
          if (primaryAddress) {
            setSelectedAddressId(primaryAddress.id);
          } else if (addressList.length > 0) {
            setSelectedAddressId(addressList[0].id);
          } else {
            setSelectedAddressId(null);
          }
        } catch (error) {
          console.error("Error loading addresses:", error);
        } finally {
          if (isActive) setLoadingAddresses(false);
        }
      };

      loadAddresses();

      return () => {
        isActive = false;
      };
    }, []), // Empty dependency array - uses refs instead
  );

  // Memoize a stable key for shipping calculation to prevent unnecessary API calls
  const shippingCalcKey = useMemo(() => {
    if (!selectedAddressId) return null;
    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address?.districtId || !address?.wardCode) return null;

    const totalWeight = selectedItems.reduce(
      (sum, item) => sum + item.quantity * 500,
      0,
    );
    const weight = totalWeight > 0 ? totalWeight : 500;
    const insuranceValue = Math.min(selectedSubtotal, 5000000);

    return `${selectedAddressId}:${address.districtId}:${address.wardCode}:${weight}:${insuranceValue}`;
  }, [selectedAddressId, addresses, selectedItems, selectedSubtotal]);

  // Calculate shipping fee when the shipping calculation key changes
  useEffect(() => {
    if (!selectedAddressId) {
      setShippingFee(0);
      setShippingError(null);
      lastShippingCalcKeyRef.current = null;
      return;
    }

    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address?.districtId || !address?.wardCode) {
      setShippingFee(0);
      setShippingError(
        "Địa chỉ chưa có mã vùng GHN. Vui lòng cập nhật địa chỉ.",
      );
      lastShippingCalcKeyRef.current = null;
      return;
    }

    // Skip if the calculation key hasn't changed
    if (lastShippingCalcKeyRef.current === shippingCalcKey) {
      return;
    }
    lastShippingCalcKeyRef.current = shippingCalcKey;

    const totalWeight = selectedItems.reduce(
      (sum, item) => sum + item.quantity * 500,
      0,
    );
    const weight = totalWeight > 0 ? totalWeight : 500;
    const insuranceValue = Math.min(selectedSubtotal, 5000000);

    let cancelled = false;

    const fetchShippingFee = async () => {
      setLoadingShipping(true);
      setShippingError(null);
      try {
        const fee = await calculateShippingFee({
          toDistrictId: address.districtId!,
          toWardCode: address.wardCode!,
          weight,
          insuranceValue,
        });
        if (!cancelled) {
          setShippingFee(fee.total);
          setShippingServiceId(undefined);
        }
      } catch (err) {
        console.error("Shipping fee error:", err);
        if (!cancelled) {
          setShippingError("Không thể tính phí vận chuyển. Vui lòng thử lại.");
          setShippingFee(0);
          // Allow retry on next change
          lastShippingCalcKeyRef.current = null;
        }
      } finally {
        if (!cancelled) {
          setLoadingShipping(false);
        }
      }
    };

    fetchShippingFee();

    return () => {
      cancelled = true;
    };
  }, [
    shippingCalcKey,
    selectedAddressId,
    addresses,
    selectedItems,
    selectedSubtotal,
  ]);

  // Reset voucher state when cart is cleared
  useEffect(() => {
    if (selectedItems.length === 0 && appliedVoucher) {
      setAppliedVoucher(null);
      setVoucherCode("");
      setVoucherError(null);
      setSelectedVoucherId(null);
    }
  }, [selectedItems, appliedVoucher]);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace({
        pathname: "/(auth)/login",
        params: { redirect: "/checkout" },
      });
    }
  }, [isSignedIn, router]);

  const loadVoucherList = useCallback(async () => {
    try {
      setLoadingVouchers(true);
      setVoucherListError(null);
      const data = await getActiveVouchers();
      setVoucherList(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách mã khuyến mãi";
      setVoucherListError(message);
    } finally {
      setLoadingVouchers(false);
    }
  }, []);

  const handleApplyVoucher = useCallback(
    async (codeFromUi?: string, voucherIdFromUi?: string) => {
      const code = (codeFromUi ?? voucherCode).trim().toUpperCase();
      if (!code) {
        setVoucherError("Vui lòng nhập mã khuyến mãi");
        return;
      }

      const hasDiscounted = selectedItems.some(
        (item) => item.priceOriginal > item.priceCurrent,
      );
      if (hasDiscounted) {
        const msg =
          "Sản phẩm trong giỏ đang được giảm giá nên không thể dùng thêm mã khuyến mãi.";
        setVoucherError(msg);
        Alert.alert("Mã khuyến mãi", msg);
        return;
      }

      if (selectedItems.length === 0) {
        setVoucherError("Không có sản phẩm nào để áp dụng mã khuyến mãi");
        return;
      }

      try {
        setApplyingVoucher(true);
        setVoucherError(null);
        const cartItemIds = selectedItems.map((i) => i.id);
        const breakdown = await applyVoucher(
          getTokenRef.current,
          code,
          cartItemIds,
        );

        if (breakdown.errorMessage) {
          const friendly = translateVoucherMessage(breakdown.errorMessage);
          setAppliedVoucher(null);
          setVoucherError(friendly);
          Alert.alert("Mã khuyến mãi", friendly);
          return;
        }

        // Xác định voucherId cho checkout
        let resolvedVoucherId: string | null = voucherIdFromUi ?? null;
        if (!resolvedVoucherId) {
          const fromList = voucherList.find(
            (v) => v.code.toUpperCase() === code,
          );
          if (fromList) {
            resolvedVoucherId = fromList.id;
          } else {
            try {
              const voucherDto = await getVoucherByCode(code);
              resolvedVoucherId = voucherDto?.id ?? null;
            } catch (e) {
              console.warn("Không lấy được voucherId từ mã:", e);
            }
          }
        }

        setAppliedVoucher(breakdown);
        setSelectedVoucherId(resolvedVoucherId);
        setVoucherCode(breakdown.voucherCode);
        setVoucherError(null);
        setShowVoucherModal(false);
      } catch (error) {
        const friendly = translateVoucherMessage(
          error instanceof Error ? error.message : "",
        );
        setVoucherError(friendly);
        Alert.alert("Mã khuyến mãi", friendly);
      } finally {
        setApplyingVoucher(false);
      }
    },
    [selectedItems, voucherCode, voucherList],
  );

  const handleOpenVoucherModal = () => {
    setShowVoucherModal(true);
    if (voucherList.length === 0 && !loadingVouchers) {
      void loadVoucherList();
    }
  };

  const handleCopyVoucherCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
    } catch (error) {
      console.error("Copy voucher code error:", error);
    }
  };

  const handleSelectAddress = (address: AddressDto) => {
    setSelectedAddressId(address.id);
    setShowAddressDropdown(false);
  };

  const handleEditAddress = (addressId: string) => {
    router.push({ pathname: "/address-form", params: { editId: addressId } });
  };

  const handleAddNewAddress = async () => {
    router.push("/address-form");
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      Alert.alert("Lỗi", "Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }

    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address?.districtId || !address?.wardCode) {
      Alert.alert(
        "Lỗi",
        "Địa chỉ giao hàng chưa có mã vùng. Vui lòng cập nhật địa chỉ trước khi đặt hàng.",
      );
      return;
    }

    setLoading(true);
    try {
      const cartItemIds = selectedItems.map((item) => item.id);

      const order = await checkout(getToken, {
        addressId: selectedAddressId,
        paymentMethod,
        voucherId: selectedVoucherId ?? undefined,
        notes: notes.trim() || undefined,
        cartItemIds: cartItemIds.length > 0 ? cartItemIds : undefined,
        shippingFee,
        shippingServiceId,
      });

      await reloadCart();

      if (paymentMethod === "Online") {
        const paymentUrl = await createVnPayUrl(getToken, order.id);
        const encodedUrl = encodeURIComponent(paymentUrl);

        router.replace({
          pathname: "/vnpay-payment",
          params: {
            paymentUrl: encodedUrl,
            orderId: order.id,
          },
        });
      } else {
        router.replace({
          pathname: "/thank-you",
          params: { orderId: order.id },
        });
      }
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert(
        "Lỗi",
        error instanceof Error
          ? error.message
          : "Đặt hàng thất bại. Vui lòng thử lại.",
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
            <Ionicons
              name="chevron-back"
              size={24}
              color={COLORS.cartTextPrimary}
            />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={handleAddNewAddress}
              activeOpacity={0.7}
            >
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
              <TouchableOpacity
                style={styles.addAddressButtonInline}
                onPress={handleAddNewAddress}
                activeOpacity={0.7}
              >
                <Text style={styles.addAddressButtonInlineText}>
                  Thêm địa chỉ mới
                </Text>
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
                    <Text style={styles.addressName}>
                      {selectedAddress.recipientName}
                    </Text>
                    <Text style={styles.addressPhone}>
                      {selectedAddress.phoneNumber}
                    </Text>
                    {selectedAddress.isPrimary && (
                      <View style={styles.primaryBadgeInline}>
                        <Text style={styles.primaryBadgeInlineText}>
                          Mặc định
                        </Text>
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
                      <Text style={styles.warningText}>
                        Cần cập nhật mã vùng (chạm để chỉnh sửa)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={styles.selectAddressText}>
                  Chọn địa chỉ giao hàng
                </Text>
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
                  <Text style={styles.shippingLoadingText}>
                    Đang tính phí...
                  </Text>
                </View>
              ) : shippingError ? (
                <Text style={styles.shippingErrorText}>{shippingError}</Text>
              ) : shippingFee > 0 ? (
                <Text style={styles.shippingFee}>
                  {formatPrice(shippingFee)}
                </Text>
              ) : (
                <Text style={styles.shippingPlaceholder}>
                  Chọn địa chỉ để tính phí
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPaymentMethod("COD")}
            activeOpacity={0.7}
          >
            <View style={styles.radio}>
              {paymentMethod === "COD" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <View style={styles.radioRow}>
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={
                    paymentMethod === "COD" ? COLORS.accentRed : COLORS.grey
                  }
                />
                <Text style={styles.radioLabel}>
                  Thanh toán khi nhận hàng (COD)
                </Text>
              </View>
              <Text style={styles.radioDescription}>
                Thanh toán bằng tiền mặt khi nhận hàng
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setPaymentMethod("Online")}
            activeOpacity={0.7}
          >
            <View style={styles.radio}>
              {paymentMethod === "Online" && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioContent}>
              <View style={styles.radioRow}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={
                    paymentMethod === "Online" ? COLORS.accentRed : COLORS.grey
                  }
                />
                <Text style={styles.radioLabel}>VNPay</Text>
              </View>
              <Text style={styles.radioDescription}>
                Thanh toán qua VNPay (thẻ, ví điện tử)
              </Text>
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
              <View style={styles.orderItemImageWrap}>
                {item.imageUri ? (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.orderItemImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.orderItemImagePlaceholder}>
                    <Ionicons
                      name="image-outline"
                      size={18}
                      color={COLORS.grey}
                    />
                  </View>
                )}
              </View>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.variantLabel ? (
                  <Text style={styles.orderItemVariant} numberOfLines={1}>
                    {item.variantLabel}
                  </Text>
                ) : null}
                <Text style={styles.orderItemQuantityText}>
                  Số lượng: {item.quantity}
                </Text>
              </View>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.priceCurrent * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          {/* Voucher input */}
          <View style={styles.voucherContainer}>
            <View style={styles.voucherRow}>
              <TextInput
                style={styles.voucherInput}
                value={voucherCode}
                onChangeText={(text) => {
                  setVoucherCode(text);
                  if (voucherError) setVoucherError(null);
                }}
                placeholder="Nhập mã khuyến mãi"
                placeholderTextColor={COLORS.grey}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.voucherApplyButton,
                  (applyingVoucher ||
                    !voucherCode.trim() ||
                    selectedItems.length === 0 ||
                    hasDiscountedItems) &&
                    styles.voucherApplyButtonDisabled,
                ]}
                onPress={
                  hasDiscountedItems ? undefined : () => handleApplyVoucher()
                }
                disabled={
                  applyingVoucher ||
                  !voucherCode.trim() ||
                  selectedItems.length === 0 ||
                  hasDiscountedItems
                }
                activeOpacity={0.7}
              >
                {applyingVoucher ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.voucherApplyButtonText}>Áp dụng</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.voucherAvailableRow}
              onPress={handleOpenVoucherModal}
              activeOpacity={0.7}
            >
              <View style={styles.voucherAvailableLeft}>
                <Ionicons
                  name="gift-outline"
                  size={18}
                  color={COLORS.accentRed}
                />
                <Text style={styles.voucherAvailableText}>
                  Mã khuyến mãi có sẵn
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.grey} />
            </TouchableOpacity>

            {voucherError ? (
              <Text style={styles.voucherErrorText}>{voucherError}</Text>
            ) : null}

            {appliedVoucher && discountAmount > 0 ? (
              <Text style={styles.voucherAppliedText}>
                Đã áp dụng mã {appliedVoucher.voucherCode}
              </Text>
            ) : null}
          </View>

          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>
              {formatPrice(selectedSubtotal)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
            <Text style={styles.summaryValue}>
              {loadingShipping
                ? "..."
                : shippingFee > 0
                  ? formatPrice(shippingFee)
                  : "Miễn phí"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giảm giá trực tiếp</Text>
            <Text
              style={[
                styles.summaryValue,
                discountAmount > 0 && styles.summaryValueDiscount,
              ]}
            >
              {discountAmount > 0 ? `-${formatPrice(discountAmount)}` : "0₫"}
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
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 14) + 14 },
        ]}
      >
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Tổng thanh toán</Text>
          <Text style={styles.footerTotalAmount}>
            {formatPrice(totalAmount)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (loading || loadingShipping) && styles.checkoutButtonDisabled,
          ]}
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
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.cartTextPrimary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.addressOption,
                    selectedAddressId === item.id &&
                      styles.addressOptionSelected,
                  ]}
                  onPress={() => handleSelectAddress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressOptionContent}>
                    <View style={styles.addressOptionHeader}>
                      <Text style={styles.addressOptionName}>
                        {item.recipientName}
                      </Text>
                      <Text style={styles.addressOptionPhone}>
                        {item.phoneNumber}
                      </Text>
                      {item.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressOptionAddress} numberOfLines={2}>
                      {formatAddress(item)}
                    </Text>
                    {!item.districtId && (
                      <TouchableOpacity
                        style={styles.warningRow}
                        onPress={() => handleEditAddress(item.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="warning" size={12} color="#F59E0B" />
                        <Text style={[styles.warningText, { fontSize: 11 }]}>
                          Chưa có mã vùng GHN (chạm để chỉnh sửa)
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {selectedAddressId === item.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.accentRed}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={COLORS.accentRed}
                  />
                  <Text style={styles.modalAddButtonText}>
                    Thêm địa chỉ mới
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Voucher Modal */}
      <Modal
        visible={showVoucherModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mã khuyến mãi có sẵn</Text>
              <TouchableOpacity
                onPress={() => setShowVoucherModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.cartTextPrimary}
                />
              </TouchableOpacity>
            </View>

            {loadingVouchers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.accentRed} />
                <Text style={styles.loadingText}>
                  Đang tải mã khuyến mãi...
                </Text>
              </View>
            ) : voucherListError ? (
              <View style={styles.voucherErrorContainer}>
                <Text style={styles.shippingErrorText}>{voucherListError}</Text>
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={() => void loadVoucherList()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalAddButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : voucherList.length === 0 ? (
              <View style={styles.emptyVoucherContainer}>
                <Ionicons
                  name="pricetag-outline"
                  size={40}
                  color={COLORS.grey}
                />
                <Text style={styles.emptyVoucherText}>
                  Hiện chưa có mã khuyến mãi nào
                </Text>
              </View>
            ) : (
              <FlatList
                data={voucherList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 16 }}
                renderItem={({ item }) => {
                  const isPercent = item.discountType === "Percentage";
                  const discountText = isPercent
                    ? `Giảm ${item.value}%`
                    : `Giảm ${item.value.toLocaleString("vi-VN")}đ`;

                  return (
                    <View style={styles.voucherCard}>
                      <View style={styles.voucherCardRow}>
                        <View style={styles.voucherIconWrap}>
                          <Ionicons
                            name="gift-outline"
                            size={22}
                            color={COLORS.white}
                          />
                        </View>
                        <View style={styles.voucherMain}>
                          <Text style={styles.voucherName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View style={styles.voucherMetaRow}>
                            <Text style={styles.voucherExpiryLabel}>HSD:</Text>
                            <Text style={styles.voucherExpiryValue}>
                              {new Date(item.endTime).toLocaleDateString(
                                "vi-VN",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )}
                            </Text>
                            <Text style={styles.voucherRulesText}>
                              Xem thể lệ
                            </Text>
                          </View>

                          <View style={styles.voucherCodeRow}>
                            <View style={styles.voucherCodeBox}>
                              <Text style={styles.voucherCodeText}>
                                {item.code}
                              </Text>
                              <TouchableOpacity
                                onPress={() =>
                                  void handleCopyVoucherCode(item.code)
                                }
                                style={styles.voucherCodeCopyBtn}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name="copy-outline"
                                  size={16}
                                  color={COLORS.cartTextPrimary}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <Text
                            style={styles.voucherDescText}
                            numberOfLines={1}
                          >
                            {discountText}
                            {item.minOrderValue > 0 && (
                              <>
                                {" "}
                                · Đơn tối thiểu{" "}
                                {item.minOrderValue.toLocaleString("vi-VN")}đ
                              </>
                            )}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.voucherCardApplyBtn,
                            (hasDiscountedItems || applyingVoucher) &&
                              styles.voucherCardApplyBtnDisabled,
                          ]}
                          onPress={
                            hasDiscountedItems || applyingVoucher
                              ? undefined
                              : () =>
                                  void handleApplyVoucher(item.code, item.id)
                          }
                          disabled={hasDiscountedItems || applyingVoucher}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.voucherCardApplyBtnText}>
                            Áp dụng
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  headerBack: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },

  section: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  addAddressButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.accentRed,
  },

  addressSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  selectedAddressBox: { flex: 1 },
  addressNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  addressName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
  },
  addressPhone: { fontSize: 13, color: COLORS.grey },
  selectedAddressText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    lineHeight: 18,
  },
  selectAddressText: { flex: 1, fontSize: 14, color: COLORS.grey },
  primaryBadgeInline: {
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeInlineText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  warningText: { fontSize: 12, color: "#F59E0B", fontWeight: "500" },

  // Shipping
  shippingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    marginTop: 8,
  },
  shippingIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shippingInfo: { flex: 1 },
  shippingName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  shippingFee: { fontSize: 14, fontWeight: "700", color: COLORS.accentRed },
  shippingLoading: { flexDirection: "row", alignItems: "center", gap: 6 },
  shippingLoadingText: { fontSize: 12, color: COLORS.grey },
  shippingErrorText: { fontSize: 12, color: "#EF4444" },
  shippingPlaceholder: { fontSize: 12, color: COLORS.grey },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  loadingText: { fontSize: 12, color: COLORS.grey },
  emptyAddressContainer: { padding: 24, alignItems: "center", gap: 8 },
  emptyAddressText: { fontSize: 14, color: COLORS.grey },
  addAddressButtonInline: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentRed,
  },
  addAddressButtonInlineText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accentRed,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
    backgroundColor: COLORS.white,
  },
  textArea: { minHeight: 70, paddingTop: 10 },

  radioOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.accentRed,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.accentRed,
  },
  radioContent: { flex: 1 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.cartTextPrimary,
  },
  radioDescription: { fontSize: 12, color: COLORS.grey, marginLeft: 28 },

  orderItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  orderItemImageWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  orderItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  orderItemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: { fontSize: 13, color: COLORS.cartTextPrimary },
  orderItemVariant: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.grey,
  },
  orderItemQuantityText: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.grey,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.cartTextPrimary,
  },

  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 10 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, color: COLORS.grey },
  summaryValue: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    fontWeight: "500",
  },
  summaryValueDiscount: { color: "#16A34A" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
  },
  totalAmount: { fontSize: 18, fontWeight: "700", color: COLORS.accentRed },

  voucherContainer: { marginBottom: 8 },
  voucherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    backgroundColor: "#F9FAFB",
  },
  voucherApplyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherApplyButtonDisabled: {
    opacity: 0.6,
  },
  voucherApplyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
  voucherAvailableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  voucherAvailableLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  voucherAvailableText: {
    fontSize: 13,
    color: COLORS.accentRed,
    fontWeight: "500",
  },
  voucherErrorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#EF4444",
  },
  voucherAppliedText: {
    marginTop: 4,
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "500",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 12, color: COLORS.grey, marginBottom: 2 },
  footerTotalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.accentRed,
  },
  checkoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: COLORS.accentRed,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  checkoutButtonDisabled: { opacity: 0.6 },
  checkoutButtonText: { fontSize: 14, fontWeight: "700", color: COLORS.white },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  addressOptionSelected: { backgroundColor: "#FEF2F2" },
  addressOptionContent: { flex: 1 },
  addressOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  addressOptionName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.cartTextPrimary,
  },
  addressOptionPhone: { fontSize: 13, color: COLORS.grey },
  addressOptionAddress: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    lineHeight: 18,
  },
  primaryBadge: {
    backgroundColor: COLORS.accentRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: { fontSize: 10, fontWeight: "600", color: COLORS.white },
  modalAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  modalAddButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.accentRed,
  },

  voucherErrorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
  },
  emptyVoucherContainer: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyVoucherText: {
    fontSize: 14,
    color: COLORS.grey,
    textAlign: "center",
  },
  voucherCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  voucherCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  voucherIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.accentRed,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherMain: {
    flex: 1,
    gap: 4,
  },
  voucherName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
  },
  voucherMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  voucherExpiryLabel: {
    fontSize: 12,
    color: COLORS.grey,
  },
  voucherExpiryValue: {
    fontSize: 12,
    color: COLORS.cartTextPrimary,
    fontWeight: "500",
  },
  voucherRulesText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.accentRed,
    fontWeight: "500",
  },
  voucherCodeRow: {
    marginTop: 2,
    marginBottom: 2,
  },
  voucherCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
  },
  voucherCodeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.cartTextPrimary,
    letterSpacing: 1,
  },
  voucherCodeCopyBtn: {
    marginLeft: 8,
  },
  voucherDescText: {
    fontSize: 12,
    color: COLORS.cartTextPrimary,
  },
  voucherCardApplyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.accentRed,
  },
  voucherCardApplyBtnDisabled: {
    opacity: 0.6,
  },
  voucherCardApplyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
});
