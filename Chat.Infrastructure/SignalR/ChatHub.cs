using Chat.Application.Interfaces.Services;
using Chat.Core.Entities;
using Chat.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private static readonly ConcurrentDictionary<string, string> _userConnections = new();
    private static readonly ConcurrentDictionary<string, HashSet<string>> _typingUsers = new();
    private static readonly ConcurrentDictionary<string, DateTime> _lastActivity = new();

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
            _lastActivity[userId] = DateTime.UtcNow;

            await base.OnConnectedAsync();
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        var connectionId = Context.ConnectionId;

        _userConnections.TryRemove(connectionId, out _);
        foreach (var chat in _typingUsers)
        {
            chat.Value.Remove(userId);
        }

        if (!string.IsNullOrEmpty(userId))
        {
            var remainingConnections = _userConnections.Values.Count(v => v == userId);
            if (remainingConnections == 0)
            {
                await _chatService.CloseSessionAsync(userId);
                _lastActivity.TryRemove(userId, out _);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinChat(string chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);

        var userId = Context.UserIdentifier;
        _lastActivity[userId] = DateTime.UtcNow;

        await Clients.Group(chatId).SendAsync("UserJoined", userId);

        var messages = await _chatService.GetMessagesAsync(int.Parse(chatId));
        foreach (var msg in messages)
        {
            if (msg.MessageType == MessageType.Text)
            {
                await Clients.Caller.SendAsync("ReceiveMessage",
                    msg.SenderId,
                    msg.Content,
                    msg.CreatedOn.ToString("HH:mm"),
                    msg.Id);
            }
            else
            {
                await Clients.Caller.SendAsync("ReceiveFileMessage", new
                {
                    MessageId = msg.Id,
                    FileUrl = msg.FileUrl,
                    MessageType = (int)msg.MessageType,
                    FileName = msg.FileName,
                    Time = msg.CreatedOn.ToString("HH:mm"),
                    SenderId = msg.SenderId
                });
            }
        }
    }

    public async Task SendMessage(string chatId, string message)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId))
            throw new HubException("Unauthorized");

        _lastActivity[senderId] = DateTime.UtcNow;

        var savedMessage = await _chatService.SendMessageAsync(
            int.Parse(chatId),
            senderId,
            message
        );

        await Clients.Group(chatId).SendAsync(
            "ReceiveMessage",
            senderId,
            savedMessage.Content,
            savedMessage.CreatedOn.ToString("HH:mm"),
            savedMessage.Id
        );

        _ = Task.Run(async () =>
        {
            await Task.Delay(500); 
            await _chatService.UpdateMessageStatusAsync(savedMessage.Id, MessageStatus.Delivered);
            await Clients.Caller.SendAsync("MessageStatusUpdated",
                savedMessage.Id,
                MessageStatus.Delivered);
        });
    }

    public async Task StartTyping(string chatId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        _typingUsers.AddOrUpdate(chatId,
            new HashSet<string> { userId },
            (key, existingSet) => { existingSet.Add(userId); return existingSet; });

        await Clients.OthersInGroup(chatId).SendAsync("UserStartedTyping", chatId, userId);
    }

    public async Task StopTyping(string chatId)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        if (_typingUsers.TryGetValue(chatId, out var users))
        {
            users.Remove(userId);

            if (users.Count == 0)
            {
                await Clients.Group(chatId).SendAsync("UserStoppedTyping", chatId, userId);
            }
        }
    }

    public async Task LeaveChat(string chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
        var userId = Context.UserIdentifier;
        await Clients.Group(chatId).SendAsync("UserLeft", userId);
    }

    public async Task UpdateMessageStatus(int messageId, MessageStatus status)
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return;

        var updated = await _chatService.UpdateMessageStatusAsync(messageId, status);
        if (updated)
        {
            var message = await _chatService.GetMessageAsync(messageId);
            if (message != null && message.SenderId != userId)
            {
                await Clients.User(message.SenderId).SendAsync("MessageStatusUpdated", messageId, status);
            }
        }
    }

    public async Task BroadcastFileMessage(string chatId, object fileMessageData)
    {
        await Clients.Group(chatId).SendAsync("ReceiveFileMessage", fileMessageData);
    }

    public DateTime? GetUserLastActivity(string userId)
    {
        return _lastActivity.TryGetValue(userId, out var lastActivity) ? lastActivity : null;
    }

    public static async Task CheckAndCloseInactiveChats(IHubContext<ChatHub> hubContext, IChatService chatService)
    {
        var now = DateTime.UtcNow;
        foreach (var activity in _lastActivity)
        {
            if ((now - activity.Value).TotalMinutes >= 1) 
            {
                var connections = _userConnections
                    .Where(c => c.Value == activity.Key)
                    .Select(c => c.Key);

                foreach (var conn in connections)
                {
                    await hubContext.Clients.Client(conn).SendAsync("SessionTimeout",
                        "The chat will be terminated because we have not received a response from you.");
                }

                await chatService.CloseSessionAsync(activity.Key);
                _lastActivity.TryRemove(activity.Key, out _);
            }
        }
    }

    public async Task<IEnumerable<ChatSession>> GetActiveSessions()
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return new List<ChatSession>();

        return await _chatService.GetActiveSessionsAsync();
    }

    public async Task AssignToSession(int sessionId)
    {
        var adminId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(adminId)) return;

        await _chatService.AssignAdminToSessionAsync(sessionId, adminId);

        var session = await _chatService.GetActiveSessionsAsync();
        var targetSession = session.FirstOrDefault(s => s.Id == sessionId);
        if (targetSession != null)
        {
            await Clients.User(targetSession.UserId).SendAsync("AdminAssigned", adminId);
        }
    }
}