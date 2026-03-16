import { API_BASE_URL } from '@/constants/api';

const CHAT_API = `${API_BASE_URL}/api/support-chat`;
const POLL_INTERVAL_MS = 3000;
const REQUEST_TIMEOUT_MS = 12000;

export interface SupportChatMessage {
  id: string;
  content: string;
  senderRole: 'user' | 'staff';
  senderName: string;
  createdAt: Date;
}

export interface SupportChatConnection {
  messages: SupportChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  disconnect: () => void;
  onNewMessage: (callback: (msg: SupportChatMessage) => void) => () => void;
}

function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(msg)), ms)),
  ]);
}

async function apiFetch(url: string, getToken: () => Promise<string | null>, options?: RequestInit) {
  const token = await getToken();
  if (!token) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  const res = await withTimeout(
    fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers || {}),
      },
    }),
    REQUEST_TIMEOUT_MS,
    'Kết nối quá lâu. Kiểm tra mạng hoặc thử lại.'
  );
  if (!res.ok) {
    if (res.status === 401) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    const body = await res.text().catch(() => '');
    throw new Error(`Lỗi server (${res.status}): ${body || res.statusText}`);
  }
  return res.json();
}

/**
 * Tạo kết nối chat dùng HTTP polling thay vì SignalR.
 * Gọi GET /api/support-chat/messages mỗi 3 giây để nhận tin nhắn mới.
 * Gọi POST /api/support-chat/send để gửi tin nhắn.
 */
export async function createSupportChatConnection(
  getToken: () => Promise<string | null>
): Promise<SupportChatConnection> {
  console.log('[Chat] Bắt đầu kết nối...', CHAT_API);
  const token = await getToken();
  if (!token) throw new Error('Vui lòng đăng nhập để chat với nhân viên');
  console.log('[Chat] Có token, đang tải tin nhắn...');

  const messages: SupportChatMessage[] = [];
  const listeners: Array<(msg: SupportChatMessage) => void> = [];
  let lastMessageTime: string | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  function parseMessage(raw: { id: string; content: string; senderRole: string; senderName: string; createdAt: string }): SupportChatMessage {
    return {
      id: raw.id,
      content: raw.content,
      senderRole: raw.senderRole as 'user' | 'staff',
      senderName: raw.senderName,
      createdAt: new Date(raw.createdAt),
    };
  }

  let initial: Array<{ id: string; content: string; senderRole: string; senderName: string; createdAt: string }> = [];
  try {
    initial = await apiFetch(`${CHAT_API}/messages`, getToken);
    console.log('[Chat] Tải xong:', initial?.length ?? 0, 'tin nhắn');
  } catch (err) {
    console.warn('[Chat] Lỗi tải tin nhắn ban đầu:', err instanceof Error ? err.message : err);
    throw err;
  }

  if (initial?.length) {
    for (const raw of initial) {
      messages.push(parseMessage(raw));
    }
    const last = initial[initial.length - 1];
    lastMessageTime = last.createdAt;
  }

  async function poll() {
    if (stopped) return;
    try {
      const url = lastMessageTime
        ? `${CHAT_API}/messages?after=${encodeURIComponent(lastMessageTime)}`
        : `${CHAT_API}/messages`;
      const newMsgs: Array<{ id: string; content: string; senderRole: string; senderName: string; createdAt: string }> =
        await apiFetch(url, getToken);

      if (newMsgs?.length) {
        const existingIds = new Set(messages.map((m) => m.id));
        for (const raw of newMsgs) {
          if (existingIds.has(raw.id)) continue;
          const msg = parseMessage(raw);
          messages.push(msg);
          listeners.forEach((cb) => cb(msg));
        }
        lastMessageTime = newMsgs[newMsgs.length - 1].createdAt;
      }
    } catch {
      // polling lỗi → bỏ qua, thử lại lần sau
    }
  }

  pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  console.log('[Chat] Kết nối thành công, polling mỗi', POLL_INTERVAL_MS, 'ms');

  return {
    messages,
    sendMessage: async (content: string) => {
      const result = await apiFetch(`${CHAT_API}/send`, getToken, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      const existingIds = new Set(messages.map((m) => m.id));
      if (!existingIds.has(result.id)) {
        const msg = parseMessage(result);
        messages.push(msg);
        lastMessageTime = result.createdAt;
        listeners.forEach((cb) => cb(msg));
      }
    },
    disconnect: () => {
      stopped = true;
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
    onNewMessage: (callback: (msg: SupportChatMessage) => void) => {
      listeners.push(callback);
      return () => {
        const i = listeners.indexOf(callback);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
  };
}
