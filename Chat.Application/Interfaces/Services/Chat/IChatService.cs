using Chat.Core.Entities;

namespace Chat.Application.Interfaces.Services.Chat
{
    public interface IChatService
    {
        Task<ChatSession> CreateSessionAsync(string userId);
        Task<Message> SendMessageAsync(int sessionId, string senderId, string content);
        Task CloseSessionAsync(int sessionId);
        Task<IEnumerable<Message>> GetMessagesAsync(int sessionId);
    }
}
