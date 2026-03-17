import { COLORS } from '@/constants/theme';
import type { ReviewResponseDto } from '@/lib/reviewsApi';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ProductReviewsSectionProps = {
  reviews: ReviewResponseDto[];
  onSeeAll?: () => void;
  onWriteReview?: () => void;
};

function computeSummary(reviews: ReviewResponseDto[]) {
  const total = reviews.length;
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  for (const r of reviews) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    sum += r.rating;
  }
  const avg = total > 0 ? sum / total : 0;
  return { rating: Number(avg.toFixed(1)), totalReviews: total, distribution };
}

export function ProductReviewsSection({
  reviews,
  onSeeAll,
  onWriteReview,
}: ProductReviewsSectionProps) {
  const summary = useMemo(() => computeSummary(reviews), [reviews]);
  const stars = [5, 4, 3, 2, 1];
  const maxCount = Math.max(...Object.values(summary.distribution), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đánh giá sản phẩm</Text>
        <TouchableOpacity activeOpacity={0.7} disabled={!onSeeAll} onPress={onSeeAll}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.overall}>
        <Text style={styles.ratingNum}>{summary.rating}/5</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons
              key={i}
              name="star"
              size={24}
              color={i <= Math.round(summary.rating) ? '#FFC107' : COLORS.categoryChipBorder}
            />
          ))}
        </View>
        <Text style={styles.totalReviews}>{summary.totalReviews} lượt đánh giá</Text>
      </View>

      <View style={styles.distribution}>
        {stars.map((star) => {
          const count = summary.distribution[star] ?? 0;
          const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <View key={star} style={styles.distRow}>
              <Ionicons name="star" size={14} color="#FFC107" />
              <Text style={styles.distNum}>{star}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${width}%` }]} />
              </View>
              <Text style={styles.distCount}>{count} đánh giá</Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.writeButton}
        activeOpacity={0.8}
        onPress={onWriteReview ?? onSeeAll}
        disabled={!onWriteReview && !onSeeAll}
      >
        <Text style={styles.writeButtonText}>Viết đánh giá</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.white, marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.cartTextPrimary },
  seeAll: { fontSize: 14, color: COLORS.categoryLinkBlue, fontWeight: '500' },
  overall: { alignItems: 'center', marginBottom: 16 },
  ratingNum: { fontSize: 32, fontWeight: '700', color: COLORS.cartTextPrimary, marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2, marginBottom: 4 },
  totalReviews: { fontSize: 13, color: COLORS.cartTextSecondary },
  distribution: { gap: 8 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distNum: { width: 16, fontSize: 13, color: COLORS.cartTextPrimary },
  barBg: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.accentRed },
  distCount: { width: 70, fontSize: 12, color: COLORS.cartTextSecondary },
  writeButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: COLORS.accentRed,
  },
  writeButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
});
