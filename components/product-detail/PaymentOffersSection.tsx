import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const OFFERS = [
  {
    text: 'Xem chính sách ưu đãi dành cho thành viên Smember',
  },
  {
    label: 'Kredivo',
    text: 'Giảm đến 5.000.000đ khi thanh toán qua Kredivo',
  },
  {
    label: 'HSBC',
    text: 'Hoàn tiền đến 2 triệu khi mở thẻ tín dụng HSBC',
  },
  {
    label: 'ACB',
    text: 'Giảm đến 1 triệu khi thanh toán qua thẻ tín dụng ACB',
  },
  {
    label: 'TECHCOMBANK',
    text: 'Giảm ngay 700K khi trả góp qua thẻ tín dụng TECHCOMBANK',
  },
  {
    label: 'OCB',
    text: 'Giảm 500K khi thanh toán qua thẻ tín dụng OCB',
  },
  {
    label: 'VIB',
    text: 'Mở thẻ VIB nhận E-Voucher đến 600K',
  },
];

export function PaymentOffersSection() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="gift" size={20} color={COLORS.accentRed} />
        <Text style={styles.title}>Ưu đãi thanh toán</Text>
      </View>
      <View style={styles.list}>
        {OFFERS.map((offer, index) => (
          <View key={index} style={styles.item}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <View style={styles.itemContent}>
              {offer.label && (
                <Text style={styles.itemLabel}>{offer.label}</Text>
              )}
              <Text style={styles.itemText}>{offer.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  list: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 2,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
});
