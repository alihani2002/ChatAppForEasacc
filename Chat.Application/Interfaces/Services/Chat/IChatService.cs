namespace Chat.Application.Interfaces.Services
{
    public interface IChatService
    {
        Task<ChatSession> CreateSessionAsync(string userId);
        Task<MessageVM> SendMessageAsync(int sessionId, string senderId, string content);
        Task<MessageVM> SendFileMessageAsync(
        int sessionId,string senderId,string fileUrl,string fileName,MessageType messageType);
        Task CloseSessionAsync(string userId);
        Task<IEnumerable<Message>> GetMessagesAsync(int sessionId);

        Task<Message?> GetMessageAsync(int messageId);
        Task<bool> UpdateMessageStatusAsync(int messageId, MessageStatus status);

        Task<IEnumerable<ChatSession>> GetActiveSessionsAsync();
        Task AssignAdminToSessionAsync(int sessionId, string adminId);
    }
}