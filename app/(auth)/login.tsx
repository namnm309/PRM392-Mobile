import { COLORS } from "@/constants/theme";
import { styles } from '@/styles/auth.styles';
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Login() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMfaStep, setShowMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleEmailSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: trimmedEmail,
        password,
      });
      if (result.status === 'complete' && result.createdSessionId && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      } else if (result.status === 'needs_second_factor') {
        setShowMfaStep(true);
        setMfaCode('');
        setError('');
      } else {
        setError('Đăng nhập chưa hoàn tất. Thử lại.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'errors' in err
        ? (err as { errors: Array<{ message?: string }> }).errors?.[0]?.message
        : err instanceof Error
          ? err.message
          : 'Đăng nhập thất bại. Kiểm tra email và mật khẩu.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    if (!isLoaded || !signIn || !setActive) return;
    setError('');
    const code = mfaCode.trim();
    if (!code) {
      setError(useBackupCode ? 'Vui lòng nhập backup code.' : 'Vui lòng nhập mã từ ứng dụng xác thực.');
      return;
    }
    setLoading(true);
    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: useBackupCode ? 'backup_code' : 'totp',
        code,
      });
      if (attempt.status === 'complete' && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        setError('Xác minh chưa hoàn tất. Thử lại.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'errors' in err
        ? (err as { errors: Array<{ message?: string }> }).errors?.[0]?.message
        : err instanceof Error
          ? err.message
          : 'Mã không đúng hoặc đã hết hạn.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive: setActiveSession } = await startSSOFlow({ strategy: "oauth_google" });
      if (setActiveSession && createdSessionId) {
        await setActiveSession({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError('Đăng nhập Google thất bại. Thử lại sau.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.loginSection, styles.scrollContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="hardware-chip" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>TechStore</Text>
          <Text style={styles.tagline}>buy special technology devices</Text>
        </View>

        {showMfaStep ? (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Mã xác thực bước 2</Text>
            <Text style={[styles.linkText, { marginBottom: 16, textAlign: 'center' }]}>
              Clerk yêu cầu thêm bước xác minh. Nhập mã 6 số từ ứng dụng xác thực (Google Authenticator, Authy…) hoặc backup code.
            </Text>
            <Text style={styles.inputLabel}>Mã xác minh</Text>
            <TextInput
              style={[styles.otpInput, error ? styles.inputError : null]}
              placeholder={useBackupCode ? 'Backup code' : '000000'}
              placeholderTextColor={COLORS.grey}
              value={mfaCode}
              onChangeText={(t) => { setMfaCode(useBackupCode ? t : t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              keyboardType={useBackupCode ? 'default' : 'number-pad'}
              maxLength={useBackupCode ? undefined : 6}
              editable={!loading}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <Switch
                value={useBackupCode}
                onValueChange={(v) => { setUseBackupCode(v); setError(''); setMfaCode(''); }}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
              <Text style={styles.linkText}>Đây là backup code</Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleMfaVerify}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <Text style={styles.primaryButtonText}>Xác minh</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowMfaStep(false); setMfaCode(''); setError(''); setUseBackupCode(false); }}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.link}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.grey}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.grey}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleEmailSignIn}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
              disabled={loading}
            >
              <View style={styles.googleIconContainer}>
                <Ionicons name="logo-google" size={20} color={COLORS.surface} />
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>Chưa có tài khoản?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} disabled={loading}>
                <Text style={styles.link}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
