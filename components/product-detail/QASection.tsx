import type { QuestionItem } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type QASectionProps = {
  questions: QuestionItem[];
  onSeeAll?: () => void;
  onReply?: (questionId: string) => void;
};

function getInitial(name: string) {
  return name.charAt(0).toUpperCase() || '?';
}

export function QASection({ questions, onSeeAll, onReply }: QASectionProps) {
  if (!questions.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hỏi và đáp</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!onSeeAll}
          onPress={onSeeAll}
        >
          <Text style={styles.seeAll}>Xem tất cả &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {questions.map((q) => (
          <View key={q.id} style={styles.item}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial(q.userName)}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.userName}>{q.userName}</Text>
              <Text style={styles.timeAgo}>{q.timeAgo}</Text>
              <Text style={styles.question}>{q.question}</Text>
              <TouchableOpacity
                style={styles.replyBtn}
                activeOpacity={0.7}
                onPress={() => onReply?.(q.id)}
              >
                <Ionicons name="chatbubble-outline" size={14} color={COLORS.accentRed} />
                <Text style={styles.replyText}>Phản hồi</Text>
              </TouchableOpacity>
              {q.replyCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onReply?.(q.id)}
                >
                  <Text style={styles.viewReplies}>
                    Xem tất cả {q.replyCount} phản hồi v
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  list: {
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  content: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
    marginTop: 2,
  },
  question: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginTop: 6,
    lineHeight: 20,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  replyText: {
    fontSize: 13,
    color: COLORS.accentRed,
    fontWeight: '500',
  },
  viewReplies: {
    fontSize: 12,
    color: COLORS.categoryLinkBlue,
    marginTop: 4,
  },
});
