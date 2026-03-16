import { COLORS } from '@/constants/theme';
import { getProductDetail } from '@/constants/productDetailData';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProductReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const baseProduct = useMemo(
    () => getProductDetail(id ?? ''),
    [id],
  );

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [reviews, setReviews] = useState(baseProduct.reviewItems);
  const [summary, setSummary] = useState(baseProduct.reviews);
  const [filterStar, setFilterStar] = useState<number | 'all'>('all');

  const handleSubmit = () => {
    const text = content.trim();
    if (!rating || !text) return;

    const newReview = {
      id: `local-${Date.now()}`,
      userName: 'Bạn',
      rating,
      content: text,
      tags: [],
      createdAt: 'Vừa xong',
    };

    const newReviews = [newReview, ...reviews];
    const newDistribution = { ...summary.distribution };
    newDistribution[rating] = (newDistribution[rating] ?? 0) + 1;
    const newTotal = summary.totalReviews + 1;
    const newAvg =
      (summary.rating * summary.totalReviews + rating) / newTotal;

    setReviews(newReviews);
    setSummary({
      ...summary,
      totalReviews: newTotal,
      rating: Number(newAvg.toFixed(1)),
      distribution: newDistribution,
    });
    setRating(0);
    setContent('');
  };

  const displayed = useMemo(
    () =>
      reviews.filter((r) =>
        filterStar === 'all' ? true : r.rating === filterStar,
      ),
    [reviews, filterStar],
  );

  const renderStarRow = () => {
    const stars = [5, 4, 3, 2, 1];
    const maxCount = Math.max(...Object.values(summary.distribution), 1);
    return stars.map((star) => {
      const count = summary.distribution[star] ?? 0;
      const width = (count / maxCount) * 100;
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
    });
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.cartTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.mainRating}>{summary.rating.toFixed(1)}/5</Text>
          <View style={styles.mainStars}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name="star"
                size={24}
                color={i <= Math.round(summary.rating) ? '#FFC107' : COLORS.categoryChipBorder}
              />
            ))}
          </View>
          <Text style={styles.mainTotal}>
            {summary.totalReviews} lượt đánh giá
          </Text>

          <View style={styles.distSection}>{renderStarRow()}</View>

          {summary.experienceRatings && summary.experienceRatings.length > 0 && (
            <View style={styles.experienceSection}>
              <Text style={styles.experienceTitle}>Đánh giá theo trải nghiệm</Text>
              {summary.experienceRatings.map((exp, idx) => (
                <View
                  key={exp.label}
                  style={[
                    styles.experienceItem,
                    idx > 0 && styles.experienceItemBorder,
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

          <View style={styles.writeBox}>
            <Text style={styles.writeTitle}>Viết đánh giá sản phẩm</Text>
            <View style={styles.writeStarsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setRating(i)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="star"
                    size={28}
                    color={i <= rating ? '#FFC107' : COLORS.categoryChipBorder}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Viết đánh giá của bạn tại đây"
                placeholderTextColor={COLORS.cartTextSecondary}
                multiline
                maxLength={100}
                value={content}
                onChangeText={setContent}
              />
              <Text style={styles.inputCounter}>{content.length}/100</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!rating || !content.trim()) && styles.submitBtnDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={!rating || !content.trim()}
            >
              <Text style={styles.submitText}>Đánh giá</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Lọc đánh giá theo</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterStar === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setFilterStar('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStar === 'all' && styles.filterChipTextActive,
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>
            {[5, 4, 3, 2, 1].map((star) => (
              <TouchableOpacity
                key={star}
                style={[
                  styles.filterChip,
                  filterStar === star && styles.filterChipActive,
                ]}
                onPress={() => setFilterStar(star)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterStar === star && styles.filterChipTextActive,
                  ]}
                >
                  {star} sao
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
          renderItem={({ item }) => (
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewHeaderText}>
                  <Text style={styles.reviewUser}>{item.userName}</Text>
                  <View style={styles.reviewStarsRow}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons
                        key={i}
                        name="star"
                        size={14}
                        color={i <= item.rating ? '#FFC107' : COLORS.categoryChipBorder}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.tagRow}>
                {item.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.reviewContent}>{item.content}</Text>
              <Text style={styles.reviewTime}>{item.createdAt}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Chưa có đánh giá nào.</Text>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    padding: 16,
    marginBottom: 16,
  },
  mainRating: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    textAlign: 'center',
  },
  mainStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  mainTotal: {
    fontSize: 13,
    color: COLORS.cartTextSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  distSection: {
    marginBottom: 16,
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
    width: 80,
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
  experienceSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
    paddingTop: 12,
  },
  experienceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
  experienceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  writeBox: {
    marginTop: 16,
  },
  writeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
  writeStarsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  input: {
    minHeight: 60,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  inputCounter: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  submitBtn: {
    marginTop: 4,
    backgroundColor: COLORS.accentRed,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    backgroundColor: COLORS.white,
  },
  filterChipActive: {
    borderColor: COLORS.accentRed,
    backgroundColor: '#ffecec',
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.cartTextPrimary,
  },
  filterChipTextActive: {
    color: COLORS.accentRed,
    fontWeight: '600',
  },
  reviewItem: {
    paddingVertical: 12,
  },
  reviewSeparator: {
    height: 1,
    backgroundColor: COLORS.cartBorder,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.categoryContentBg,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.cartTextPrimary,
  },
  reviewContent: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginBottom: 4,
  },
  reviewTime: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.cartTextSecondary,
    marginTop: 8,
  },
});

