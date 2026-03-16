import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { useChatService, COMPARE_SYSTEM_PROMPT, type ChatMessage, type SendMessageResult } from '@/lib/services/chatService';
import { searchProductsByName, fetchProductById, type ApiProduct } from '@/lib/productsApi';
import { useWishlist } from '@/contexts/WishlistContext';
import type { FabPosition } from '@/contexts/ai-chatbot-context';
import { useAIChatbot } from '@/contexts/ai-chatbot-context';
import { COLORS } from '@/constants/theme';

function extractProductKeywords(text: string): string {
  const lowered = text.trim().toLowerCase();
  const prefixes = ['tư vấn', 'cho tôi', 'về', 'mua', 'xem', 'giới thiệu', 'hỏi về', 'tìm'];
  let out = lowered;
  for (const p of prefixes) {
    if (out.startsWith(p)) out = out.slice(p.length).trim();
  }
  return out || lowered;
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatProductForCompare(p: ApiProduct): string {
  const price = p.discountPrice ?? p.price;
  return `- ${p.name} (${p.brand?.name ?? 'N/A'}): ${price.toLocaleString('vi-VN')}đ${p.discountPrice ? ` (giảm từ ${p.price.toLocaleString('vi-VN')}đ)` : ''}. ${p.description ?? ''}`;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FAB_SIZE = 56;
const POPOVER_WIDTH = Math.min(SCREEN_W - 24, 360);
const POPOVER_MAX_HEIGHT = Math.min(SCREEN_H * 0.65, 440);
const GAP = 10;

function getPopoverPosition(fab: FabPosition, insets: { top: number; bottom: number }) {
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

  top = Math.max(pad + insets.top, Math.min(SCREEN_H - POPOVER_MAX_HEIGHT - pad - insets.bottom - 60, top));
  left = Math.max(pad, Math.min(SCREEN_W - POPOVER_WIDTH - pad, left));

  return { top, left };
}

type DisplayMessage = import('@/contexts/ai-chatbot-context').ChatbotDisplayMessage;

type AIChatbotModalProps = {
  visible: boolean;
  onClose: () => void;
  initialMessage?: string;
  autoSend?: boolean;
  popoverMode?: boolean;
  fabPosition?: FabPosition;
};

const POPOVER_STYLES = {
  bg: '#FFFFFF',
  header: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111111',
  textSecondary: '#6B7280',
  accent: COLORS.accentRed,
};

export function AIChatbotModal({
  visible,
  onClose,
  initialMessage: initialMessageProp,
  autoSend: autoSendProp,
  popoverMode = false,
  fabPosition = { x: 0, y: 0 },
}: AIChatbotModalProps) {
  const { sendMessage } = useChatService();
  const { isSignedIn } = useAuth();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { messages, setMessages, initialMessage: ctxInitial, autoSend: ctxAutoSend } = useAIChatbot();
  const initialMessage = initialMessageProp ?? ctxInitial ?? '';
  const autoSend = autoSendProp ?? ctxAutoSend ?? false;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingCompareProductId, setAwaitingCompareProductId] = useState<string | null>(null);
  const popoverAnim = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  const welcomeMsg = useMemo<DisplayMessage>(
    () => ({
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI TechStore. Bạn có thể hỏi về sản phẩm, giá cả, bảo hành hoặc hướng dẫn mua hàng.',
    }),
    []
  );

  /** Chỉ khởi tạo khi mở modal lần đầu và chưa có tin nhắn. Giữ lịch sử chat khi đóng/mở lại. */
  const initDoneRef = useRef(false);

  const popoverPos = useMemo(
    () => (popoverMode && fabPosition ? getPopoverPosition(fabPosition, insets) : { top: 0, left: 0 }),
    [popoverMode, fabPosition.x, fabPosition.y, insets.top, insets.bottom]
  );

  useEffect(() => {
    if (!visible) return;
    if (messages.length > 0 && !initialMessage) {
      initDoneRef.current = true;
      return;
    }
    if (initDoneRef.current && !initialMessage) return;
    initDoneRef.current = true;

    setAwaitingCompareProductId(null);
    if (initialMessage && autoSend) {
      setMessages([{ id: '0', role: 'user', content: initialMessage }]);
      setLoading(true);
      sendMessage([{ role: 'user', content: initialMessage }])
        .then((result: SendMessageResult) => {
          const assistantMsg: DisplayMessage = {
            id: '1',
            role: 'assistant',
            content: result.content,
            ...(result.primaryProductId && { productId: result.primaryProductId }),
          };
          setMessages((p) => [...p, assistantMsg]);
        })
        .catch((err) => {
          setMessages((p) => [...p, { id: uniqueId('err'), role: 'assistant', content: `❌ ${err instanceof Error ? err.message : 'Lỗi'}` }]);
        })
        .finally(() => setLoading(false));
    } else if (initialMessage) {
      setMessages([{ id: '0', role: 'user', content: initialMessage }]);
    } else {
      setMessages([welcomeMsg]);
    }
  }, [visible, initialMessage, autoSend, sendMessage, welcomeMsg, messages.length]);

  useEffect(() => {
    if (popoverMode && visible) {
      isClosingRef.current = false;
      popoverAnim.setValue(0);
      Animated.spring(popoverAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [popoverMode, visible]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handlePopoverClose = useCallback(() => {
    if (!popoverMode || isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(popoverAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [popoverMode, onClose]);

  const handleSend = useCallback(
    async (text?: string) => {
      const toSend = (text ?? inputText).trim();
      if (!toSend || loading) return;

      setInputText('');
      const userMsg: DisplayMessage = { id: uniqueId('user'), role: 'user', content: toSend };
      setMessages((prev) => (prev[0]?.id === 'welcome' ? [userMsg] : [...prev, userMsg]));

      setLoading(true);
      const prevMessages = messages.filter((m) => m.id !== 'welcome');

      try {
        if (awaitingCompareProductId) {
          const keywords = extractProductKeywords(toSend);
          const secondProducts = await searchProductsByName(keywords);
          const product2 = secondProducts[0];
          if (!product2) {
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== 'temp'),
              { id: uniqueId('msg'), role: 'assistant', content: `Không tìm thấy sản phẩm "${toSend}" trong hệ thống. Vui lòng thử tên khác.` },
            ]);
            setAwaitingCompareProductId(null);
            return;
          }
          const product1 = await fetchProductById(awaitingCompareProductId);
          setAwaitingCompareProductId(null);
          if (!product1) {
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== 'temp'),
              { id: uniqueId('msg'), role: 'assistant', content: 'Không tìm thấy sản phẩm đầu tiên để so sánh.' },
            ]);
            return;
          }
          const compareContent = `So sánh hai sản phẩm sau:\n\n**Sản phẩm 1:**\n${formatProductForCompare(product1)}\n\n**Sản phẩm 2:**\n${formatProductForCompare(product2)}`;
          const history: ChatMessage[] = [
            ...prevMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user' as const, content: compareContent },
          ];
          const result = await sendMessage(history, { systemPrompt: COMPARE_SYSTEM_PROMPT });
          setMessages((prev) => [...prev.filter((m) => m.id !== 'temp'), { id: uniqueId('msg'), role: 'assistant', content: result.content }]);
        } else {
          const history: ChatMessage[] = [
            ...prevMessages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user' as const, content: toSend },
          ];
          const result = await sendMessage(history);
          const assistantMsg: DisplayMessage = {
            id: uniqueId('msg'),
            role: 'assistant',
            content: result.content,
            ...(result.primaryProductId && { productId: result.primaryProductId }),
          };
          setMessages((prev) => [...prev.filter((m) => m.id !== 'temp'), assistantMsg]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể kết nối AI. Vui lòng thử lại.';
        setMessages((prev) => [...prev, { id: uniqueId('err'), role: 'assistant', content: `❌ ${msg}` }]);
        setAwaitingCompareProductId(null);
      } finally {
        setLoading(false);
      }
    },
    [inputText, loading, messages, sendMessage, awaitingCompareProductId]
  );

  const handleCompareClick = useCallback(
    (productId: string) => {
      setAwaitingCompareProductId(productId);
      const askMsg: DisplayMessage = {
        id: uniqueId('ask'),
        role: 'assistant',
        content: 'Nhập tên sản phẩm mà bạn muốn so sánh (ví dụ: Samsung Galaxy S24)',
      };
      setMessages((prev) => [...prev, askMsg]);
    },
    []
  );

  const handleWishlistClick = useCallback(
    async (productId: string) => {
      if (!isSignedIn) {
        Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích.');
        return;
      }
      if (isWishlisted(productId)) {
        Alert.alert('Đã có', 'Sản phẩm này đã có trong danh sách yêu thích của bạn.');
        return;
      }
      try {
        await toggleWishlist(productId);
        Alert.alert('Đã thêm', 'Sản phẩm đã được thêm vào danh sách yêu thích.');
      } catch {
        Alert.alert('Lỗi', 'Không thể thêm vào yêu thích. Vui lòng thử lại.');
      }
    },
    [isSignedIn, isWishlisted, toggleWishlist]
  );

  const isPopover = popoverMode;
  const hasUserMessages = messages.some((m) => m.role === 'user');
  const showWelcomeChips = isPopover && !hasUserMessages;

  const content = (
    <KeyboardAvoidingView
      style={[styles.body, isPopover && { height: POPOVER_MAX_HEIGHT, borderRadius: 16, overflow: 'hidden' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      <View style={[styles.header, isPopover && { backgroundColor: POPOVER_STYLES.header, paddingVertical: 12 }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.botAvatar, isPopover && { width: 40, height: 40 }]}>
            <LinearGradient colors={['#E53935', '#D32F2F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.botAvatarGradient}>
              <Ionicons name="sparkles" size={isPopover ? 20 : 22} color="#FFF" />
            </LinearGradient>
          </View>
          <View>
            <Text style={[styles.headerTitle, isPopover && { color: POPOVER_STYLES.text, fontSize: 16 }]}>TechStore AI</Text>
            {isPopover && <Text style={[styles.headerSubtitle, { color: POPOVER_STYLES.textSecondary }]}>• Trợ lý mua sắm</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={isPopover ? handlePopoverClose : onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color={isPopover ? POPOVER_STYLES.text : COLORS.cartTextPrimary} />
        </TouchableOpacity>
      </View>

      {showWelcomeChips ? (
        <>
          <ScrollView
            style={styles.popoverWelcome}
            contentContainerStyle={styles.popoverWelcomeContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.popoverSparkle}>
              <Ionicons name="sparkles" size={48} color={POPOVER_STYLES.accent} />
            </View>
            <Text style={styles.popoverWelcomeTitle}>Xin chào! Tôi là TechStore AI</Text>
            <Text style={styles.popoverWelcomeSub}>Hỏi tôi về sản phẩm, giá cả, bảo hành!</Text>
            <View style={styles.popoverChips}>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Điện thoại nào đang giảm giá?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Sản phẩm giảm giá</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Tư vấn điện thoại tầm 10 triệu')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Điện thoại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Đồng hồ thông minh nào tốt cho chạy bộ?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Đồng hồ thông minh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Máy tính bảng cho học online và giải trí?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Máy tính bảng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Laptop gaming giá tốt?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Laptop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Tai nghe chống ồn ANC tốt?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Tai nghe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Chính sách bảo hành như thế nào?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Bảo hành</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.popoverChip} onPress={() => handleSend('Cách đặt hàng và thanh toán?')} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.popoverChipText}>Đặt hàng & thanh toán</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={[styles.inputRow, { backgroundColor: POPOVER_STYLES.header, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
            <TextInput
              style={[styles.input, { backgroundColor: POPOVER_STYLES.card, color: POPOVER_STYLES.text }]}
              placeholder="Hoặc nhập câu hỏi..."
              placeholderTextColor={POPOVER_STYLES.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              editable={!loading}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={[styles.scroll, isPopover && { backgroundColor: POPOVER_STYLES.bg }]}
            contentContainerStyle={[styles.scrollContent, isPopover && { padding: 12 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            {messages.map((msg) => (
              <View key={msg.id} style={[styles.bubbleWrap, msg.role === 'user' ? styles.bubbleUserWrap : styles.bubbleBotWrap]}>
                <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleBot, isPopover && styles.bubblePopover, (msg.role === 'assistant' && msg.productId) && styles.bubbleWithActions]}>
                  <Text style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextBot, isPopover && { fontSize: 14 }]}>{msg.content}</Text>
                  {msg.role === 'assistant' && msg.productId && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnCompare]}
                        onPress={() => handleCompareClick(msg.productId!)}
                        activeOpacity={0.8}>
                        <Ionicons name="git-compare-outline" size={16} color={COLORS.accentRed} />
                        <Text style={styles.actionBtnText}>So sánh</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnWishlist]}
                        onPress={() => handleWishlistClick(msg.productId!)}
                        activeOpacity={0.8}
                        disabled={loading}>
                        <Ionicons name={isWishlisted(msg.productId) ? 'heart' : 'heart-outline'} size={16} color={COLORS.accentRed} />
                        <Text style={styles.actionBtnText}>{isWishlisted(msg.productId) ? 'Đã yêu thích' : 'Yêu thích'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {loading && (
              <View key="loading" style={styles.bubbleWrap}>
                <View style={[styles.bubble, styles.bubbleBot, isPopover && styles.bubblePopover]}>
                  <ActivityIndicator size="small" color={COLORS.accentRed} />
                  <Text style={[styles.bubbleText, styles.bubbleTextBot, { marginLeft: 8 }]}>Đang suy nghĩ...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputRow, isPopover && { backgroundColor: POPOVER_STYLES.header, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
            <TextInput
              style={[styles.input, isPopover && { backgroundColor: POPOVER_STYLES.card, color: POPOVER_STYLES.text }]}
              placeholder={awaitingCompareProductId ? 'Nhập tên sản phẩm để so sánh...' : 'Nhập câu hỏi...'}
              placeholderTextColor={isPopover ? POPOVER_STYLES.textSecondary : COLORS.grey}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              editable={!loading}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!inputText.trim() || loading}>
              <Ionicons name="send" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <Modal visible={visible} animationType={isPopover ? 'fade' : 'slide'} transparent>
      <View style={[styles.overlay, isPopover && styles.overlayPopover]} pointerEvents="box-none">
        {isPopover ? (
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
            activeOpacity={1}
            onPress={handlePopoverClose}
          />
        ) : null}
        <Animated.View
          style={[
            isPopover
              ? {
                  position: 'absolute',
                  zIndex: 1,
                  top: popoverPos.top,
                  left: popoverPos.left,
                  width: POPOVER_WIDTH,
                  maxHeight: POPOVER_MAX_HEIGHT,
                  backgroundColor: POPOVER_STYLES.bg,
                  borderRadius: 16,
                  overflow: 'hidden',
                  opacity: popoverAnim,
                  transform: [{ scale: popoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                  ...(Platform.OS === 'android' ? { elevation: 12 } : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }),
                }
              : styles.modal,
            !isPopover && { paddingBottom: insets.bottom + 16 },
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayPopover: {
    backgroundColor: 'transparent',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cartBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 10,
  },
  botAvatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.cartTextPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    flex: 1,
    minHeight: 300,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  bubbleWrap: {
    marginBottom: 10,
  },
  bubbleUserWrap: {
    alignItems: 'flex-end',
  },
  bubbleBotWrap: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubblePopover: {
    maxWidth: '90%',
  },
  bubbleUser: {
    backgroundColor: COLORS.accentRed,
  },
  bubbleBot: {
    backgroundColor: COLORS.categoryContentBg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleWithActions: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnCompare: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.4)',
  },
  actionBtnWishlist: {
    backgroundColor: 'rgba(229, 57, 53, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.4)',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentRed,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: COLORS.white,
  },
  bubbleTextBot: {
    color: COLORS.cartTextPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  popoverWelcome: {
    flex: 1,
  },
  popoverWelcomeContent: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 24,
  },
  popoverSparkle: {
    marginBottom: 12,
  },
  popoverWelcomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: POPOVER_STYLES.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  popoverWelcomeSub: {
    fontSize: 13,
    color: POPOVER_STYLES.textSecondary,
    marginBottom: 16,
  },
  popoverChips: {
    gap: 8,
    width: '100%',
  },
  popoverChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: POPOVER_STYLES.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.4)',
  },
  popoverChipText: {
    fontSize: 14,
    color: POPOVER_STYLES.text,
    fontWeight: '500',
  },
});
