# Fix lỗi FE gọi sai domain TechStoreBE:80

## ✅ Trong code hiện tại KHÔNG còn TechStoreBE:80

- **lib/supportChatService.ts**: Hub URL **hardcode** đúng:
  ```
  https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net/hubs/support-chat
  ```
- **constants/api.ts**: `DEFAULT_BACKEND_URL` đúng + override nếu env sai
- **Admin Dashboard** `src/app/admin/chat/page.tsx`: Hub URL hardcode đúng

## 🔍 Nếu log vẫn hiện TechStoreBE:80

### 1. Xóa cache Expo / Metro (bắt buộc)

```bash
npx expo start -c
```

Hoặc:
```bash
rm -rf node_modules/.cache
npx expo start --clear
```

### 2. Kiểm tra file .env.local (gitignore, không commit)

```bash
# Trong thư mục PRM392-Mobile
type .env.local   # Windows
# hoặc
cat .env.local    # Mac/Linux
```

**PHẢI SỬA** nếu có:
```
EXPO_PUBLIC_API_BASE_URL=https://TechStoreBE:80   ❌ SAI
```

**Thành:**
```
EXPO_PUBLIC_API_URL=https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net
```

Hoặc **xóa .env.local** nếu không cần override (code sẽ dùng default đúng).

### 3. Xóa app cũ trên điện thoại / emulator

- Gỡ app Expo Go hoặc build cũ
- Cài lại / mở lại từ `expo start -c`

### 4. Kiểm tra log khi mở Chat

Mở màn "Chat với nhân viên", xem log console:
```
[SupportChat] Đang kết nối: https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net/hubs/support-chat
```

Nếu thấy `TechStoreBE:80` → **chưa load code mới**, cần bước 1–3.

### 5. Admin Dashboard (techstorefe)

- Kiểm tra **GitHub Secrets**: `NEXT_PUBLIC_API_BASE_URL` hoặc `NEXT_PUBLIC_API_URL`
- Phải = `https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net`
- **Rebuild và deploy** lại sau khi sửa secret

## 📁 Các file liên quan

| Project | File | Mục đích |
|---------|------|----------|
| Mobile | `lib/supportChatService.ts` | SignalR hub URL (hardcode) |
| Mobile | `constants/api.ts` | API base (env + override) |
| Mobile | `.env.example` | Mẫu env đúng |
| Dashboard | `src/app/admin/chat/page.tsx` | Hub URL (hardcode) |
| Dashboard | `src/lib/api.ts` | API base (env + override) |
