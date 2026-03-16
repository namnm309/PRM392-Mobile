# Đồng bộ 3 dự án TechStore

Khi sửa **PRM392-Mobile**, cần kiểm tra **PRM392-Mobile-BE** và **PRM392-TechStore-AdminDasboard**.

## Cấu trúc

| Dự án | Vai trò | URL deploy |
|-------|---------|------------|
| PRM392-Mobile | App Expo (client) | - |
| PRM392-Mobile-BE | API + SignalR | techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net |
| PRM392-TechStore-AdminDasboard | Admin Web | techstorefe.azurewebsites.net |

## Cần kiểm tra khi sửa

### API / SignalR URL
- Backend base: `https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net`
- Hub: `.../hubs/support-chat`
- **Không dùng** `TechStoreBE:80` (gây 404)

### PRM392-Mobile-BE
- `Program.cs`: AddSignalR, MapHub, CORS, middleware order
- `appsettings.json`: ReturnUrl (VnPay)
- JWT: đọc `access_token` từ query khi path `hubs/` (ClerkJwtBearerPostConfigure)
- **401 Unauthorized**: User phải có trong bảng Users (ClerkId). Webhook Clerk hoặc POST /api/Users.

### PRM392-TechStore-AdminDasboard
- `src/lib/api.ts`: API_BASE_URL, override URL sai
- `src/app/admin/chat/page.tsx`: SignalR hub URL
- `.env.local.example`, workflow: env vars
