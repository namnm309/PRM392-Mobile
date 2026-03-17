import { COLORS } from '@/constants/theme';
import {
  createComment,
  fetchComments,
  countAllReplies,
  type ProductCommentResponseDto,
} from '@/lib/commentsApi';
import { ApiError } from '@/lib/reviewsApi';
import { formatRelativeTime } from '@/lib/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_VISIBLE_DEPTH = 3;
const INDENT_PX = 24;

type ReplyTarget = { parentId: string; userName: string } | null;

function isStaffReply(comment: ProductCommentResponseDto): boolean {
  return comment.parentId !== null && comment.userName.toLowerCase().includes('admin');
}

function CommentItem({
  comment,
  depth,
  onReply,
  expandedIds,
  toggleExpand,
}: {
  comment: ProductCommentResponseDto;
  depth: number;
  onReply: (parentId: string, userName: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const isStaff = isStaffReply(comment);
  const hasReplies = comment.replies.length > 0;
  const isExpanded = expandedIds.has(comment.id);
  const totalReplies = countAllReplies(comment);
  const effectiveDepth = Math.min(depth, MAX_VISIBLE_DEPTH);

  return (
    <View style={{ marginLeft: effectiveDepth * INDENT_PX }}>
      <View style={styles.commentItem}>
        <View style={styles.commentLeft}>
          {comment.userAvatarUrl ? (
            <Image source={{ uri: comment.userAvatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, isStaff && styles.avatarStaff]}>
              {isStaff ? (
                <Ionicons name="shield-checkmark" size={14} color={COLORS.white} />
              ) : (
                <Text style={styles.avatarText}>
                  {comment.userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentHeaderRow}>
            <View style={styles.commentNameRow}>
              <Text style={[styles.commentUser, isStaff && styles.commentUserStaff]}>
                {comment.userName}
              </Text>
              {isStaff && (
                <View style={styles.staffBadge}>
                  <Text style={styles.staffBadgeText}>Quản trị viên</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentTime}>
              {comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}
            </Text>
          </View>
          <Text style={styles.commentContent}>{comment.content}</Text>
          <TouchableOpacity
            style={styles.replyBtn}
            activeOpacity={0.7}
            onPress={() => onReply(comment.id, comment.userName)}
          >
            <Ionicons name="chatbubble-outline" size={14} color={COLORS.accentRed} />
            <Text style={styles.replyBtnText}>Phản hồi</Text>
          </TouchableOpacity>

          {hasReplies && !isExpanded && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(comment.id)}>
              <Text style={styles.viewReplies}>
                Xem tất cả {totalReplies} phản hồi ▾
              </Text>
            </TouchableOpacity>
          )}
          {hasReplies && isExpanded && (
            <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(comment.id)}>
              <Text style={styles.viewReplies}>Ẩn phản hồi ▴</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isExpanded &&
        comment.replies.map((reply) => (
          <CommentItem
            key={reply.id}
            comment={reply}
            depth={depth + 1}
            onReply={onReply}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        ))}
    </View>
  );
}

export default function ProductQAScreen() {
  const { id, focusQuestionId } = useLocalSearchParams<{
    id?: string;
    focusQuestionId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const inputRef = useRef<TextInput>(null);

  const [comments, setComments] = useState<ProductCommentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget>(
    focusQuestionId ? { parentId: String(focusQuestionId), userName: '' } : null,
  );

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const productId = id ?? '';

  const loadComments = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchComments(productId);
      setComments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể tải hỏi đáp');
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    loadComments().finally(() => setLoading(false));
  }, [productId, loadComments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadComments();
    setRefreshing(false);
  }, [loadComments]);

  const sortedComments = useMemo(() => {
    return [...comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [comments]);

  const toggleExpand = useCallback((commentId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }, []);

  const handleReply = useCallback((parentId: string, userName: string) => {
    setReplyTarget({ parentId, userName });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyTarget(null);
    setInput('');
  }, []);

  const addReplyOptimistically = (
    list: ProductCommentResponseDto[],
    parentId: string,
    newComment: ProductCommentResponseDto,
  ): ProductCommentResponseDto[] => {
    return list.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...c.replies, newComment] };
      }
      if (c.replies.length > 0) {
        return { ...c, replies: addReplyOptimistically(c.replies, parentId, newComment) };
      }
      return c;
    });
  };

  const removeOptimistic = (
    list: ProductCommentResponseDto[],
    targetId: string,
  ): ProductCommentResponseDto[] => {
    return list
      .filter((c) => c.id !== targetId)
      .map((c) => ({
        ...c,
        replies: removeOptimistic(c.replies, targetId),
      }));
  };

  const replaceOptimistic = (
    list: ProductCommentResponseDto[],
    targetId: string,
    real: ProductCommentResponseDto,
  ): ProductCommentResponseDto[] => {
    return list.map((c) => {
      if (c.id === targetId) return real;
      if (c.replies.length > 0) {
        return { ...c, replies: replaceOptimistic(c.replies, targetId, real) };
      }
      return c;
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || submitting) return;

    if (!isSignedIn) {
      router.push({
        pathname: '/(auth)/login',
        params: { redirect: `/product/${productId}/qa` },
      });
      return;
    }

    const parentId = replyTarget?.parentId ?? null;
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: ProductCommentResponseDto = {
      id: optimisticId,
      userId: user?.id ?? '',
      userName: user?.fullName ?? user?.firstName ?? 'Bạn',
      userAvatarUrl: user?.imageUrl ?? null,
      productId,
      parentId,
      content: text,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (parentId) {
      setComments((prev) => addReplyOptimistically(prev, parentId, optimistic));
      setExpandedIds((prev) => new Set(prev).add(parentId));
    } else {
      setComments((prev) => [optimistic, ...prev]);
    }

    setInput('');
    setReplyTarget(null);
    setSubmitting(true);

    try {
      const created = await createComment({ productId, content: text, parentId }, getToken);
      setComments((prev) => replaceOptimistic(prev, optimisticId, created));
    } catch (e) {
      setComments((prev) => removeOptimistic(prev, optimisticId));
      if (e instanceof ApiError && e.status === 401) {
        router.push({
          pathname: '/(auth)/login',
          params: { redirect: `/product/${productId}/qa` },
        });
      } else {
        Alert.alert('Lỗi', e instanceof Error ? e.message : 'Không thể gửi. Vui lòng thử lại.');
      }
      setInput(text);
      if (parentId) setReplyTarget(replyTarget);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.headerBlue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={COLORS.cartTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỏi và đáp</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <FlatList
        data={sortedComments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
        ListHeaderComponent={
          <View style={styles.askCard}>
            <Text style={styles.askTitle}>Hãy đặt câu hỏi cho chúng tôi</Text>
            <Text style={styles.askDescription}>
              TechStore sẽ phản hồi trong vòng 1 giờ. Nếu Quý khách gửi câu hỏi
              sau 22h, chúng tôi sẽ trả lời vào sáng hôm sau. Thông tin có thể
              thay đổi theo thời gian, vui lòng đặt câu hỏi để nhận được cập
              nhật mới nhất!
            </Text>
            <TouchableOpacity
              style={styles.askButton}
              activeOpacity={0.8}
              onPress={() => {
                if (!isSignedIn) {
                  router.push({
                    pathname: '/(auth)/login',
                    params: { redirect: `/product/${productId}/qa` },
                  });
                  return;
                }
                setReplyTarget(null);
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.askButtonText}>Gửi câu hỏi</Text>
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            depth={0}
            onReply={handleReply}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error ? error : 'Chưa có câu hỏi nào.'}
          </Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.headerBlue]} />
        }
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {replyTarget && (
          <View style={styles.replyingRow}>
            <Text style={styles.replyingText}>
              Đang phản hồi {replyTarget.userName ? `@${replyTarget.userName}` : ''}
            </Text>
            <TouchableOpacity onPress={cancelReply}>
              <Text style={styles.replyingCancel}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyTarget ? 'Viết phản hồi...' : 'Viết câu hỏi của bạn tại đây'}
            placeholderTextColor={COLORS.cartTextSecondary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || submitting) && styles.sendBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!input.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.sendText}>Gửi</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.white },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: COLORS.cartTextPrimary },
  headerRightPlaceholder: { width: 24 },
  askCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    padding: 16,
    marginBottom: 16,
  },
  askTitle: { fontSize: 16, fontWeight: '700', color: COLORS.cartTextPrimary, marginBottom: 8 },
  askDescription: {
    fontSize: 13,
    color: COLORS.cartTextSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentRed,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  askButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentLeft: { marginRight: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarStaff: { backgroundColor: COLORS.headerBlue },
  avatarImage: { width: 32, height: 32, borderRadius: 16 },
  avatarText: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary },
  commentBody: { flex: 1 },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  commentUser: { fontSize: 13, fontWeight: '600', color: COLORS.cartTextPrimary },
  commentUserStaff: { color: COLORS.headerBlue },
  staffBadge: {
    backgroundColor: COLORS.headerBlue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staffBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  commentTime: { fontSize: 12, color: COLORS.cartTextSecondary },
  commentContent: { fontSize: 13, color: COLORS.cartTextPrimary, marginTop: 4, lineHeight: 20 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  replyBtnText: { fontSize: 13, color: COLORS.accentRed, fontWeight: '500' },
  viewReplies: { fontSize: 12, color: COLORS.categoryLinkBlue, marginTop: 4 },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: COLORS.white,
  },
  replyingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyingText: { fontSize: 12, color: COLORS.cartTextSecondary },
  replyingCancel: { fontSize: 12, color: COLORS.accentRed, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.cartTextPrimary,
  },
  sendBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.accentRed,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  emptyText: { fontSize: 13, color: COLORS.cartTextSecondary, textAlign: 'center', marginTop: 16 },
});
