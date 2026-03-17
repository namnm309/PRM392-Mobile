import { COLORS } from '@/constants/theme';
import type { ProductCommentResponseDto } from '@/lib/commentsApi';
import { countAllReplies } from '@/lib/commentsApi';
import { formatRelativeTime } from '@/lib/timeUtils';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type QASectionProps = {
  comments: ProductCommentResponseDto[];
  onSeeAll?: () => void;
  onReply?: (commentId: string) => void;
  onAsk?: () => void;
};

function getInitial(name: string) {
  return name.charAt(0).toUpperCase() || '?';
}

export function QASection({ comments, onSeeAll, onReply, onAsk }: QASectionProps) {
  const displayed = comments.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hỏi và đáp</Text>
        <TouchableOpacity activeOpacity={0.7} disabled={!onSeeAll} onPress={onSeeAll}>
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        TechStore sẽ phản hồi trong vòng 1 giờ. Nếu Quý khách gửi câu hỏi sau 22h, chúng tôi sẽ trả lời vào sáng hôm sau. Thông tin có thể thay đổi theo thời gian, vui lòng đặt câu hỏi để nhận được cập nhật mới nhất!
      </Text>
      <TouchableOpacity style={styles.askButton} activeOpacity={0.8} onPress={onAsk}>
        <Text style={styles.askButtonText}>Gửi câu hỏi</Text>
        <Ionicons name="send" size={18} color={COLORS.white} />
      </TouchableOpacity>

      {displayed.length > 0 ? (
        <View style={styles.list}>
          {displayed.map((q) => {
            const totalReplies = countAllReplies(q);
            return (
              <View key={q.id} style={styles.item}>
                {q.userAvatarUrl ? (
                  <Image source={{ uri: q.userAvatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitial(q.userName)}</Text>
                  </View>
                )}
                <View style={styles.content}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{q.userName}</Text>
                    <Text style={styles.timeAgo}>{formatRelativeTime(q.createdAt)}</Text>
                  </View>
                  <Text style={styles.question}>{q.content}</Text>
                  <TouchableOpacity
                    style={styles.replyBtn}
                    activeOpacity={0.7}
                    onPress={() => onReply?.(q.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={14} color={COLORS.accentRed} />
                    <Text style={styles.replyText}>Phản hồi</Text>
                  </TouchableOpacity>
                  {totalReplies > 0 && (
                    <TouchableOpacity activeOpacity={0.7} onPress={() => onReply?.(q.id)}>
                      <Text style={styles.viewReplies}>
                        Xem tất cả {totalReplies} phản hồi ▾
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>Chưa có câu hỏi nào.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.white, marginTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.cartTextPrimary },
  seeAll: { fontSize: 14, color: COLORS.categoryLinkBlue, fontWeight: '500' },
  description: {
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
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  askButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  list: { gap: 16 },
  item: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8E0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 14, fontWeight: '600', color: COLORS.cartTextPrimary },
  content: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 13, fontWeight: '600', color: COLORS.cartTextPrimary },
  timeAgo: { fontSize: 12, color: COLORS.cartTextSecondary },
  question: { fontSize: 13, color: COLORS.cartTextPrimary, marginTop: 4, lineHeight: 20 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  replyText: { fontSize: 13, color: COLORS.accentRed, fontWeight: '500' },
  viewReplies: { fontSize: 12, color: COLORS.categoryLinkBlue, marginTop: 4 },
  emptyText: { fontSize: 13, color: COLORS.cartTextSecondary, textAlign: 'center', paddingVertical: 8 },
});
