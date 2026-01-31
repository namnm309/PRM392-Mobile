import { COLORS } from "@/constants/theme";
import { styles } from '@/styles/auth.styles';
import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Step = 'form' | 'otp';

export default function Register() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async () => {
    if (!isLoaded || !signUp) return;
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
    if (password.length < 8) {
      setError('Mật khẩu cần ít nhất 8 ký tự');
      return;
    }
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: trimmedEmail,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('otp');
      setOtp('');
      setError('');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'errors' in err
        ? (err as { errors: Array<{ message?: string }> }).errors?.[0]?.message
        : err instanceof Error
          ? err.message
          : 'Đăng ký thất bại. Email có thể đã được sử dụng hoặc mật khẩu chưa đủ mạnh.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isLoaded || !signUp || !setActive) return;
    setError('');
    const code = otp.trim();
    if (!code) {
      setError('Vui lòng nhập mã xác minh');
      return;
    }
    setLoading(true);
    try {
      const { createdSessionId } = await signUp.attemptEmailAddressVerification({ code });
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'errors' in err
        ? (err as { errors: Array<{ message?: string }> }).errors?.[0]?.message
        : err instanceof Error
          ? err.message
          : 'Mã xác minh không đúng hoặc đã hết hạn.';
      setError(String(msg));
    } finally {
      setLoading(false);
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

        {step === 'form' ? (
          <>
            <Text style={styles.stepTitle}>Tạo tài khoản</Text>
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
              <Text style={styles.inputLabel}>Mật khẩu (ít nhất 8 ký tự)</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.grey}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(''); }}
                secureTextEntry
                editable={!loading}
              />
              <Text style={styles.inputLabel}>Họ (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nguyễn"
                placeholderTextColor={COLORS.grey}
                value={lastName}
                onChangeText={setLastName}
                editable={!loading}
              />
              <Text style={styles.inputLabel}>Tên (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Văn A"
                placeholderTextColor={COLORS.grey}
                value={firstName}
                onChangeText={setFirstName}
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSubmitForm}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.background} />
                ) : (
                  <Text style={styles.primaryButtonText}>Tiếp tục</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.stepTitle}>Nhập mã xác minh</Text>
            <Text style={[styles.linkText, { marginBottom: 16, textAlign: 'center' }]}>
              Chúng tôi đã gửi mã 6 số đến {email}
            </Text>
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Mã xác minh</Text>
              <TextInput
                style={[styles.otpInput, error ? styles.inputError : null]}
                placeholder="000000"
                placeholderTextColor={COLORS.grey}
                value={otp}
                onChangeText={(t) => { setOtp(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleVerifyOtp}
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
                onPress={() => { setStep('form'); setError(''); setOtp(''); }}
                disabled={loading}
                style={{ marginTop: 12 }}
              >
                <Text style={styles.link}>Gửi lại mã / Đổi email</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.linkRow}>
          <Text style={styles.linkText}>Đã có tài khoản?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} disabled={loading}>
            <Text style={styles.link}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
