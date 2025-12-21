namespace Chat.Application.Interfaces.Services.Chat
{
    public interface IChatAdminService
    {
        Task<IEnumerable<ChatSessionVM>> GetAllActiveSessionsAsync();
        Task<ChatSessionDetailsVM> GetSessionWithMessagesAsync(int sessionId);
        Task<List<ChatSessionDetailsVM>> GetSessionsByUserAsync(string userId);

    }
}
