import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchWithAuth } from '@/lib/authApi';
import { API_BASE_URL } from '@/constants/api';
import { COLORS } from '@/constants/theme';

interface UserResponseDto {
  id: string;
  clerkId: string;
  email: string;
  phoneNumber?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  defaultAddress?: string | null;
  city?: string | null;
  loyaltyPoints: number;
  status: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T | null;
  errors?: string[];
}

interface UpdateUserBody {
  phoneNumber?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  defaultAddress?: string | null;
  city?: string | null;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Chọn giới tính' },
  { value: 'Male', label: 'Nam' },
  { value: 'Female', label: 'Nữ' },
  { value: 'Other', label: 'Khác' },
];

function formatDateForInput(iso?: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

/** Hiển thị ngày theo dd/MM/yyyy (chỉ dùng cho UI, không đổi format API). */
function formatDateDisplay(isoOrYyyyMmDd: string): string {
  if (!isoOrYyyyMmDd || !isoOrYyyyMmDd.trim()) return '';
  try {
    const d = new Date(isoOrYyyyMmDd.trim());
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/** Parse response body as JSON; avoid "Unexpected end of input" when body is empty or non-JSON. */
async function parseJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text || text.trim() === '') return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

interface CreateUserBody {
  clerkId: string;
  email: string;
  phoneNumber?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  status?: string;
  role?: string;
}

export default function ProfileEditScreen() {
  const { getToken, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponseDto | null>(null);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [city, setCity] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date(2000, 0, 1));
  const hasLoadedOnceRef = useRef(false);

  const dateOfBirthAsDate = (): Date => {
    if (dateOfBirth.trim()) {
      const d = new Date(dateOfBirth.trim());
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(2000, 0, 1);
  };

  const openDatePicker = () => {
    setPickerDate(dateOfBirthAsDate());
    setShowDatePicker(true);
  };

  const confirmDatePicker = () => {
    setDateOfBirth(pickerDate.toISOString().slice(0, 10));
    setShowDatePicker(false);
  };

  const onAndroidDateChange = (event: { type: string }, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDateOfBirth(selectedDate.toISOString().slice(0, 10));
    }
  };

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Chưa đăng nhập. Vui lòng đăng xuất và đăng nhập lại.');
        setLoading(false);
        return;
      }

      const res = await fetchWithAuth('/api/Users/me', getToken);
      const json = await parseJsonSafe<ApiResponse<UserResponseDto>>(res);

      if (!res.ok) {
        if (res.status === 401 && clerkUser) {
          const email =
            clerkUser.primaryEmailAddress?.emailAddress ||
            clerkUser.emailAddresses?.[0]?.emailAddress ||
            '';
          if (email) {
            const createBody: CreateUserBody = {
              clerkId: clerkUser.id,
              email,
              phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber ?? clerkUser.phoneNumbers?.[0]?.phoneNumber ?? null,
              fullName: clerkUser.fullName ?? null,
              avatarUrl: clerkUser.imageUrl ?? null,
              status: 'Active',
              role: 'Customer',
            };
            const createRes = await fetch(`${API_BASE_URL}/api/Users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(createBody),
            });
            if (createRes.ok) {
              const retryRes = await fetchWithAuth('/api/Users/me', getToken);
              const retryJson = await parseJsonSafe<ApiResponse<UserResponseDto>>(retryRes);
              if (retryRes.ok && retryJson?.success && retryJson.data) {
                const u = retryJson.data;
                setUser(u);
                setFullName(u.fullName ?? '');
                setPhoneNumber(u.phoneNumber ?? '');
                setDateOfBirth(formatDateForInput(u.dateOfBirth));
                setGender(u.gender ?? '');
                setDefaultAddress(u.defaultAddress ?? '');
                setCity(u.city ?? '');
                setLoading(false);
                return;
              }
            }
            const createJson = await parseJsonSafe<ApiResponse<unknown>>(createRes);
            const createMsg = createJson?.message?.toLowerCase() ?? '';
            if (createRes.status === 400 && (createMsg.includes('already exists') || createMsg.includes('đã tồn tại'))) {
              setError(
                'Tài khoản đã có trên máy chủ nhưng token không được chấp nhận. Trên Azure/backend hãy đặt Clerk:JwksUrl trùng Clerk instance của app (xem CLERK_SETUP.md).'
              );
              setLoading(false);
              return;
            }
          }
        }
        if (res.status === 401) {
          setError(
            'Phiên đăng nhập hết hạn hoặc tài khoản chưa được đồng bộ với máy chủ. Vui lòng đăng xuất và đăng nhập lại.'
          );
          return;
        }
        if (res.status === 403) {
          setError('Bạn không có quyền truy cập.');
          return;
        }
        if (res.status === 404) {
          setError('Không tìm thấy thông tin tài khoản. Tài khoản có thể chưa được đồng bộ.');
          return;
        }
        setError(json?.message || `Lỗi máy chủ (${res.status}). Thử lại sau.`);
        return;
      }

      if (!json || !json.success || !json.data) {
        setError(json?.message || 'Dữ liệu không hợp lệ.');
        return;
      }

      const u = json.data;
      setUser(u);
      setFullName(u.fullName ?? '');
      setPhoneNumber(u.phoneNumber ?? '');
      setDateOfBirth(formatDateForInput(u.dateOfBirth));
      setGender(u.gender ?? '');
      setDefaultAddress(u.defaultAddress ?? '');
      setCity(u.city ?? '');
    } catch (e) {
      const msg = e instanceof SyntaxError ? 'Phản hồi từ máy chủ không hợp lệ.' : 'Lỗi kết nối. Kiểm tra mạng và thử lại.';
      setError(msg);
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [getToken, clerkUser]);

  useEffect(() => {
    if (hasLoadedOnceRef.current) return;
    hasLoadedOnceRef.current = true;
    loadUser();
  }, [loadUser]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const body: UpdateUserBody = {
        fullName: fullName.trim() || null,
        phoneNumber: phoneNumber.trim() || null,
        dateOfBirth: dateOfBirth.trim() ? dateOfBirth.trim() : null,
        gender: gender || null,
        defaultAddress: defaultAddress.trim() || null,
        city: city.trim() || null,
      };

      const res = await fetchWithAuth(`/api/Users/${user.id}`, getToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await parseJsonSafe<ApiResponse<UserResponseDto>>(res);

      if (!res.ok) {
        if (res.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
          return;
        }
        if (res.status === 403) {
          setError('Bạn không có quyền cập nhật.');
          return;
        }
        if (res.status === 404) {
          setError('Không tìm thấy tài khoản.');
          return;
        }
        const errMsg = json?.message || `Cập nhật thất bại (${res.status}).`;
        const errDetails = json?.errors?.length ? `\n${json.errors.join('\n')}` : '';
        setError(errMsg + errDetails);
        return;
      }

      if (json?.success && json.data) setUser(json.data);
      Alert.alert('Thành công', 'Đã lưu thông tin cá nhân.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/profile') },
      ]);
    } catch (e) {
      const msg = e instanceof SyntaxError ? 'Phản hồi từ máy chủ không hợp lệ.' : 'Lỗi kết nối. Kiểm tra mạng và thử lại.';
      setError(msg);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={editStyles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={editStyles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const handleSignOutAndRelogin = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    }
  };

  if (error && !user) {
    return (
      <View style={editStyles.center}>
        <Text style={editStyles.errorText}>{error}</Text>
        <TouchableOpacity style={editStyles.retryButton} onPress={loadUser}>
          <Text style={editStyles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
        <TouchableOpacity style={editStyles.signOutButton} onPress={handleSignOutAndRelogin}>
          <Text style={editStyles.signOutButtonText}>Đăng xuất và đăng nhập lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={editStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={editStyles.scroll}
        contentContainerStyle={editStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={editStyles.errorBanner}>
            <Text style={editStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={editStyles.field}>
          <Text style={editStyles.label}>Họ và tên</Text>
          <TextInput
            style={editStyles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ và tên"
            placeholderTextColor={COLORS.grey}
            autoCapitalize="words"
          />
        </View>

        <View style={editStyles.field}>
          <Text style={editStyles.label}>Số điện thoại</Text>
          <TextInput
            style={editStyles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Nhập số điện thoại"
            placeholderTextColor={COLORS.grey}
            keyboardType="phone-pad"
          />
        </View>

        <View style={editStyles.field}>
          <Text style={editStyles.label}>Ngày sinh</Text>
          <TouchableOpacity
            style={editStyles.dateInputRow}
            onPress={openDatePicker}
            activeOpacity={0.7}
            accessibilityLabel="Chọn ngày sinh"
            accessibilityHint="Mở bảng chọn ngày sinh"
          >
            <Text style={dateOfBirth ? editStyles.inputText : editStyles.inputPlaceholder}>
              {formatDateDisplay(dateOfBirth) || 'Chọn ngày sinh'}
            </Text>
            <Ionicons name="calendar-outline" size={22} color={COLORS.grey} />
          </TouchableOpacity>
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={dateOfBirthAsDate()}
              mode="date"
              display="default"
              onChange={onAndroidDateChange}
              maximumDate={new Date()}
            />
          )}
          {Platform.OS === 'ios' && (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
              accessibilityLabel="Chọn ngày sinh"
            >
              <View style={editStyles.datePickerOverlay}>
                <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
                  <View style={editStyles.datePickerOverlayTouchable} />
                </TouchableWithoutFeedback>
                <View
                  style={[
                    editStyles.datePickerModalContent,
                    { paddingBottom: Math.max(insets.bottom, 20) + 12 },
                  ]}
                >
                  <View style={editStyles.datePickerHandle} />
                  <Text style={editStyles.datePickerTitle} accessibilityLabel="Chọn ngày sinh">
                    Chọn ngày sinh
                  </Text>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    onChange={(_, selectedDate) => {
                      if (selectedDate) setPickerDate(selectedDate);
                    }}
                    maximumDate={new Date()}
                  />
                  <View style={editStyles.datePickerActions}>
                    <TouchableOpacity
                      style={editStyles.datePickerCancelButton}
                      onPress={() => setShowDatePicker(false)}
                      accessibilityLabel="Hủy"
                    >
                      <Text style={editStyles.datePickerCancelText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={editStyles.datePickerConfirmButton}
                      onPress={confirmDatePicker}
                      accessibilityLabel="Xong"
                    >
                      <Text style={editStyles.datePickerDoneText}>Xong</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>

        <View style={editStyles.field}>
          <Text style={editStyles.label}>Giới tính</Text>
          <View style={editStyles.genderRow}>
            {GENDER_OPTIONS.filter((o) => o.value !== '').map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  editStyles.genderOption,
                  gender === opt.value && editStyles.genderOptionActive,
                ]}
                onPress={() => setGender(opt.value)}
              >
                <Text
                  style={[
                    editStyles.genderOptionText,
                    gender === opt.value && editStyles.genderOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={editStyles.field}>
          <Text style={editStyles.label}>Địa chỉ</Text>
          <TextInput
            style={[editStyles.input, editStyles.inputMultiline]}
            value={defaultAddress}
            onChangeText={setDefaultAddress}
            placeholder="Nhập địa chỉ"
            placeholderTextColor={COLORS.grey}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={editStyles.field}>
          <Text style={editStyles.label}>Thành phố</Text>
          <TextInput
            style={editStyles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Nhập thành phố"
            placeholderTextColor={COLORS.grey}
          />
        </View>

        <TouchableOpacity
          style={[editStyles.saveButton, saving && editStyles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={editStyles.saveButtonText}>Lưu thông tin</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const editStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.grey,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  signOutButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.background,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.background,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.background,
  },
  inputPlaceholder: {
    fontSize: 16,
    color: COLORS.grey,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
  datePickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.grey,
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}20`,
  },
  genderOptionText: {
    fontSize: 16,
    color: COLORS.background,
  },
  genderOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
