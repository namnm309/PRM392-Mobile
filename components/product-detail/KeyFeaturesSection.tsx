import { COLORS } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type KeyFeaturesSectionProps = {
  productName: string;
  features: string[];
};

export function KeyFeaturesSection({ productName, features }: KeyFeaturesSectionProps) {
  if (!features.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Đặc điểm nổi bật của {productName}
      </Text>
      <View style={styles.list}>
        {features.map((feature, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.seeAllWrap} activeOpacity={0.7}>
        <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: COLORS.accentRed,
    fontWeight: '700',
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    lineHeight: 20,
  },
  seeAllWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.categoryLinkBlue,
    fontWeight: '500',
  },
});
