using Chat.Application.Models;
using Chat.Core.Entities;
namespace Chat.Application.Interfaces.Services.Chat
{
    public interface IChatAdminService
    {
        Task<IEnumerable<ChatSessionVM>> GetAllSessionsAsync();
        Task<ChatSessionDetailsVM> GetSessionWithMessagesAsync(int sessionId);
    }
}
