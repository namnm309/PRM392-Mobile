import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PromotionsSection() {
  return (
    <View style={styles.container}>
      <View style={styles.buyMore}>
        <Text style={styles.buyMoreTitle}>Mua nhiều giảm nhiều</Text>
        <Text style={styles.buyMoreText}>
          Giảm 10% tối đa 100K khi mua SP thứ 2.
        </Text>
        <Text style={styles.buyMoreText}>
          Giảm 20% tối đa 200K khi mua SP thứ 3
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.buyMoreLink}>mua thêm &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.snewGift}>
        <Ionicons name="diamond" size={18} color={COLORS.accentRed} />
        <Text style={styles.snewTitle}>Quà tặng đặc quyền SNew</Text>
        <View style={styles.giftRow}>
          <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
          <Text style={styles.giftText}>
            Giảm thêm 5% (tối đa 200.000₫) khi thu cũ lên đời (áp dụng tùy sản phẩm)
          </Text>
        </View>
      </View>

      <View style={styles.attractivePromo}>
        <Ionicons name="gift" size={18} color={COLORS.categoryLinkBlue} />
        <Text style={styles.attractiveTitle}>Khuyến mãi hấp dẫn</Text>
        <View style={styles.promoList}>
          <View style={styles.promoItem}>
            <View style={styles.promoNum}>
              <Text style={styles.promoNumText}>1</Text>
            </View>
            <View style={styles.promoContent}>
              <Text style={styles.promoText}>
                trả góp 0% lãi suất, tối đa 12 tháng, trả trước từ 10% qua CTTC hoặc 0đ qua thẻ tín dụng
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.detailLink}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.promoItem}>
            <View style={styles.promoNum}>
              <Text style={styles.promoNumText}>2</Text>
            </View>
            <View style={styles.promoContent}>
              <Text style={styles.promoText}>
                Giảm thêm 10% cho Loa, Tai nghe, Máy tính bàn, TV (từ 10 triệu) khi mua Điện thoại/Laptop
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.detailLink}>Xem chi tiết</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.saleBanner}>
          <Text style={styles.saleBannerText}>
            Sale TẾT &quot;ANt&quot; từ ngày 04.02 - 25.02
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  buyMore: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  buyMoreTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 6,
  },
  buyMoreText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 2,
  },
  buyMoreLink: {
    fontSize: 13,
    color: COLORS.accentRed,
    fontWeight: '600',
    marginTop: 6,
  },
  snewGift: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
  },
  snewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginTop: 4,
    marginBottom: 8,
  },
  giftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  giftText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  attractivePromo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  attractiveTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginTop: 4,
    marginBottom: 10,
  },
  promoList: {
    gap: 12,
  },
  promoItem: {
    flexDirection: 'row',
    gap: 10,
  },
  promoNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.categoryLinkBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  promoContent: {
    flex: 1,
  },
  promoText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  detailLink: {
    fontSize: 13,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
  saleBanner: {
    marginTop: 12,
    backgroundColor: COLORS.accentRed,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saleBannerText: {
    fontSize: 12,
    color: COLORS.white,
    textAlign: 'center',
  },
});
