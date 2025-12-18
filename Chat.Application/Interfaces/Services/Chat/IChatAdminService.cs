using Chat.Application.Models;
using Chat.Core.Entities;
namespace Chat.Application.Interfaces.Services.Chat
{
    public interface IChatAdminService
    {
        Task<IEnumerable<ChatSessionVM>> GetAllSessionsAsync();
        Task<ChatSessionDetailsVM> GetSessionWithMessagesAsync(int sessionId);
        Task<List<ChatSessionDashboardVM>> GetDashboardAsync();
        Task<List<ChatSessionDetailsVM>> GetSessionsByUserAsync(string userId);
        Task<IEnumerable<ChatSession>> GetActiveSessionsAsync();

    }
}
