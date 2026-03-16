import { Ionicons } from '@expo/vector-icons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import {
  createSupportChatConnection,
  type SupportChatMessage,
} from '@/lib/supportChatService';
import type { FabPosition } from '@/contexts/ai-chatbot-context';
import { COLORS } from '@/constants/theme';
import { API_BASE_URL } from '@/constants/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FAB_SIZE = 56;
const POPOVER_WIDTH = Math.min(SCREEN_W - 24, 360);
const POPOVER_MAX_HEIGHT = Math.min(SCREEN_H * 0.65, 440);
const GAP = 10;
const SUPPORT_BLUE = '#1976D2';

function getPopoverPosition(
  fab: FabPosition,
  insets: { top: number; bottom: number },
) {
  const pad = 8;
  const fabCenterX = fab.x + FAB_SIZE / 2;
  const fabCenterY = fab.y + FAB_SIZE / 2;

  let top: number;
  let left: number;

  if (fabCenterY > SCREEN_H / 2) {
    top = fab.y - POPOVER_MAX_HEIGHT - GAP;
  } else {
    top = fab.y + FAB_SIZE + GAP;
  }
  if (fabCenterX > SCREEN_W / 2) {
    left = fab.x - POPOVER_WIDTH - GAP;
  } else {
    left = fab.x + FAB_SIZE + GAP;
  }

  top = Math.max(
    pad + insets.top,
    Math.min(SCREEN_H - POPOVER_MAX_HEIGHT - pad - insets.bottom - 60, top),
  );
  left = Math.max(pad, Math.min(SCREEN_W - POPOVER_WIDTH - pad, left));

  return { top, left };
}

const POPOVER_STYLES = {
  bg: '#FFFFFF',
  header: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B7280',
  accent: SUPPORT_BLUE,
};

type SupportChatModalProps = {
  visible: boolean;
  onClose: () => void;
  fabPosition: FabPosition;
};

