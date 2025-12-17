using Chat.Application.Interfaces.Services.Chat;
using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    private readonly IChatService _chatService;

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    public async Task JoinChat(string chatId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatId);
    }

    public async Task SendMessage(string chatId, string message)
    {
        var senderId = Context.UserIdentifier;

        if (string.IsNullOrEmpty(senderId))
            throw new HubException("Unauthorized");

        var savedMessage = await _chatService.SendMessageAsync(
            int.Parse(chatId),
            senderId,
            message
        );

        await Clients.Group(chatId).SendAsync(
            "ReceiveMessage",
            senderId,
            savedMessage.Content
        );
    }

    public async Task LeaveChat(string chatId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId);
    }
}
