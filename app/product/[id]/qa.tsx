import { getProductDetail } from '@/constants/productDetailData';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductQAScreen() {
  const { id, focusQuestionId } = useLocalSearchParams<{
    id?: string;
    focusQuestionId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const product = useMemo(() => getProductDetail(id ?? ''), [id]);

  const [questions, setQuestions] = useState(product.questions);
  const [mode, setMode] = useState<
    { type: 'ask' } | { type: 'reply'; questionId: string }
  >(
    focusQuestionId
      ? { type: 'reply', questionId: String(focusQuestionId) }
      : { type: 'ask' },
  );
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    if (mode.type === 'ask') {
      const newQuestion = {
        id: `local-${Date.now()}`,
        userName: 'Bạn',
        timeAgo: 'Vừa xong',
        question: text,
        replyCount: 0,
      };
      setQuestions((prev) => [newQuestion, ...prev]);
    } else {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === mode.questionId
            ? {
                ...q,
                replyCount: q.replyCount + 1,
              }
            : q,
        ),
      );
    }

    setInput('');
    if (mode.type === 'reply') {
      setMode({ type: 'ask' });
    }
  };

  const handleReply = (questionId: string) => {
    setMode({ type: 'reply', questionId });
    setTimeout(() => {
      const index = questions.findIndex((q) => q.id === questionId);
      if (index >= 0) {
        listRef.current?.scrollToIndex({ index, animated: true });
      }
    }, 0);
  };

  const currentQuestion =
    mode.type === 'reply'
      ? questions.find((q) => q.id === mode.questionId)
      : undefined;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close"
            size={22}
            color={COLORS.cartTextPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỏi và đáp</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
        data={questions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.askCard}>
            <Text style={styles.askTitle}>Hãy đặt câu hỏi cho chúng tôi</Text>
            <Text style={styles.askDescription}>
              CellphoneS sẽ phản hồi trong vòng 1 giờ. Nếu Quý khách gửi câu hỏi
              sau 22h, chúng tôi sẽ trả lời vào sáng hôm sau. Thông tin có thể
              thay đổi theo thời gian, vui lòng đặt câu hỏi để nhận được cập
              nhật mới nhất!
            </Text>
            <TouchableOpacity style={styles.askButton} activeOpacity={0.8}>
              <Text style={styles.askButtonText}>Gửi câu hỏi</Text>
              <Ionicons name="send" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.qaItem}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.qaContent}>
              <View style={styles.qaHeaderRow}>
                <Text style={styles.qaUser}>{item.userName}</Text>
                <Text style={styles.qaTime}>{item.timeAgo}</Text>
              </View>
              <Text style={styles.qaQuestion}>{item.question}</Text>
              <TouchableOpacity
                style={styles.replyBtn}
                activeOpacity={0.7}
                onPress={() => handleReply(item.id)}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={14}
                  color={COLORS.accentRed}
                />
                <Text style={styles.replyText}>Phản hồi</Text>
              </TouchableOpacity>
              {item.replyCount > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleReply(item.id)}
                >
                  <Text style={styles.viewReplies}>
                    Xem tất cả {item.replyCount} phản hồi v
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        {mode.type === 'reply' && currentQuestion && (
          <View style={styles.replyingRow}>
            <Text style={styles.replyingText}>
              Đang phản hồi hỏi {currentQuestion.userName}
            </Text>
            <TouchableOpacity onPress={() => setMode({ type: 'ask' })}>
              <Text style={styles.replyingCancel}>Hủy</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={
              mode.type === 'ask'
                ? 'Viết câu hỏi của bạn tại đây'
                : 'Viết câu hỏi của bạn tại đây'
            }
            placeholderTextColor={COLORS.cartTextSecondary}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !input.trim() && styles.sendBtnDisabled,
            ]}
            activeOpacity={0.8}
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Text style={styles.sendText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  headerRightPlaceholder: {
    width: 24,
  },
  list: {
    flex: 1,
  },
  askCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
    padding: 16,
    marginBottom: 16,
  },
  askTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
    marginBottom: 8,
  },
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
  askButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  qaItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  qaContent: {
    flex: 1,
  },
  qaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  qaUser: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cartTextPrimary,
  },
  qaTime: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
  qaQuestion: {
    fontSize: 13,
    color: COLORS.cartTextPrimary,
    marginTop: 4,
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
  replyingText: {
    fontSize: 12,
    color: COLORS.cartTextSecondary,
  },
  replyingCancel: {
    fontSize: 12,
    color: COLORS.accentRed,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
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
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});

