using Chat.Core.Entities;
using Chat.Core.Enums;

namespace Chat.Application.Interfaces.Services
{
    public interface IChatService
    {
        // الدوال الحالية
        Task<ChatSession> CreateSessionAsync(string userId);
        Task<Message> SendMessageAsync(int sessionId, string senderId, string content);
        Task<Message> SendFileMessageAsync(
            int sessionId,
            string senderId,
            string fileUrl,
            string fileName,
            MessageType messageType
        );
        Task CloseSessionAsync(string userId);
        Task<IEnumerable<Message>> GetMessagesAsync(int sessionId);

        // الدوال الجديدة المطلوبة للـ ChatHub
        Task<Message?> GetMessageAsync(int messageId);
        Task<bool> UpdateMessageStatusAsync(int messageId, MessageStatus status);

        // دوال اختيارية (للوحة تحكم المدير)
        Task<IEnumerable<ChatSession>> GetActiveSessionsAsync();
        Task AssignAdminToSessionAsync(int sessionId, string adminId);
        Task<IEnumerable<ChatSession>> GetUserSessionsAsync(string userId);
        Task<IEnumerable<ApplicationUser>> GetAvailableAdminsAsync();
    }
}