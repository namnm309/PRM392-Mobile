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

  // Decode the URL if it was encoded
  let decodedUrl = paymentUrl;
  if (paymentUrl && typeof paymentUrl === 'string') {
    try {
      decodedUrl = decodeURIComponent(paymentUrl);
    } catch (e) {
      console.error('URL decode failed:', e);
    }
  }

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      if (processedRef.current) return;

      const url = navState.url;
      
      // Only process if the URL is actually the return URL from backend
      // Not just containing the return URL as a parameter
      if (!url.startsWith(API_BASE_URL) || !url.includes(RETURN_URL_PATH)) {
        return;
      }

      processedRef.current = true;

      try {
        const urlObj = new URL(url);
        const responseCode = urlObj.searchParams.get('vnp_ResponseCode');
        
        // Don't decide success/fail here, let BE IPN decide
        // Just redirect to thank-you and let it poll the order status
        router.replace({
          pathname: '/thank-you',
          params: { orderId },
        });
      } catch (error) {
        console.error('Error processing return URL:', error);
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

  // Handle case where paymentUrl might be an array (React Navigation quirk)
  const urlString = Array.isArray(decodedUrl) ? decodedUrl[0] : decodedUrl;
  
  if (!urlString || typeof urlString !== 'string') {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>URL thanh toán không hợp lệ</Text>
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
        source={{ uri: urlString }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setLoading(false);
          Alert.alert('Lỗi', 'Không thể tải trang thanh toán. Vui lòng thử lại.', [
            { text: 'Quay lại', onPress: () => router.back() },
          ]);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent.statusCode);
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
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
