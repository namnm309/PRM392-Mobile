import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ReviewsData = {
  rating: number;
  totalReviews: number;
  distribution: Record<number, number>;
  experienceRatings?: { label: string; rating: number; count: number }[];
};

type ProductReviewsSectionProps = {
  reviews: ReviewsData;
};

export function ProductReviewsSection({ reviews }: ProductReviewsSectionProps) {
  const stars = [5, 4, 3, 2, 1];
  const maxCount = Math.max(...Object.values(reviews.distribution), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đánh giá sản phẩm</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.overall}>
        <Text style={styles.ratingNum}>{reviews.rating}/5</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons
              key={i}
              name="star"
              size={24}
              color={i <= Math.round(reviews.rating) ? '#FFC107' : COLORS.categoryChipBorder}
            />
          ))}
        </View>
        <Text style={styles.totalReviews}>
          {reviews.totalReviews} lượt đánh giá
        </Text>
      </View>
      <View style={styles.distribution}>
        {stars.map((star) => {
          const count = reviews.distribution[star] ?? 0;
          const width = (count / maxCount) * 100;
          return (
            <View key={star} style={styles.distRow}>
              <Ionicons name="star" size={14} color="#FFC107" />
              <Text style={styles.distNum}>{star}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${width}%` }]} />
              </View>
              <Text style={styles.distCount}>
                {count} đánh giá
              </Text>
            </View>
          );
        })}
      </View>
      {reviews.experienceRatings && reviews.experienceRatings.length > 0 && (
        <View style={styles.experience}>
          <Text style={styles.experienceTitle}>Đánh giá theo trải nghiệm</Text>
          {reviews.experienceRatings.map((exp, index) => (
            <View
              key={index}
              style={[
                styles.experienceItem,
                index > 0 && styles.experienceItemBorder,
              ]}
            >
              <Text style={styles.experienceLabel}>{exp.label}</Text>
              <View style={styles.experienceRight}>
                <View style={styles.experienceStars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={14}
                      color={i <= exp.rating ? '#FFC107' : COLORS.categoryChipBorder}
                    />
                  ))}
                </View>
                <Text style={styles.experienceCount}>
                  {exp.rating}/5 ({exp.count} đánh giá)
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 16,
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
  overall: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingNum: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  totalReviews: {
    fontSize: 13,
    color: COLORS.cartTextSecondary,
  },
  distribution: {
    gap: 8,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distNum: {
    width: 16,
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.white,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.accentRed,
  },
  distCount: {
    width: 70,
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
  experience: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
  },
  experienceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 12,
  },
  experienceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  experienceItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.cartBorder,
  },
  experienceLabel: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
  },
  experienceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  experienceStars: {
    flexDirection: 'row',
    gap: 2,
  },
  experienceCount: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
});
