import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { AdaptiveHeader } from '@/components/AdaptiveHeader';
import {
  createAddress,
  updateAddress,
  getAddressById,
  type CreateAddressRequest,
} from '@/lib/addressApi';
import {
  getProvinces,
  getDistricts,
  getWards,
  type GhnProvince,
  type GhnDistrict,
  type GhnWard,
} from '@/lib/shippingApi';

type PickerType = 'province' | 'district' | 'ward' | null;

export default function AddressFormScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(!!editId);
  const [submitting, setSubmitting] = useState(false);

  // GHN data
  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Selected GHN items
  const [selectedProvince, setSelectedProvince] = useState<GhnProvince | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<GhnDistrict | null>(null);
  const [selectedWard, setSelectedWard] = useState<GhnWard | null>(null);

  // Picker modal
  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    recipientName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    addressNote: '',
    isPrimary: false,
  });

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (editId) {
      loadExistingAddress();
    }
  }, [editId, provinces]);

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const data = await getProvinces();
      setProvinces(data);
    } catch (err) {
      console.error('Failed to load provinces:', err);
      Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadExistingAddress = async () => {
    if (provinces.length === 0) return;
    try {
      const address = await getAddressById(getToken, editId!);
      if (!address) return;

      setFormData({
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        addressNote: address.addressNote || '',
        isPrimary: address.isPrimary,
      });

      if (address.provinceId) {
        const prov = provinces.find(p => p.provinceId === address.provinceId);
        if (prov) {
          setSelectedProvince(prov);
          const districtList = await getDistricts(prov.provinceId);
          setDistricts(districtList);

          if (address.districtId) {
            const dist = districtList.find(d => d.districtId === address.districtId);
            if (dist) {
              setSelectedDistrict(dist);
              const wardList = await getWards(dist.districtId);
              setWards(wardList);

              if (address.wardCode) {
                const w = wardList.find(wd => wd.wardCode === address.wardCode);
                if (w) setSelectedWard(w);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load address:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvince = async (province: GhnProvince) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setActivePicker(null);
    setPickerSearch('');

    setLoadingDistricts(true);
    try {
      const data = await getDistricts(province.provinceId);
      setDistricts(data);
    } catch (err) {
      console.error('Failed to load districts:', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleSelectDistrict = async (district: GhnDistrict) => {
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);
    setActivePicker(null);
    setPickerSearch('');

    setLoadingWards(true);
    try {
      const data = await getWards(district.districtId);
      setWards(data);
    } catch (err) {
      console.error('Failed to load wards:', err);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleSelectWard = (ward: GhnWard) => {
    setSelectedWard(ward);
    setActivePicker(null);
    setPickerSearch('');
  };

  const handleSubmit = async () => {
    if (!formData.recipientName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người nhận');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!selectedProvince) {
      Alert.alert('Lỗi', 'Vui lòng chọn Tỉnh/Thành phố');
      return;
    }
    if (!selectedDistrict) {
      Alert.alert('Lỗi', 'Vui lòng chọn Quận/Huyện');
      return;
    }
    if (!selectedWard) {
      Alert.alert('Lỗi', 'Vui lòng chọn Phường/Xã');
      return;
    }
    if (!formData.addressLine1.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ chi tiết');
      return;
    }

    setSubmitting(true);
    try {
      const request: CreateAddressRequest = {
        recipientName: formData.recipientName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: selectedProvince.provinceName,
        district: selectedDistrict.districtName,
        ward: selectedWard.wardName,
        isPrimary: formData.isPrimary,
        provinceId: selectedProvince.provinceId,
        districtId: selectedDistrict.districtId,
        wardCode: selectedWard.wardCode,
        addressNote: formData.addressNote.trim() || undefined,
      };

      if (editId) {
        await updateAddress(getToken, editId, request);
      } else {
        await createAddress(getToken, request);
      }

      Alert.alert('Thành công', editId ? 'Đã cập nhật địa chỉ' : 'Đã thêm địa chỉ mới', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu địa chỉ');
    } finally {
      setSubmitting(false);
    }
  };

  const normalize = (value?: string) => (value || '').toLowerCase();

  const getPickerData = () => {
    const search = normalize(pickerSearch);
    if (activePicker === 'province') {
      return provinces.filter(p => normalize(p.provinceName).includes(search));
    }
    if (activePicker === 'district') {
      return districts.filter(d => normalize(d.districtName).includes(search));
    }
    if (activePicker === 'ward') {
      return wards.filter(w => normalize(w.wardName).includes(search));
    }
    return [];
  };

  const getPickerTitle = () => {
    if (activePicker === 'province') return 'Chọn Tỉnh/Thành phố';
    if (activePicker === 'district') return 'Chọn Quận/Huyện';
    if (activePicker === 'ward') return 'Chọn Phường/Xã';
    return '';
  };

  const handlePickerSelect = (item: any) => {
    if (activePicker === 'province') handleSelectProvince(item);
    else if (activePicker === 'district') handleSelectDistrict(item);
    else if (activePicker === 'ward') handleSelectWard(item);
  };

  const getItemLabel = (item: any) => {
    if (activePicker === 'province') return item.provinceName ?? '';
    if (activePicker === 'district') return item.districtName ?? '';
    if (activePicker === 'ward') return item.wardName ?? '';
    return '';
  };

  const isItemSelected = (item: any) => {
    if (activePicker === 'province') return selectedProvince?.provinceId === item.provinceId;
    if (activePicker === 'district') return selectedDistrict?.districtId === item.districtId;
    if (activePicker === 'ward') return selectedWard?.wardCode === item.wardCode;
    return false;
  };

  if (loading) {
    return (
      <View style={s.screen}>
        <AdaptiveHeader variant="light" title="Địa chỉ" left={<TouchableOpacity style={s.headerBack} onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={COLORS.cartTextPrimary} /></TouchableOpacity>} />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentRed} />
          <Text style={s.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <AdaptiveHeader
        variant="light"
        title={editId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
        left={
          <TouchableOpacity style={s.headerBack} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Address Selection - GHN Dropdowns */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Khu vực giao hàng</Text>

            {/* Province */}
            <Text style={s.inputLabel}>Tỉnh/Thành phố *</Text>
            <TouchableOpacity
              style={s.dropdownButton}
              onPress={() => !loadingProvinces && setActivePicker('province')}
              activeOpacity={0.7}
            >
              {loadingProvinces ? (
                <ActivityIndicator size="small" color={COLORS.grey} />
              ) : (
                <>
                  <Text style={[s.dropdownText, !selectedProvince && s.dropdownPlaceholder]}>
                    {selectedProvince?.provinceName || 'Chọn Tỉnh/Thành phố'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={COLORS.grey} />
                </>
              )}
            </TouchableOpacity>

            {/* District */}
            <Text style={s.inputLabel}>Quận/Huyện *</Text>
            <TouchableOpacity
              style={[s.dropdownButton, !selectedProvince && s.dropdownDisabled]}
              onPress={() => selectedProvince && !loadingDistricts && setActivePicker('district')}
              activeOpacity={0.7}
              disabled={!selectedProvince}
            >
              {loadingDistricts ? (
                <ActivityIndicator size="small" color={COLORS.grey} />
              ) : (
                <>
                  <Text style={[s.dropdownText, !selectedDistrict && s.dropdownPlaceholder]}>
                    {selectedDistrict?.districtName || 'Chọn Quận/Huyện'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={COLORS.grey} />
                </>
              )}
            </TouchableOpacity>

            {/* Ward */}
            <Text style={s.inputLabel}>Phường/Xã *</Text>
            <TouchableOpacity
              style={[s.dropdownButton, !selectedDistrict && s.dropdownDisabled]}
              onPress={() => selectedDistrict && !loadingWards && setActivePicker('ward')}
              activeOpacity={0.7}
              disabled={!selectedDistrict}
            >
              {loadingWards ? (
                <ActivityIndicator size="small" color={COLORS.grey} />
              ) : (
                <>
                  <Text style={[s.dropdownText, !selectedWard && s.dropdownPlaceholder]}>
                    {selectedWard?.wardName || 'Chọn Phường/Xã'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={COLORS.grey} />
                </>
              )}
            </TouchableOpacity>

            {/* Detailed Address */}
            <Text style={s.inputLabel}>Địa chỉ chi tiết (số nhà, tên đường) *</Text>
            <TextInput
              style={s.input}
              placeholder="Ví dụ: 123 Nguyễn Văn A"
              placeholderTextColor={COLORS.grey}
              value={formData.addressLine1}
              onChangeText={(text) => setFormData(prev => ({ ...prev, addressLine1: text }))}
            />

            <Text style={s.inputLabel}>Tòa nhà, tầng, số phòng (tùy chọn)</Text>
            <TextInput
              style={s.input}
              placeholder="Ví dụ: Tầng 3, phòng 301"
              placeholderTextColor={COLORS.grey}
              value={formData.addressLine2}
              onChangeText={(text) => setFormData(prev => ({ ...prev, addressLine2: text }))}
            />
          </View>

          {/* Recipient Info */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Người nhận hàng</Text>

            <Text style={s.inputLabel}>Họ và tên *</Text>
            <TextInput
              style={s.input}
              placeholder="Nhập họ và tên người nhận"
              placeholderTextColor={COLORS.grey}
              value={formData.recipientName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, recipientName: text }))}
            />

            <Text style={s.inputLabel}>Số điện thoại *</Text>
            <TextInput
              style={s.input}
              placeholder="Nhập số điện thoại"
              placeholderTextColor={COLORS.grey}
              keyboardType="phone-pad"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
            />

            <Text style={s.inputLabel}>Ghi chú cho shipper</Text>
            <TextInput
              style={[s.input, { minHeight: 60 }]}
              placeholder="Ví dụ: Gần công viên, cổng sau..."
              placeholderTextColor={COLORS.grey}
              multiline
              value={formData.addressNote}
              onChangeText={(text) => setFormData(prev => ({ ...prev, addressNote: text }))}
            />

            <TouchableOpacity
              style={s.primaryToggle}
              onPress={() => setFormData(prev => ({ ...prev, isPrimary: !prev.isPrimary }))}
              activeOpacity={0.7}
            >
              <View style={[s.checkbox, formData.isPrimary && s.checkboxChecked]}>
                {formData.isPrimary && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
              </View>
              <Text style={s.primaryToggleText}>Đặt làm địa chỉ mặc định</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 14) + 14 }]}>
        <TouchableOpacity
          style={[s.saveButton, submitting && s.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={s.saveButtonText}>{editId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Picker Modal */}
      <Modal visible={activePicker !== null} transparent animationType="slide" onRequestClose={() => { setActivePicker(null); setPickerSearch(''); }}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{getPickerTitle()}</Text>
              <TouchableOpacity onPress={() => { setActivePicker(null); setPickerSearch(''); }} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={COLORS.cartTextPrimary} />
              </TouchableOpacity>
            </View>

            <View style={s.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.grey} />
              <TextInput
                style={s.searchInput}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Tìm kiếm..."
                placeholderTextColor={COLORS.grey}
                autoFocus
              />
              {pickerSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPickerSearch('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.grey} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={getPickerData()}
              keyExtractor={(item, index) => `${activePicker}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.pickerItem, isItemSelected(item) && s.pickerItemSelected]}
                  onPress={() => handlePickerSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.pickerItemText, isItemSelected(item) && s.pickerItemTextSelected]}>
                    {getItemLabel(item)}
                  </Text>
                  {isItemSelected(item) && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.accentRed} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={s.emptyPicker}>
                  <Text style={s.emptyPickerText}>Không tìm thấy kết quả</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  headerBack: { padding: 8 },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.grey },

  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.white, borderRadius: 12, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.cartTextPrimary, marginBottom: 8 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.cartTextPrimary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
    backgroundColor: COLORS.white,
  },

  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
  },
  dropdownDisabled: { backgroundColor: '#F9FAFB', opacity: 0.6 },
  dropdownText: { flex: 1, fontSize: 14, color: COLORS.cartTextPrimary },
  dropdownPlaceholder: { color: COLORS.grey },

  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.accentRed, borderColor: COLORS.accentRed },
  primaryToggleText: { fontSize: 14, color: COLORS.cartTextPrimary },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveButton: { backgroundColor: COLORS.accentRed, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.cartTextPrimary },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.cartTextPrimary },

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemSelected: { backgroundColor: '#FEF2F2' },
  pickerItemText: { fontSize: 14, color: COLORS.cartTextPrimary },
  pickerItemTextSelected: { color: COLORS.accentRed, fontWeight: '600' },

  emptyPicker: { padding: 32, alignItems: 'center' },
  emptyPickerText: { fontSize: 14, color: COLORS.grey },
});
