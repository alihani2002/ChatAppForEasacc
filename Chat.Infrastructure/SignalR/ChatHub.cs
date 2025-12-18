using Chat.Application.Interfaces.Services.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize] // هذا السطر يعني أنه لا يسمح لأي شخص بالاتصال بهذا الـ Hub إلا إذا كان مسجلاً للدخول (Authenticated)
public class ChatHub : Hub // تعريف كلاس اسمه ChatHub ويرث من الكلاس الأساسي Hub التابع لـ SignalR
{
    private readonly IChatService _chatService; // تعريف متغير داخلي للتعامل مع خدمات الشات (مثل حفظ الرسائل)

    // الـ Constructor: هنا نقوم بـ "حقن" (Inject) خدمة الشات لاستخدامها داخل الكلاس
    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public async Task JoinChat(string chatId)
    {
        // يقوم بإضافة "اتصال المستخدم الحالي" إلى "مجموعة" محددة برقم المحادثة
        // هذا يسمح لنا بإرسال رسائل لكل الموجودين في هذه المحادثة فقط
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
    }

    public async Task SendMessage(string chatId, string message)
    {
        var senderId = Context.UserIdentifier;

        if (string.IsNullOrEmpty(senderId))
            throw new HubException("Unauthorized");

        // حفظ الرسالة في قاعدة البيانات
        var savedMessage = await _chatService.SendMessageAsync(
            int.Parse(chatId),
            senderId,
            message
        );

        // إرسال الرسالة لجميع المشتركين في المحادثة مع معرف الرسالة
        await Clients.Group(chatId).SendAsync(
            "ReceiveMessage",
            senderId,
            savedMessage.Content,
            savedMessage.CreatedOn.ToString("HH:mm"),
            savedMessage.Id // ← إرجاع معرف الرسابة
        );
    }

    // وظيفة مشابهة لـ JoinChat ولكنها تستخدم كلمة "chat-" قبل الرقم لتمييز المجموعات الخاصة بالجلسات
    public async Task JoinSession(string sessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"chat-{sessionId}");
    }

    // وظيفة لإرسال رسالة سريعة داخل الجلسة دون حفظها (أو حسب منطق العمل)
    public async Task SendMessageToSession(string sessionId, string message)
    {
        await Clients.Group($"chat-{sessionId}")
            .SendAsync("ReceiveMessage", Context.UserIdentifier, message);
    }

    public async Task LeaveChat(string chatId)
    {
        // إزالة المستخدم من المجموعة لكي لا تصله تنبيهات أو رسائل جديدة من هذه المحادثة
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;

        if (!string.IsNullOrEmpty(userId))
        {
            // استدعاء السيرفس لإغلاق الجلسة فور انقطاع الاتصال (Refresh أو إغلاق الصفحة)
            await _chatService.CloseSessionAsync(userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // إضافة هذه الوظيفة إلى ChatHub
    public async Task NotifyTyping(string chatId, string userId)
    {
        // إرسال إشعار الكتابة لكل الموجودين في المحادثة عدا المرسل
        await Clients.Group(chatId).SendAsync("UserTyping", chatId, userId);
    }
}