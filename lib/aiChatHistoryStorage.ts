import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatbotDisplayMessage } from '@/contexts/ai-chatbot-context';

const STORAGE_KEY = 'ai_chat_history_v1';

interface StoredChat {
  userId: string;
  messages: ChatbotDisplayMessage[];
}

export async function loadChatHistory(userId: string | null): Promise<ChatbotDisplayMessage[]> {
  if (!userId) return [];
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed: StoredChat = JSON.parse(json);
    if (parsed?.userId === userId && Array.isArray(parsed?.messages)) {
      return parsed.messages as ChatbotDisplayMessage[];
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveChatHistory(userId: string | null, messages: ChatbotDisplayMessage[]): Promise<void> {
  if (!userId) return;
  try {
    const data: StoredChat = { userId, messages };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

/** Gọi khi user logout - xóa toàn bộ lịch sử chat */
export async function clearChatHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
