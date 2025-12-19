using Chat.Application.Interfaces.Services.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private static readonly Dictionary<string, string> _userConnections = new();
    private static readonly Dictionary<string, HashSet<string>> _typingUsers = new();

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (!string.IsNullOrEmpty(userId))
        {
            _userConnections[Context.ConnectionId] = userId;
            await base.OnConnectedAsync();
        }
    }

    public async Task JoinChat(string chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);

        // إرسال إشعار دخول المستخدم
        var userId = Context.UserIdentifier;
        await Clients.Group(chatId).SendAsync("UserJoined", userId);
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

        // إرسال الرسالة لجميع المشتركين في المحادثة
        await Clients.Group(chatId).SendAsync(
            "ReceiveMessage",
            senderId,
            savedMessage.Content,
            savedMessage.CreatedOn.ToString("HH:mm"),
            savedMessage.Id
        );
    }

    // مؤشر الكتابة
    public async Task StartTyping(string chatId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        // تخزين المستخدم الذي يكتب
        if (!_typingUsers.ContainsKey(chatId))
        {
            _typingUsers[chatId] = new HashSet<string>();
        }

        if (!_typingUsers[chatId].Contains(userId))
        {
            _typingUsers[chatId].Add(userId);

            // إرسال إشعار للجميع عدا المرسل
            await Clients.Group(chatId).SendAsync("UserStartedTyping", chatId, userId);
        }
    }

    public async Task StopTyping(string chatId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        // إزالة المستخدم من القائمة
        if (_typingUsers.ContainsKey(chatId))
        {
            _typingUsers[chatId].Remove(userId);

            // إرسال إشعار إيقاف الكتابة
            await Clients.Group(chatId).SendAsync("UserStoppedTyping", chatId, userId);
        }
    }

    public async Task LeaveChat(string chatId)
    {
        // إزالة المستخدم من المجموعة
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);

        // إرسال إشعار خروج
        var userId = Context.UserIdentifier;
        await Clients.Group(chatId).SendAsync("UserLeft", userId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        var connectionId = Context.ConnectionId;

        // إزالة من القوائم
        if (_userConnections.ContainsKey(connectionId))
        {
            _userConnections.Remove(connectionId);
        }

        // إغلاق الجلسة
        if (!string.IsNullOrEmpty(userId))
        {
            await _chatService.CloseSessionAsync(userId);
        }

        await base.OnDisconnectedAsync(exception);
    }
}