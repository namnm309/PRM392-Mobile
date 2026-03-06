# Tại sao lỗi token chỉ xảy ra trên Emulator mà không trên iPhone?

Thông báo: *"Tài khoản đã có trên máy chủ nhưng token không được chấp nhận"* xuất hiện khi:
1. Backend trả về **401** cho `GET /api/Users/me` (token không hợp lệ),
2. Sau đó app gọi `POST /api/Users` để tạo user → backend trả **400 "already exists"** (user đã có).

Tức là **backend từ chối JWT** trong khi user thật sự đã tồn tại. Các lý do thường gặp khi **chỉ emulator bị**:

---

## 1. Lệch giờ (Clock skew) – rất hay gặp

Backend đang dùng **`ClockSkew = TimeSpan.Zero`**: chỉ cần lệch vài giây giữa đồng hồ Clerk (lúc ký token) và đồng hồ máy chủ Azure (lúc kiểm tra) là token có thể bị coi là hết hạn hoặc chưa có hiệu lực.

- **Emulator Android** thường đồng hồ **sai** (chưa bật “Automatic date & time” / chưa sync NTP).
- **iPhone** thường đồng bộ giờ tốt hơn nên ít bị.

**Cách xử lý:**

- Trên **emulator**: Vào **Settings → System → Date & time** → bật **Automatic date & time** (và **Automatic time zone** nếu có).
- Trên **backend**: Cho phép lệch giờ nhỏ (ví dụ 1–2 phút) bằng cách đặt `ClockSkew` (xem hướng dẫn trong repo backend).

---

## 2. Emulator đang gọi backend khác (URL khác)

Nếu trên emulator bạn dùng **`.env.local`** (hoặc biến môi trường) với `EXPO_PUBLIC_API_BASE_URL` trỏ tới:

- backend chạy **local** (máy bạn), hoặc  
- một **slot/deploy khác** trên Azure,

thì backend đó có thể:

- Chưa cấu hình **`Clerk:JwksUrl`** đúng với Clerk instance mà app đang dùng, hoặc  
- Đang dùng instance Clerk khác (dev/staging).

Trên iPhone, nếu không override env, app sẽ dùng **default API URL** (ví dụ Azure production) – nơi đã cấu hình đúng Clerk.

**Cách kiểm tra:** In hoặc log `API_BASE_URL` khi chạy trên emulator và khi chạy trên iPhone (Expo). Phải **trùng nhau** nếu muốn hành vi giống nhau.

---

## 3. Token cũ / cache trên emulator

Trên emulator có thể đang dùng **token đã lưu từ trước** (khi backend còn cấu hình Clerk cũ hoặc key đã đổi). Backend hiện tại dùng JWKS mới nên không chấp nhận token đó → 401. Trên iPhone bạn có thể đã đăng xuất/đăng nhập lại nên luôn có token mới.

**Cách xử lý:** Trên emulator: **đăng xuất**, xóa data app (hoặc gỡ cài đặt rồi cài lại), sau đó **đăng nhập lại** để lấy token mới.

---

## 4. Backend không lấy được JWKS (chỉ khi emulator gọi backend khác)

Backend khi nhận request sẽ **tải JWKS từ `Clerk:JwksUrl`**. Nếu emulator gọi **backend chạy local** (trên máy bạn) và máy đó:

- Không ra được internet, hoặc  
- Firewall/proxy chặn truy cập tới Clerk,

thì backend không lấy được JWKS → không xác thực được token → 401. iPhone gọi Azure thì Azure thường ra internet bình thường.

**Cách xử lý:** Đảm bảo backend mà emulator đang gọi (local hoặc Azure slot) có thể **GET** được `Clerk:JwksUrl` và **`Clerk:JwksUrl` trùng Clerk instance của app** (xem CLERK_SETUP.md).

---

## Tóm tắt kiểm tra nhanh

| Kiểm tra | Emulator | iPhone |
|----------|----------|--------|
| Đồng hồ hệ thống đúng giờ? | Cần bật Automatic date & time | Thường đã đúng |
| `EXPO_PUBLIC_API_BASE_URL` có giống nhau? | So sánh với build chạy trên iPhone | Cùng env với emulator |
| Đã đăng xuất + đăng nhập lại sau khi đổi backend/Clerk? | Nên thử | Đã thử thì tốt |
| Backend (mà client đang gọi) cấu hình đúng Clerk:JwksUrl? | Đúng với instance app dùng | Cùng backend thì cùng cấu hình |

Sau khi chỉnh đồng hồ emulator, đảm bảo cùng backend và cùng Clerk instance, và đăng nhập lại trên emulator, lỗi thường sẽ hết. Nếu vẫn 401, nên bật log JWT trên backend (OnAuthenticationFailed) và kiểm tra `Clerk:JwksUrl` có fetch thành công không.
