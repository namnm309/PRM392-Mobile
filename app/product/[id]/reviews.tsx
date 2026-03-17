import { COLORS } from '@/constants/theme';
import {
  ApiError,
  createReview,
  fetchReviews,
  type ReviewResponseDto,
} from '@/lib/reviewsApi';
import { formatRelativeTime } from '@/lib/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FilterOption = 'all' | 5 | 4 | 3 | 2 | 1;

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

export default function ProductReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [filterStar, setFilterStar] = useState<FilterOption>('all');

  const productId = id ?? '';

  const loadReviews = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchReviews(productId);
      setReviews(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải đánh giá');
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    loadReviews().finally(() => setLoading(false));
  }, [productId, loadReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  }, [loadReviews]);

  const summary = useMemo(() => computeSummary(reviews), [reviews]);

  const userAlreadyReviewed = useMemo(
    () => user ? reviews.some((r) => r.userId === user.id) : false,
    [reviews, user],
  );

  const displayed = useMemo(
    () => reviews.filter((r) => (filterStar === 'all' ? true : r.rating === filterStar)),
    [reviews, filterStar],
  );

  const handleSubmit = async () => {
    const text = content.trim();
    if (!rating || !text || submitting) return;

    if (!isSignedIn) {
      router.push({ pathname: '/(auth)/login', params: { redirect: `/product/${productId}/reviews` } });
      return;
    }

    const optimisticReview: ReviewResponseDto = {
      id: `optimistic-${Date.now()}`,
      userId: user?.id ?? '',
      userName: user?.fullName ?? user?.firstName ?? 'Bạn',
      userAvatarUrl: user?.imageUrl ?? null,
      productId,
      rating,
      content: text,
      reply: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReviews((prev) => [optimisticReview, ...prev]);
    setRating(0);
    setContent('');
    setFormMessage(null);
    setSubmitting(true);

    try {
      const created = await createReview({ productId, rating, content: text }, getToken);
      setReviews((prev) =>
        prev.map((r) => (r.id === optimisticReview.id ? created : r)),
      );
    } catch (e) {
      setReviews((prev) => prev.filter((r) => r.id !== optimisticReview.id));
      if (e instanceof ApiError) {
        if (e.status === 400) {
          setFormMessage(e.message);
        } else if (e.status === 401) {
          router.push({ pathname: '/(auth)/login', params: { redirect: `/product/${productId}/reviews` } });
        } else {
          Alert.alert('Lỗi', e.message);
        }
      } else {
        Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
      setRating(rating);
      setContent(text);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarDistribution = () => {
    const stars = [5, 4, 3, 2, 1];
    const maxCount = Math.max(...Object.values(summary.distribution), 1);
    return stars.map((star) => {
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
    });
  };

  const renderReviewForm = () => {
    if (!isSignedIn) {
      return (
        <View style={styles.writeBox}>
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(auth)/login', params: { redirect: `/product/${productId}/reviews` } })}
          >
            <Text style={styles.submitText}>Đăng nhập để đánh giá</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (userAlreadyReviewed) {
      return (
        <View style={styles.writeBox}>
          <View style={styles.infoBox}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.headerBlue} />
            <Text style={styles.infoText}>Bạn đã đánh giá sản phẩm này</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.writeBox}>
        <Text style={styles.writeTitle}>Viết đánh giá sản phẩm</Text>
        <View style={styles.writeStarsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7}>
              <Ionicons
                name="star"
                size={32}
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
            maxLength={1000}
            value={content}
            onChangeText={setContent}
          />
          <Text style={styles.inputCounter}>{content.length}/1000</Text>
        </View>
        {formMessage && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.accentRed} />
            <Text style={[styles.infoText, { color: COLORS.accentRed }]}>{formMessage}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.submitBtn, (!rating || !content.trim() || submitting) && styles.submitBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={!rating || !content.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.submitText}>Đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderAvatar = (name: string, avatarUrl: string | null) => {
    if (avatarUrl) {
      return <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />;
    }
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: ReviewResponseDto }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        {renderAvatar(item.userName, item.userAvatarUrl)}
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
      <Text style={styles.reviewContent}>{item.content}</Text>
      <Text style={styles.reviewTime}>
        {item.createdAt ? formatRelativeTime(item.createdAt) : ''}
      </Text>
      {item.reply && (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <View style={styles.staffBadge}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.white} />
            </View>
            <Text style={styles.replyStaffName}>Quản trị viên</Text>
            <Text style={styles.replyTime}>
              {item.reply.createdAt ? formatRelativeTime(item.reply.createdAt) : ''}
            </Text>
          </View>
          <Text style={styles.replyContent}>{item.reply.replyContent}</Text>
        </View>
      )}
    </View>
  );

  const listHeader = (
    <>
      <View style={styles.card}>
        <Text style={styles.mainRating}>
          {summary.totalReviews > 0 ? summary.rating.toFixed(1) : '0'}/5
        </Text>
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
        <Text style={styles.mainTotal}>{summary.totalReviews} lượt đánh giá</Text>
        <View style={styles.distSection}>{renderStarDistribution()}</View>
        {renderReviewForm()}
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Lọc đánh giá theo</Text>
        <View style={styles.filterRow}>
          {(['all', 5, 4, 3, 2, 1] as FilterOption[]).map((opt) => (
            <TouchableOpacity
              key={String(opt)}
              style={[styles.filterChip, filterStar === opt && styles.filterChipActive]}
              onPress={() => setFilterStar(opt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterStar === opt && styles.filterChipTextActive]}>
                {opt === 'all' ? 'Tất cả' : `${opt} sao`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.headerBlue} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={COLORS.cartTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={renderReviewItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error ? error : 'Chưa có đánh giá nào.'}
          </Text>
        }
        ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.headerBlue]} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: COLORS.cartTextPrimary },
  scrollContent: { padding: 16, paddingBottom: 32 },
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
  distSection: { marginBottom: 16, gap: 8 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distNum: { width: 16, fontSize: 13, color: COLORS.cartTextPrimary },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: COLORS.accentRed },
  distCount: { width: 80, fontSize: 12, color: COLORS.cartTextSecondary },
  writeBox: { marginTop: 16 },
  writeTitle: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary, marginBottom: 8 },
  writeStarsRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  inputWrapper: {
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  input: { minHeight: 60, fontSize: 14, color: COLORS.cartTextPrimary, textAlignVertical: 'top' },
  inputCounter: { fontSize: 12, color: COLORS.cartTextSecondary, textAlign: 'right', marginTop: 4 },
  submitBtn: {
    marginTop: 4,
    backgroundColor: COLORS.accentRed,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: { fontSize: 13, color: COLORS.headerBlue, flex: 1 },
  filterSection: { marginBottom: 12 },
  filterTitle: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary, marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    backgroundColor: COLORS.white,
  },
  filterChipActive: { borderColor: COLORS.accentRed, backgroundColor: '#ffecec' },
  filterChipText: { fontSize: 12, color: COLORS.cartTextPrimary },
  filterChipTextActive: { color: COLORS.accentRed, fontWeight: '600' },
  reviewItem: { paddingVertical: 12 },
  reviewSeparator: { height: 1, backgroundColor: COLORS.cartBorder },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.cartTextPrimary },
  reviewHeaderText: { flex: 1 },
  reviewUser: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary },
  reviewStarsRow: { flexDirection: 'row', marginTop: 2 },
  reviewContent: { fontSize: 13, color: COLORS.cartTextPrimary, marginBottom: 4, lineHeight: 20 },
  reviewTime: { fontSize: 12, color: COLORS.cartTextSecondary },
  replyBox: {
    marginTop: 10,
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.headerBlue,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingRight: 12,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  staffBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.headerBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyStaffName: { fontSize: 13, fontWeight: '700', color: COLORS.headerBlue, flex: 1 },
  replyTime: { fontSize: 11, color: COLORS.cartTextSecondary },
  replyContent: { fontSize: 13, color: COLORS.cartTextPrimary, lineHeight: 20 },
  emptyText: { fontSize: 13, color: COLORS.cartTextSecondary, marginTop: 8, textAlign: 'center' },
});
