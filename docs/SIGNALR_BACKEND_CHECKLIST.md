# SignalR Backend – Kiểm tra cấu hình

Để SignalR kết nối đúng, kiểm tra các mục sau trong **Backend (ASP.NET Core)**.

## 1. Program.cs – Đăng ký SignalR và MapHub

```csharp
builder.Services.AddSignalR();

// ... middleware ...

app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<SupportChatHub>("/hubs/support-chat");
```

## 2. Thứ tự middleware

1. `UseRouting()`
2. `UseCors()`
3. `UseAuthentication()`
4. `UseAuthorization()`
5. `MapControllers()`
6. `MapHub<SupportChatHub>("/hubs/support-chat")`

## 3. Azure App Service – WebSockets

**Azure Portal** → **App Service** → **Configuration** → **General Settings** → **WebSockets** = **ON**

## 4. Hub URL đúng

```
https://techstorebe-fzaza5cvgbhah6fg.eastasia-01.azurewebsites.net/hubs/support-chat
```
