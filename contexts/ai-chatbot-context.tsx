import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { loadChatHistory, saveChatHistory, clearChatHistory } from '@/lib/aiChatHistoryStorage';

export interface OpenChatbotOptions {
  initialMessage?: string;
  autoSend?: boolean;
}

export interface FabPosition {
  x: number;
  y: number;
}

/** Tin nhắn chat - lưu AsyncStorage, chỉ xóa khi logout */
export interface ChatbotDisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  productId?: string;
  productName?: string;
}

interface AIChatbotContextValue {
  visible: boolean;
  initialMessage: string;
  autoSend: boolean;
  fabPosition: FabPosition;
  messages: ChatbotDisplayMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatbotDisplayMessage[]>>;
  setFabPosition: (pos: FabPosition) => void;
  openChatbot: (opts?: OpenChatbotOptions) => void;
  closeChatbot: () => void;
}

const AIChatbotContext = createContext<AIChatbotContextValue | null>(null);

const DEFAULT_FAB_POS = { x: 0, y: 0 };

export function AIChatbotProvider({ children }: { children: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth();
  const [visible, setVisible] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const [autoSend, setAutoSend] = useState(false);
  const [messages, setMessages] = useState<ChatbotDisplayMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fabPosition, setFabPositionState] = useState<FabPosition>(DEFAULT_FAB_POS);
  const fabPosRef = useRef<FabPosition>(DEFAULT_FAB_POS);
  const prevSignedInRef = useRef<boolean | null>(null);

  const setFabPosition = useCallback((pos: FabPosition) => {
    fabPosRef.current = pos;
    setFabPositionState(pos);
  }, []);

  const openChatbot = useCallback((opts?: OpenChatbotOptions) => {
    setInitialMessage(opts?.initialMessage ?? '');
    setAutoSend(opts?.autoSend ?? false);
    setVisible(true);
  }, []);

  const closeChatbot = useCallback(() => {
    setVisible(false);
    setInitialMessage('');
    setAutoSend(false);
  }, []);

  useEffect(() => {
    if (prevSignedInRef.current === true && !isSignedIn) {
      clearChatHistory();
      setMessages([]);
      setLoaded(false);
    }
    prevSignedInRef.current = isSignedIn ?? null;
  }, [isSignedIn]);

  useEffect(() => {
    if (!userId || !isSignedIn) return;
    let cancelled = false;
    loadChatHistory(userId).then((loadedMsgs) => {
      if (!cancelled) {
        setMessages(loadedMsgs);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [userId, isSignedIn]);

  useEffect(() => {
    if (!loaded || !userId || !isSignedIn) return;
    saveChatHistory(userId, messages);
  }, [messages, userId, isSignedIn, loaded]);

  return (
    <AIChatbotContext.Provider
      value={{ visible, initialMessage, autoSend, fabPosition, messages, setMessages, setFabPosition, openChatbot, closeChatbot }}>
      {children}
    </AIChatbotContext.Provider>
  );
}

export function useAIChatbot() {
  const ctx = useContext(AIChatbotContext);
  if (!ctx) {
    return {
      visible: false,
      initialMessage: '',
      autoSend: false,
      fabPosition: { x: 0, y: 0 },
      messages: [] as ChatbotDisplayMessage[],
      setMessages: () => {},
      setFabPosition: () => {},
      openChatbot: () => {},
      closeChatbot: () => {},
    };
  }
  return ctx;
}
