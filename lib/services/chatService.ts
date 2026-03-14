import { API_BASE_URL } from '@/lib/api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SendMessageOptions {
  imageBase64?: string;
  imageFormat?: 'png' | 'jpeg';
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content?: string;
  primaryProductId?: string | null;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string; code?: string };
}

export type SendMessageResult = { content: string; primaryProductId?: string | null };

const SYSTEM_PROMPT_TECHSTORE = `BẠN LÀ TRỢ LÝ TƯ VẤN CỦA TECHSTORE - CỬA HÀNG CÔNG NGHỆ TẠI VIỆT NAM.

QUY TẮC BẮT BUỘC:
- Chỉ trả lời bằng TIẾNG VIỆT. Tuyệt đối không dùng tiếng Anh, tiếng khác hoặc từ lạ.
- Chỉ nói về đồ công nghệ: điện thoại, laptop, tablet, tai nghe, sạc, phụ kiện, màn hình, PC, linh kiện.
- Nếu câu hỏi không liên quan công nghệ: từ chối lịch sự, gợi ý hỏi về sản phẩm.

ĐỊNH DẠNG KHI LIỆT KÊ SẢN PHẨM (bắt buộc):
- Mỗi sản phẩm một dòng, dùng format: - Tên sản phẩm: giá đ
- Ví dụ: - iPhone 15 Pro: 32.990.000đ
- Ví dụ: - Samsung Galaxy S24: 27.990.000đ
- KHÔNG dùng bảng, KHÔNG dùng ký tự | để phân tách. Chỉ ghi tên và giá, vừa đủ, dễ đọc.

KHI NGƯỜI DÙNG HỎI VỀ MỘT SẢN PHẨM CỤ THỂ (ví dụ: iPhone 15, Samsung Galaxy, laptop Acer...):
Hãy khai thác đầy đủ:
1. Thông số kỹ thuật: chip, RAM, bộ nhớ, màn hình (kích thước, tần số quét, độ phân giải), pin, camera
2. Tính năng vượt trội: điểm mạnh so với phiên bản cũ hoặc đối thủ
3. Ưu điểm phù hợp với nhu cầu: gaming, làm việc, chụp ảnh, giải trí...
4. Giá (nếu biết) và gợi ý mua hàng
Cuối cùng hỏi: "Bạn có muốn so sánh với sản phẩm nào khác không?"

CHỦ ĐỀ KHÁC (khi không hỏi sản phẩm cụ thể):
- Bảo hành, đổi trả: nêu chính sách rõ ràng
- Đặt hàng, thanh toán VNPay, giao hàng GHN: hướng dẫn ngắn gọn
- Mã giảm giá, voucher: thông tin chung

PHONG CÁCH: Ngắn gọn, thân thiện, dễ hiểu. Dùng số liệu cụ thể. Tránh câu dài dòng. Không dùng markdown phức tạp.`;

export const COMPARE_SYSTEM_PROMPT = `Bạn là chuyên gia so sánh sản phẩm công nghệ tại TechStore.
QUY TẮC: Chỉ trả lời bằng TIẾNG VIỆT. Không dùng ngôn ngữ khác.
Nhiệm vụ: so sánh hai sản phẩm dưới đây, nêu rõ:
1. Thông số kỹ thuật chênh lệch (chip, RAM, màn hình, pin, camera...)
2. Ưu điểm và nhược điểm từng sản phẩm
3. Chênh lệch giá
4. Gợi ý chọn sản phẩm nào theo nhu cầu (ngân sách, gaming, làm việc...)
Trả lời ngắn gọn, có cấu trúc, chỉ dùng tiếng Việt.`;

/**
 * Gửi tin nhắn tới TechStore BE. Backend proxy tới Mega LLM (OpenAI-compatible).
 * Dùng fetch trực tiếp (không qua useApiClient) vì /api/chat là AllowAnonymous.
 */
async function sendChatMessage(
  messages: ChatMessage[],
  options?: SendMessageOptions
): Promise<SendMessageResult> {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL chưa được cấu hình. Kiểm tra EXPO_PUBLIC_API_BASE_URL trong .env.local');
  }

  const url = `${API_BASE_URL}/api/chat`;
  const body: Record<string, unknown> = {
    messages,
    systemPrompt: options?.systemPrompt ?? SYSTEM_PROMPT_TECHSTORE,
  };
  if (options?.imageBase64) {
    body.imageBase64 = options.imageBase64;
    body.imageFormat = options.imageFormat ?? 'jpeg';
  }
  if (options?.model) body.model = options.model;
  if (options?.temperature != null) body.temperature = options.temperature;
  if (options?.maxTokens != null) body.max_tokens = options.maxTokens;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as ChatResponse;

  if (!res.ok) {
    const msg = (data as { message?: string }).message ?? `Lỗi ${res.status}`;
    throw new Error(msg);
  }

  if (data.error) {
    throw new Error(data.error.message ?? 'Lỗi từ AI');
  }
  if (data.content) {
    return {
      content: data.content,
      primaryProductId: data.primaryProductId ?? null,
    };
  }
  throw new Error('Phản hồi từ AI không hợp lệ');
}

export function useChatService() {
  return {
    sendMessage: sendChatMessage,
  };
}
