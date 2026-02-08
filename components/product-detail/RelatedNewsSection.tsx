import type { RelatedNewsItem } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RelatedNewsSectionProps = {
  news: RelatedNewsItem[];
};

export function RelatedNewsSection({ news }: RelatedNewsSectionProps) {
  if (!news.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tin tức liên quan</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {news.slice(0, 4).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.7}
          >
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>📰</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
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
    marginTop: 8,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minWidth: '47%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: COLORS.categoryContentBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    padding: 10,
  },
});
