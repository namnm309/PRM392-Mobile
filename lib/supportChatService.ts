import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '@/constants/api';

const BASE = API_BASE_URL?.replace(/\/$/, '') ?? '';

export interface SupportChatMessage {
  id: string;
  content: string;
  senderRole: 'user' | 'staff';
  senderName: string;
  createdAt: Date;
}

export interface SupportChatConnection {
  connection: signalR.HubConnection;
  messages: SupportChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  disconnect: () => Promise<void>;
  onNewMessage: (callback: (msg: SupportChatMessage) => void) => () => void;
}

const HUB_URL = `${BASE}/hubs/support-chat`;

export async function createSupportChatConnection(
  getToken: () => Promise<string | null>
): Promise<SupportChatConnection> {
  if (!BASE) throw new Error('API_BASE_URL chưa được cấu hình');
  const token = await getToken();
  if (!token) throw new Error('Vui lòng đăng nhập để chat với nhân viên');

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => Promise.resolve(token),
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  const messages: SupportChatMessage[] = [];
  const listeners: Array<(msg: SupportChatMessage) => void> = [];

  connection.on('MessageSent', (data: { id: string; content: string; createdAt: string }) => {
    const msg: SupportChatMessage = {
      id: data.id,
      content: data.content,
      senderRole: 'user',
      senderName: 'Bạn',
      createdAt: new Date(data.createdAt),
    };
    messages.push(msg);
    listeners.forEach((cb) => cb(msg));
  });

  connection.on('ReceiveStaffMessage', (data: { id: string; content: string; createdAt: string; senderName: string }) => {
    const msg: SupportChatMessage = {
      id: data.id,
      content: data.content,
      senderRole: 'staff',
      senderName: data.senderName || 'Nhân viên',
      createdAt: new Date(data.createdAt),
    };
    messages.push(msg);
    listeners.forEach((cb) => cb(msg));
  });

  connection.on('Error', (err: string) => {
    console.error('[SupportChat] Error:', err);
  });

  await connection.start();

  const history = await connection.invoke<Array<{ id: string; content: string; senderRole: string; senderName: string; createdAt: string }>>('GetMyMessages');
  if (history?.length) {
    history.forEach((h) => {
      messages.push({
        id: h.id,
        content: h.content,
        senderRole: h.senderRole as 'user' | 'staff',
        senderName: h.senderName,
        createdAt: new Date(h.createdAt),
      });
    });
  }

  return {
    connection,
    messages,
    sendMessage: async (content: string) => {
      await connection.invoke('SendUserMessage', content);
    },
    disconnect: async () => {
      await connection.stop();
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
