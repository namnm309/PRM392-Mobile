import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/api';

const RETURN_URL_PATH = '/api/VnPay/return';

export default function VnPayPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { paymentUrl, orderId } = useLocalSearchParams<{
    paymentUrl: string;
    orderId: string;
  }>();
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      if (processedRef.current) return;

      const url = navState.url;
      if (!url.includes(RETURN_URL_PATH)) return;

      processedRef.current = true;

      try {
        const urlObj = new URL(url);
        const responseCode = urlObj.searchParams.get('vnp_ResponseCode');
        const isSuccess = responseCode === '00';

        if (isSuccess) {
          router.replace({
            pathname: '/thank-you',
            params: { orderId, paymentSuccess: 'true' },
          });
        } else {
          Alert.alert(
            'Thanh toán thất bại',
            'Giao dịch không thành công. Vui lòng thử lại.',
            [
              {
                text: 'Quay lại',
                onPress: () => router.back(),
              },
            ]
          );
        }
      } catch {
        processedRef.current = false;
      }
    },
    [orderId, router]
  );

  const handleCancel = () => {
    Alert.alert('Hủy thanh toán', 'Bạn có chắc muốn hủy thanh toán?', [
      { text: 'Tiếp tục thanh toán', style: 'cancel' },
      {
        text: 'Hủy',
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  if (!paymentUrl) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy URL thanh toán</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={COLORS.cartTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán VNPAY</Text>
        <View style={styles.headerButton} />
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accentRed} />
          <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
        </View>
      )}

      <WebView
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationChange}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          Alert.alert('Lỗi', 'Không thể tải trang thanh toán. Vui lòng thử lại.', [
            { text: 'Quay lại', onPress: () => router.back() },
          ]);
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
    backgroundColor: COLORS.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.grey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.grey,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
