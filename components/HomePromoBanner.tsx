import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';

export function HomePromoBanner() {
  return (
    <LinearGradient
      colors={[COLORS.gradientPurple, COLORS.gradientRed]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Text style={styles.title}>Năm Mới Máy Mới</Text>
      <Text style={styles.subtitle}>
        Giảm thêm <Text style={styles.highlight}>5%</Text> Tới{' '}
        <Text style={styles.highlight}>1 triệu</Text>
      </Text>
      <TouchableOpacity style={styles.cta} activeOpacity={0.8}>
        <Text style={styles.ctaText}>NHẬN NGAY</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 16,
  },
  highlight: {
    fontWeight: '700',
    color: COLORS.accentRed,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.promoRed,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
