import { useSignIn } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';

/**
 * Màn hình xử lý callback sau khi đăng nhập Google (SSO).
 * Clerk redirect về /-/sso-callback?created_session_id=...&rotating_token_nonce=...
 * Route này set session và chuyển vào app.
 */
export default function SSOCallbackScreen() {
  const { setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const params = useLocalSearchParams<{ created_session_id?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !setActive) return;

    const sessionId = params.created_session_id;
    if (!sessionId) {
      setError('Thiếu thông tin phiên đăng nhập.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await setActive({ session: sessionId });
        if (!cancelled) router.replace('/(tabs)');
      } catch (e) {
        if (!cancelled) {
          console.error('SSO callback error:', e);
          setError('Không thể kích hoạt phiên. Thử đăng nhập lại.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, setActive, params.created_session_id, router]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 24 }}>
        <Text style={{ color: COLORS.text, marginBottom: 16, textAlign: 'center' }}>{error}</Text>
        <Text style={{ color: COLORS.primary }} onPress={() => router.replace('/(auth)/login')}>
          Quay lại đăng nhập
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ color: COLORS.text, marginTop: 16 }}>Đang đăng nhập...</Text>
    </View>
  );
}