export function SupportChatModal({
  visible,
  onClose,
  fabPosition,
}: SupportChatModalProps) {
  const { getToken, isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [lastMsgStatus, setLastMsgStatus] = useState<
    'idle' | 'sending' | 'sent' | 'seen'
  >('idle');
  const [staffTyping, setStaffTyping] = useState(false);
  const connectionRef = useRef<Awaited<
    ReturnType<typeof createSupportChatConnection>
  > | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const getTokenRef = useRef(getToken);
  const popoverAnim = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);
  const typingDisabledRef = useRef(false);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const popoverPos = useMemo(
    () => getPopoverPosition(fabPosition, insets),
    [fabPosition, insets],
  );

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      popoverAnim.setValue(0);
      Animated.spring(popoverAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [visible, popoverAnim]);

  useEffect(() => {
    if (!visible || !isSignedIn) return;

    let cancelled = false;

    const doConnect = async () => {
      try {
        setError(null);
        setConnecting(true);
        const conn = await createSupportChatConnection(() =>
          getTokenRef.current(),
        );
        if (cancelled) {
          conn.disconnect();
          return;
        }
        connectionRef.current = conn;
        setMessages([...conn.messages]);
        conn.onNewMessage((msg) => {
          if (cancelled) return;
          setMessages((prev) => [...prev, msg]);
          if (msg.senderRole === 'staff') {
            setLastMsgStatus((prev) =>
              prev === 'sent' || prev === 'sending' ? 'seen' : prev,
            );
            setStaffTyping(false);
          }
        });
        setConnecting(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể kết nối. Vui lòng thử lại.',
          );
          setConnecting(false);
        }
      }
    };

    doConnect();

    return () => {
      cancelled = true;
      connectionRef.current?.disconnect();
      connectionRef.current = null;
    };
  }, [visible, isSignedIn]);

  const handlePopoverClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(popoverAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [onClose, popoverAnim]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !connectionRef.current) return;
    setInputText('');
    setLastMsgStatus('sending');
    try {
      await connectionRef.current.sendMessage(text);
      setLastMsgStatus('sent');
    } catch (err) {
      setLastMsgStatus('idle');
      setError(err instanceof Error ? err.message : 'Gửi thất bại');
    }
  }, [inputText]);

  const scrollToEnd = useCallback(() => {
    setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100,
    );
  }, []);

  useEffect(() => {
    if (messages.length > 0 && visible) scrollToEnd();
  }, [messages.length, visible, scrollToEnd]);

  useEffect(() => {
    if (!visible || !isSignedIn || typingDisabledRef.current) return;

    let stopped = false;
    const checkTyping = async () => {
      if (stopped) return;
      try {
        const token = await getTokenRef.current();
        if (!token) return;
        const res = await fetch(
          `${API_BASE_URL}/api/support-chat/typing-status`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.status === 404) {
          typingDisabledRef.current = true;
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (!stopped) setStaffTyping(!!data?.isTyping);
        }
      } catch {
        // silently ignore network errors
      }
    };

    checkTyping();
    const timer = setInterval(checkTyping, 2500);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [visible, isSignedIn]);

  const lastUserMsgIndex = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderRole === 'user') return i;
    }
    return -1;
  }, [messages]);

  if (!visible) return null;

  const content = (
    <KeyboardAvoidingView
      style={styles.body}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Ionicons name="chatbubbles" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Tư vấn & hỗ trợ</Text>
            <Text style={styles.headerSubtitle}>Chat với nhân viên</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handlePopoverClose}
          style={styles.closeBtn}
          hitSlop={12}>
          <Ionicons name="close" size={22} color={POPOVER_STYLES.text} />
        </TouchableOpacity>
      </View>

      {!isSignedIn ? (
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={40} color={COLORS.grey} />
          <Text style={styles.infoText}>
            Vui lòng đăng nhập để chat với nhân viên
          </Text>
        </View>
      ) : connecting && messages.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={POPOVER_STYLES.accent} />
          <Text style={styles.infoText}>Đang kết nối...</Text>
        </View>
      ) : error && messages.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              connectionRef.current?.disconnect();
              connectionRef.current = null;
              setError(null);
              setConnecting(true);
              createSupportChatConnection(() => getTokenRef.current())
                .then((conn) => {
                  connectionRef.current = conn;
                  setMessages([...conn.messages]);
                  conn.onNewMessage((msg) =>
                    setMessages((prev) => [...prev, msg]),
                  );
                  setConnecting(false);
                })
                .catch((err) => {
                  setError(
                    err instanceof Error ? err.message : 'Không thể kết nối.',
                  );
                  setConnecting(false);
                });
            }}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToEnd}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={40}
                  color={COLORS.grey}
                />
                <Text style={styles.infoText}>
                  Hãy gửi tin nhắn để được hỗ trợ
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const isUser = item.senderRole === 'user';
              const isLastUser = isUser && index === lastUserMsgIndex;
              return (
                <>
                  <View
                    style={[
                      styles.bubbleWrap,
                      isUser ? styles.bubbleUserWrap : styles.bubbleStaffWrap,
                    ]}>
                    <View
                      style={[
                        styles.bubble,
                        isUser ? styles.bubbleUser : styles.bubbleStaff,
                      ]}>
                      <Text
                        style={[
                          styles.bubbleSender,
                          isUser && styles.bubbleSenderUser,
                        ]}>
                        {item.senderName}
                      </Text>
                      <Text
                        style={[
                          styles.bubbleText,
                          isUser && styles.bubbleTextUser,
                        ]}>
                        {item.content}
                      </Text>
                      <Text
                        style={[
                          styles.bubbleTime,
                          isUser && styles.bubbleTimeUser,
                        ]}>
                        {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  {isLastUser && lastMsgStatus !== 'idle' && (
                    <View style={styles.statusRow}>
                      <Ionicons
                        name={
                          lastMsgStatus === 'seen'
                            ? 'checkmark-done'
                            : 'checkmark'
                        }
                        size={13}
                        color={
                          lastMsgStatus === 'seen'
                            ? SUPPORT_BLUE
                            : COLORS.grey
                        }
                      />
                      <Text
                        style={[
                          styles.statusText,
                          lastMsgStatus === 'seen' && styles.statusSeen,
                        ]}>
                        {lastMsgStatus === 'sending'
                          ? 'Đang gửi...'
                          : lastMsgStatus === 'sent'
                            ? 'Đã gửi'
                            : 'Đã xem'}
                      </Text>
                    </View>
                  )}
                </>
              );
            }}
            ListFooterComponent={
              staffTyping ? (
                <View style={styles.typingRow}>
                  <ActivityIndicator
                    size="small"
                    color={SUPPORT_BLUE}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.typingText}>
                    Nhân viên đang nhập...
                  </Text>
                </View>
              ) : null
            }
          />
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor={POPOVER_STYLES.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              maxLength={1000}
              editable={!connecting}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || connecting) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || connecting}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
          activeOpacity={1}
          onPress={handlePopoverClose}
        />
        <Animated.View
          style={[
            styles.popover,
            {
              top: popoverPos.top,
              left: popoverPos.left,
              opacity: popoverAnim,
              transform: [
                {
                  scale: popoverAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}>
          {content}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popover: {
    position: 'absolute',
    zIndex: 1,
    width: POPOVER_WIDTH,
    maxHeight: POPOVER_MAX_HEIGHT,
    backgroundColor: POPOVER_STYLES.bg,
    borderRadius: 16,
    overflow: 'hidden',
    ...(Platform.OS === 'android'
      ? { elevation: 12 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        }),
  },
  body: {
    height: POPOVER_MAX_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
    backgroundColor: POPOVER_STYLES.header,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SUPPORT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: POPOVER_STYLES.text,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    color: POPOVER_STYLES.textSecondary,
  },
  closeBtn: {
    padding: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  infoText: {
    color: COLORS.grey,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: SUPPORT_BLUE,
    fontWeight: '600',
    fontSize: 14,
  },
  list: {
    flex: 1,
    backgroundColor: POPOVER_STYLES.bg,
  },
  listContent: {
    padding: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  bubbleWrap: {
    marginBottom: 8,
  },
  bubbleUserWrap: {
    alignItems: 'flex-end',
  },
  bubbleStaffWrap: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleUser: {
    backgroundColor: SUPPORT_BLUE,
  },
  bubbleStaff: {
    backgroundColor: COLORS.categoryContentBg,
  },
  bubbleSender: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.grey,
    marginBottom: 3,
  },
  bubbleSenderUser: {
    color: 'rgba(255,255,255,0.9)',
  },
  bubbleText: {
    fontSize: 14,
    color: COLORS.cartTextPrimary,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#FFF',
  },
  bubbleTime: {
    fontSize: 10,
    color: COLORS.grey,
    marginTop: 3,
  },
  bubbleTimeUser: {
    color: 'rgba(255,255,255,0.8)',
  },
  errorBanner: {
    padding: 8,
    backgroundColor: '#FEE2E2',
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cartBorder,
    backgroundColor: POPOVER_STYLES.header,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 80,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: POPOVER_STYLES.card,
    color: POPOVER_STYLES.text,
    borderWidth: 1,
    borderColor: COLORS.cartBorder,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SUPPORT_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 14,
    marginTop: -4,
    marginBottom: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.grey,
  },
  statusSeen: {
    color: SUPPORT_BLUE,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.grey,
    fontStyle: 'italic',
  },
});
