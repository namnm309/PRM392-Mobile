import { API_BASE_URL } from '@/lib/api';
import { useApiClient } from '@/lib/api';

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
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string; code?: string };
}

const SYSTEM_PROMPT_TECHSTORE = `Bạn là trợ lý AI của TechStore - cửa hàng công nghệ. Bạn giúp người dùng:
- Tìm sản phẩm điện thoại, laptop, tablet, phụ kiện
- So sánh giá, tư vấn mua hàng
- Hỏi về chính sách bảo hành, đổi trả
- Hướng dẫn đặt hàng, thanh toán VNPay, giao hàng GHN
- Mã giảm giá, voucher
Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Không dùng markdown phức tạp.
Khi tư vấn về một sản phẩm cụ thể, cuối câu hãy hỏi: "Bạn có muốn so sánh với sản phẩm nào khác không?"`;

export const COMPARE_SYSTEM_PROMPT = `Bạn là chuyên gia so sánh sản phẩm TechStore. Nhiệm vụ: so sánh hai sản phẩm dưới đây, nêu rõ:
1. Ưu điểm và nhược điểm của từng sản phẩm
2. Chênh lệch giá giữa hai sản phẩm
3. Gợi ý nên chọn sản phẩm nào cho từng nhu cầu (ngân sách, hiệu năng, v.v.)
Trả lời ngắn gọn, có cấu trúc, bằng tiếng Việt.`;

/**
 * Gửi tin nhắn tới TechStore BE. Backend proxy tới Mega LLM (OpenAI-compatible).
 * Endpoint: POST {API_BASE_URL}/api/chat
 * Cấu trúc theo Finmate: useChatService hook, useApiClient
 */
export function useChatService() {
  const { post } = useApiClient();

  const sendMessage = async (
    messages: ChatMessage[],
    options?: SendMessageOptions
  ): Promise<string> => {
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

    const response = (await post(url, body)) as ChatResponse;

    if (response.error) {
      throw new Error(response.error.message ?? 'Lỗi từ AI');
    }

    if (response.content) return response.content;
    throw new Error('Phản hồi từ AI không hợp lệ');
  };

  return { sendMessage };
}
