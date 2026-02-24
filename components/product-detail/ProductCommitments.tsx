import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COMMITMENTS = [
  {
    icon: 'cube-outline' as const,
    title: 'Mới, đầy đủ phụ kiện từ nhà sản xuất',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Máy, Sách hướng dẫn, Cây lấy sim, Cáp Type C',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: '1 ĐỔI 1 trong 12 tháng tại bảo hành chính hãng Apple',
  },
];

export function ProductCommitments() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cam kết sản phẩm</Text>
      <View style={styles.cards}>
        {COMMITMENTS.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons
                name={item.icon}
                size={28}
                color={COLORS.white}
              />
            </View>
            <Text style={styles.cardTitle} numberOfLines={3}>
              {item.title}
            </Text>
            {index === 2 && (
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.link}>Xem thông tin bảo hành (Tại đây)</Text>
              </TouchableOpacity>
            )}
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
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 12,
  },
  cards: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    backgroundColor: COLORS.white,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.accentRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: COLORS.cartTextPrimary,
    lineHeight: 18,
  },
  link: {
    fontSize: 12,
    color: COLORS.categoryLinkBlue,
    marginTop: 6,
  },
});
