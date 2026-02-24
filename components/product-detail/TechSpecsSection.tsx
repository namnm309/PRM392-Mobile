import type { ProductSpec } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TechSpecsSectionProps = {
  specs: ProductSpec[];
};

export function TechSpecsSection({ specs }: TechSpecsSectionProps) {
  if (!specs.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Thông số kỹ thuật</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.table}>
        {specs.map((spec, index) => (
          <View
            key={index}
            style={[
              styles.row,
              index < specs.length - 1 && styles.rowBorder,
            ]}
          >
            <Text style={styles.label}>{spec.label}</Text>
            <Text style={styles.value}>{spec.value}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cartBorder,
  },
  label: {
    width: '35%',
    fontSize: 13,
    color: COLORS.cartTextSecondary,
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    lineHeight: 20,
  },
});
