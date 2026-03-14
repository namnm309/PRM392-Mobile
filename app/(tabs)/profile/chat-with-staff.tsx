import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { createSupportChatConnection, type SupportChatMessage } from '@/lib/supportChatService';
import { COLORS } from '@/constants/theme';

export default function ChatWithStaffScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const connectionRef = useRef<Awaited<ReturnType<typeof createSupportChatConnection>> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const connect = useCallback(async () => {
    try {
      setError(null);
      setConnecting(true);
      const conn = await createSupportChatConnection(getToken);
      connectionRef.current = conn;
      setMessages([...conn.messages]);

      conn.onNewMessage((msg) => {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });

      setConnecting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kết nối. Vui lòng thử lại.');
      setConnecting(false);
    }
  }, [getToken]);

  useEffect(() => {
    connect();
    return () => {
      connectionRef.current?.disconnect();
    };
  }, [connect]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !connectionRef.current) return;
    setInputText('');
    try {
      await connectionRef.current.sendMessage(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi thất bại');
    }
  };

  if (!getToken) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={COLORS.cartTextPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chat với nhân viên</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Vui lòng đăng nhập để sử dụng tính năng này.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.cartTextPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat với nhân viên</Text>
        {connecting && <ActivityIndicator size="small" color={COLORS.accentRed} style={styles.headerSpinner} />}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={connect}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {connecting ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.accentRed} />
            <Text style={styles.connectingText}>Đang kết nối...</Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.grey} />
                  <Text style={styles.emptyText}>Chào bạn! Hãy gửi tin nhắn để được hỗ trợ.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isUser = item.senderRole === 'user';
                return (
                <View style={[styles.bubbleWrap, isUser ? styles.bubbleUserWrap : styles.bubbleStaffWrap]}>
                  <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleStaff]}>
                    <Text style={[styles.bubbleSender, isUser && styles.bubbleSenderUser]}>{item.senderName}</Text>
                    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
                    <Text style={[styles.bubbleTime, isUser && styles.bubbleTimeUser]}>
                      {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              );}}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor={COLORS.grey}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
                editable={!connecting}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || connecting) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || connecting}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  headerSpinner: {
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
  retryText: {
    color: COLORS.accentRed,
    fontWeight: '600',
    fontSize: 14,
  },
  body: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  connectingText: {
    color: COLORS.grey,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: COLORS.grey,
    fontSize: 15,
  },
  bubbleWrap: {
    marginBottom: 10,
  },
  bubbleUserWrap: {
    alignItems: 'flex-end',
  },
  bubbleStaffWrap: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: COLORS.accentRed,
  },
  bubbleStaff: {
    backgroundColor: COLORS.categoryContentBg,
  },
  bubbleSender: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.grey,
    marginBottom: 4,
  },
  bubbleSenderUser: {
    color: 'rgba(255,255,255,0.9)',
  },
  bubbleText: {
    fontSize: 15,
    color: COLORS.cartTextPrimary,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#FFF',
  },
  bubbleTime: {
    fontSize: 11,
    color: COLORS.grey,
    marginTop: 4,
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: COLORS.categoryContentBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.cartTextPrimary,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accentRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
